-- 4PetsGo — booking requests, negotiation (3 offers per party, 48 h expiry), atomic mission lock.
-- Clients never write these tables directly: every change goes through the SECURITY DEFINER RPCs below,
-- which re-check identity, turn, floor price and lock state inside a single transaction.

create table public.booking_requests (
  id text primary key check (id ~ '^4PG-[A-Z2-9]{6}$'),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  service text not null check (service in ('boarding', 'homeVisits', 'dogWalking')),
  start_date date not null,
  days integer not null check (days between 1 and 30),
  country text not null references public.pricing_config (country),
  currency text not null,
  floor_cents integer not null check (floor_cents > 0),
  note text check (char_length(note) <= 400),
  status text not null default 'open' check (status in ('open', 'locked', 'expired', 'cancelled')),
  locked_sitter_id uuid references public.profiles (id),
  locked_offer_id uuid,
  locked_at timestamptz,
  created_at timestamptz not null default now()
);
create index booking_requests_owner_idx on public.booking_requests (owner_id, created_at desc);
create index booking_requests_open_idx on public.booking_requests (status) where status = 'open';

create table public.request_pets (
  request_id text not null references public.booking_requests (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  primary key (request_id, pet_id)
);
create index request_pets_pet_idx on public.request_pets (pet_id);

create table public.negotiation_threads (
  request_id text not null references public.booking_requests (id) on delete cascade,
  sitter_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'negotiating' check (status in ('negotiating', 'agreed', 'declined', 'expired', 'closed')),
  primary key (request_id, sitter_id)
);
create index negotiation_threads_sitter_idx on public.negotiation_threads (sitter_id);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  request_id text not null,
  sitter_id uuid not null,
  by_party text not null check (by_party in ('owner', 'sitter')),
  price_cents integer not null check (price_cents > 0),
  message text check (char_length(message) <= 400),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'countered', 'accepted', 'declined', 'expired', 'superseded')),
  foreign key (request_id, sitter_id) references public.negotiation_threads (request_id, sitter_id) on delete cascade
);
create index offers_thread_idx on public.offers (request_id, sitter_id, seq);
create index offers_pending_expiry_idx on public.offers (expires_at) where status = 'pending';

alter table public.booking_requests
  add constraint booking_requests_locked_offer_fk foreign key (locked_offer_id) references public.offers (id);

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique references public.booking_requests (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  sitter_id uuid not null references public.profiles (id) on delete cascade,
  offer_id uuid not null references public.offers (id),
  price_cents integer not null,
  start_date date not null,
  end_date date not null,
  -- pending_payment → confirmed (payment, phase 3) → in_progress → completed | cancelled
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index missions_owner_idx on public.missions (owner_id);
create index missions_sitter_idx on public.missions (sitter_id);

-- ---------------------------------------------------------------------------
-- Access helpers (SECURITY DEFINER to avoid RLS recursion; always scoped to auth.uid()).
-- ---------------------------------------------------------------------------

create or replace function private.is_request_party(p_request_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.booking_requests r where r.id = p_request_id and r.owner_id = (select auth.uid()))
      or exists (select 1 from public.negotiation_threads t where t.request_id = p_request_id and t.sitter_id = (select auth.uid()));
$$;

-- Sensitive data (care, address, codes, mission photos): only the sitter of a CONFIRMED mission,
-- during the authorised window (1 day before start → 1 day after end). Revoked on cancellation (PRD §3.9).
create or replace function private.sitter_has_active_mission_for_pet(p_pet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.missions m
    join public.request_pets rp on rp.request_id = m.request_id
    where rp.pet_id = p_pet_id
      and m.sitter_id = (select auth.uid())
      and m.status in ('confirmed', 'in_progress')
      and current_date between m.start_date - 1 and m.end_date + 1
  );
$$;

grant execute on function private.is_request_party(text) to authenticated;
grant execute on function private.sitter_has_active_mission_for_pet(uuid) to authenticated;
revoke execute on function private.is_request_party(text) from anon, public;
revoke execute on function private.sitter_has_active_mission_for_pet(uuid) from anon, public;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.booking_requests enable row level security;
alter table public.request_pets enable row level security;
alter table public.negotiation_threads enable row level security;
alter table public.offers enable row level security;
alter table public.missions enable row level security;

create policy booking_requests_read on public.booking_requests for select to authenticated
  using ((select private.is_request_party(id)));
create policy request_pets_read on public.request_pets for select to authenticated
  using ((select private.is_request_party(request_id)));
create policy negotiation_threads_read on public.negotiation_threads for select to authenticated
  using (sitter_id = (select auth.uid()) or exists (
    select 1 from public.booking_requests r where r.id = request_id and r.owner_id = (select auth.uid())));
create policy offers_read on public.offers for select to authenticated
  using (sitter_id = (select auth.uid()) or exists (
    select 1 from public.booking_requests r where r.id = request_id and r.owner_id = (select auth.uid())));
create policy missions_read on public.missions for select to authenticated
  using (owner_id = (select auth.uid()) or sitter_id = (select auth.uid()));

-- Care data (vet, medications, microchip) only for the sitter of a confirmed mission, during the mission.
create policy pet_care_sitter_read on public.pet_care for select to authenticated
  using ((select private.sitter_has_active_mission_for_pet(pet_id)));

-- ---------------------------------------------------------------------------
-- Pricing helpers (server-side source of truth for the floor and listed prices)
-- ---------------------------------------------------------------------------

create or replace function private.request_floor_cents(p_service text, p_country text, p_pet_ids uuid[], p_days integer)
returns integer
language sql
stable
set search_path = ''
as $$
  select case when p_service = 'dogWalking' then 1 else (
    select coalesce(sum((c.min_daily_cents ->> private.size_category(p.species, p.weight_kg, b.typical_size))::integer), 0) * p_days
    from public.pets p
    join public.breeds b on b.id = p.breed_id
    cross join public.pricing_config c
    where p.id = any (p_pet_ids) and c.country = p_country
  ) end;
$$;

create or replace function private.listed_price_cents(p_sitter_id uuid, p_service text, p_country text, p_pet_ids uuid[], p_days integer)
returns integer
language sql
stable
set search_path = ''
as $$
  select case when p_service = 'dogWalking' then (
    select s.walk_price_cents * p_days from public.sitter_services s where s.sitter_id = p_sitter_id and s.type = 'dogWalking'
  ) else (
    select sum(greatest(
      coalesce((s.daily_rates ->> private.size_category(p.species, p.weight_kg, b.typical_size))::integer, 0),
      (c.min_daily_cents ->> private.size_category(p.species, p.weight_kg, b.typical_size))::integer
    )) * p_days
    from public.pets p
    join public.breeds b on b.id = p.breed_id
    cross join public.pricing_config c
    join public.sitter_services s on s.sitter_id = p_sitter_id and s.type = p_service
    where p.id = any (p_pet_ids) and c.country = p_country
  ) end;
$$;

create or replace function private.new_mission_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select '4PG-' || string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::integer, 1), '')
  from generate_series(1, 6);
$$;

-- Expires pending offers past their deadline; closes the request when no thread is left.
create or replace function private.apply_expiry(p_request_id text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  with expired as (
    update public.offers o set status = 'expired'
    where o.request_id = p_request_id and o.status = 'pending' and o.expires_at <= now()
    returning o.request_id, o.sitter_id
  )
  update public.negotiation_threads t set status = 'expired'
  from expired e
  where t.request_id = e.request_id and t.sitter_id = e.sitter_id and t.status = 'negotiating';

  update public.booking_requests r set status = 'expired'
  where r.id = p_request_id and r.status = 'open'
    and not exists (select 1 from public.negotiation_threads t where t.request_id = r.id and t.status = 'negotiating');
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs (the only write path for bookings)
-- ---------------------------------------------------------------------------

create or replace function public.create_booking_request(
  p_pet_ids uuid[],
  p_service text,
  p_start_date date,
  p_days integer,
  p_sitter_ids uuid[],
  p_proposed_cents integer default null,
  p_note text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner public.profiles;
  v_floor integer;
  v_id text;
  v_sitter uuid;
  v_price integer;
  v_currency text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_owner from public.profiles where id = v_uid;
  if v_owner.role is distinct from 'owner' then raise exception 'FORBIDDEN'; end if;
  if p_service not in ('boarding', 'homeVisits', 'dogWalking') then raise exception 'INVALID_SERVICE'; end if;
  if p_days is null or p_days not between 1 and 30 then raise exception 'INVALID_DAYS'; end if;
  if p_start_date < current_date then raise exception 'INVALID_DATE'; end if;
  if coalesce(cardinality(p_pet_ids), 0) = 0 then raise exception 'NO_PETS'; end if;
  if coalesce(cardinality(p_sitter_ids), 0) not between 1 and 10 then raise exception 'INVALID_SITTERS'; end if;
  if (select count(*) from public.pets where id = any (p_pet_ids) and owner_id = v_uid) <> cardinality(p_pet_ids) then
    raise exception 'FORBIDDEN';
  end if;
  if p_service = 'dogWalking' and exists (select 1 from public.pets where id = any (p_pet_ids) and species <> 'dog') then
    raise exception 'INVALID_PETS';
  end if;

  v_floor := private.request_floor_cents(p_service, v_owner.country, p_pet_ids, p_days);
  if p_proposed_cents is not null and p_proposed_cents < v_floor then raise exception 'BELOW_MINIMUM'; end if;
  select currency into v_currency from public.pricing_config where country = v_owner.country;

  loop
    v_id := private.new_mission_code();
    begin
      insert into public.booking_requests (id, owner_id, service, start_date, days, country, currency, floor_cents, note)
      values (v_id, v_uid, p_service, p_start_date, p_days, v_owner.country, v_currency, v_floor, nullif(trim(p_note), ''));
      exit;
    exception when unique_violation then
      -- extremely rare collision: draw another code
    end;
  end loop;

  insert into public.request_pets (request_id, pet_id) select v_id, unnest(p_pet_ids);

  foreach v_sitter in array (select array_agg(distinct s) from unnest(p_sitter_ids) s) loop
    if v_sitter = v_uid then raise exception 'INVALID_SITTERS'; end if;
    if not exists (select 1 from public.sitter_services where sitter_id = v_sitter and type = p_service) then
      raise exception 'SITTER_SERVICE_UNAVAILABLE';
    end if;
    v_price := coalesce(p_proposed_cents, private.listed_price_cents(v_sitter, p_service, v_owner.country, p_pet_ids, p_days));
    v_price := greatest(v_price, v_floor);
    insert into public.negotiation_threads (request_id, sitter_id) values (v_id, v_sitter);
    insert into public.offers (request_id, sitter_id, by_party, price_cents, message, expires_at)
    values (v_id, v_sitter, 'owner', v_price, nullif(trim(p_note), ''), now() + interval '48 hours');
  end loop;

  return v_id;
end;
$$;

create or replace function public.respond_to_offer(
  p_request_id text,
  p_sitter_id uuid,
  p_action text,
  p_price_cents integer default null,
  p_message text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_req public.booking_requests;
  v_thread public.negotiation_threads;
  v_offer public.offers;
  v_party text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;

  -- Row lock serialises concurrent answers on the same request: the first acceptance wins,
  -- every later call sees status = 'locked'.
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;

  perform private.apply_expiry(p_request_id);
  select * into v_req from public.booking_requests where id = p_request_id;
  if v_req.status = 'locked' then raise exception 'REQUEST_LOCKED'; end if;
  if v_req.status <> 'open' then raise exception 'REQUEST_CLOSED'; end if;

  if v_req.owner_id = v_uid then
    v_party := 'owner';
  elsif p_sitter_id = v_uid then
    v_party := 'sitter';
  else
    raise exception 'FORBIDDEN';
  end if;

  select * into v_thread from public.negotiation_threads
  where request_id = p_request_id and sitter_id = p_sitter_id for update;
  if not found then raise exception 'UNKNOWN_SITTER'; end if;
  if v_thread.status <> 'negotiating' then raise exception 'THREAD_CLOSED'; end if;

  select * into v_offer from public.offers
  where request_id = p_request_id and sitter_id = p_sitter_id
  order by seq desc limit 1;
  if v_offer.status <> 'pending' or v_offer.by_party = v_party then raise exception 'NOT_YOUR_TURN'; end if;

  if p_action = 'accept' then
    update public.offers set status = 'accepted' where id = v_offer.id;
    update public.negotiation_threads set status = 'agreed' where request_id = p_request_id and sitter_id = p_sitter_id;
    update public.offers set status = 'superseded'
      where request_id = p_request_id and sitter_id <> p_sitter_id and status = 'pending';
    update public.negotiation_threads set status = 'closed'
      where request_id = p_request_id and sitter_id <> p_sitter_id and status = 'negotiating';
    update public.booking_requests
      set status = 'locked', locked_sitter_id = p_sitter_id, locked_offer_id = v_offer.id, locked_at = now()
      where id = p_request_id;
    insert into public.missions (request_id, owner_id, sitter_id, offer_id, price_cents, start_date, end_date)
    values (p_request_id, v_req.owner_id, p_sitter_id, v_offer.id, v_offer.price_cents,
            v_req.start_date, v_req.start_date + (case when v_req.service = 'dogWalking' then 0 else v_req.days - 1 end));
    return 'locked';

  elsif p_action = 'decline' then
    update public.offers set status = 'declined' where id = v_offer.id;
    update public.negotiation_threads set status = 'declined' where request_id = p_request_id and sitter_id = p_sitter_id;
    update public.booking_requests r set status = 'expired'
      where r.id = p_request_id
        and not exists (select 1 from public.negotiation_threads t where t.request_id = r.id and t.status = 'negotiating');
    return 'declined';

  elsif p_action = 'counter' then
    if p_price_cents is null or p_price_cents <= 0 then raise exception 'INVALID_PRICE'; end if;
    if p_price_cents < v_req.floor_cents then raise exception 'BELOW_MINIMUM'; end if;
    if (select count(*) from public.offers
        where request_id = p_request_id and sitter_id = p_sitter_id and by_party = v_party) >= 3 then
      raise exception 'MAX_ROUNDS';
    end if;
    update public.offers set status = 'countered' where id = v_offer.id;
    insert into public.offers (request_id, sitter_id, by_party, price_cents, message, expires_at)
    values (p_request_id, p_sitter_id, v_party, p_price_cents, nullif(trim(p_message), ''), now() + interval '48 hours');
    return 'countered';
  end if;

  raise exception 'INVALID_ACTION';
end;
$$;

create or replace function public.cancel_booking_request(p_request_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.booking_requests;
begin
  select * into v_req from public.booking_requests where id = p_request_id for update;
  if not found or v_req.owner_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_req.status <> 'open' then raise exception 'REQUEST_CLOSED'; end if;
  update public.offers set status = 'superseded' where request_id = p_request_id and status = 'pending';
  update public.negotiation_threads set status = 'closed' where request_id = p_request_id and status = 'negotiating';
  update public.booking_requests set status = 'cancelled' where id = p_request_id;
end;
$$;

-- Scheduled every 10 minutes (pg_cron) so expiry also happens when nobody opens the request.
create or replace function private.expire_all_open_requests()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_id text;
  v_count integer := 0;
begin
  for v_id in
    select distinct o.request_id from public.offers o
    join public.booking_requests r on r.id = o.request_id
    where o.status = 'pending' and o.expires_at <= now() and r.status = 'open'
  loop
    perform private.apply_expiry(v_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.create_booking_request(uuid[], text, date, integer, uuid[], integer, text) from anon, public;
revoke execute on function public.respond_to_offer(text, uuid, text, integer, text) from anon, public;
revoke execute on function public.cancel_booking_request(text) from anon, public;
grant execute on function public.create_booking_request(uuid[], text, date, integer, uuid[], integer, text) to authenticated;
grant execute on function public.respond_to_offer(text, uuid, text, integer, text) to authenticated;
grant execute on function public.cancel_booking_request(text) to authenticated;
