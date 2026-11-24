-- 4PetsGo — mission lifecycle driven by hand-over codes, sitter wallet (held → available → payout),
-- mission chat and events. Founder rules (25/11/2026):
--  * owner pays the full stay once the price is agreed (Stripe in phase 3; `confirm_mission` until then);
--  * a DROP-OFF code is shown to the owner; the sitter types it when receiving the pet → mission starts,
--    the sitter's share is credited to the wallet as HELD;
--  * the sitter can generate a PICK-UP code at any time (early end included); the owner types it in the chat
--    → mission ends, the share becomes AVAILABLE and can be transferred to the sitter's bank account;
--  * early end because the SITTER withdraws → the owner only pays the days done (pro rata);
--    early pick-up by the OWNER → no refund.
-- Codes are never stored in messages or notifications and are only reachable through the RPCs below.

alter table public.missions
  add column owner_fee_cents integer,
  add column sitter_commission_rate numeric(5, 4),
  add column started_at timestamptz,
  add column ended_at timestamptz,
  add column end_reason text check (end_reason in ('completed', 'early_owner', 'early_sitter')),
  add column days_done integer,
  add column charged_cents integer,      -- service price finally charged to the owner (pro rata if sitter withdrew)
  add column refund_cents integer,       -- service price refunded to the owner
  add column sitter_earned_cents integer; -- charged - commission

create table public.mission_codes (
  mission_id uuid primary key references public.missions (id) on delete cascade,
  dropoff_code text not null,
  dropoff_attempts integer not null default 0,
  pickup_code text,
  pickup_reason text check (pickup_reason in ('completed', 'early_owner', 'early_sitter')),
  pickup_generated_at timestamptz,
  pickup_attempts integer not null default 0
);

create table public.mission_events (
  id bigint generated always as identity primary key,
  mission_id uuid not null references public.missions (id) on delete cascade,
  kind text not null,
  actor_id uuid references public.profiles (id),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index mission_events_mission_idx on public.mission_events (mission_id, id);

-- Chat messages are IMMUTABLE (founder rule 25/11/2026): neither party can edit or delete a sent message.
-- They are kept as the record of the mission (disputes, cancellations). A deleted account only loses its
-- identity on its messages (sender_id set to null), the content stays for the other party.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,
  body text check (char_length(body) <= 2000),
  -- Attachment in the `mission-files` bucket: {mission_id}/{uuid}-{file name} (sensitive: mission parties only)
  attachment_path text,
  attachment_name text check (char_length(attachment_name) <= 200),
  attachment_mime text,
  attachment_size integer check (attachment_size between 1 and 20971520),
  created_at timestamptz not null default now(),
  check (body is not null or attachment_path is not null),
  check ((attachment_path is null) = (attachment_name is null) and (attachment_path is null) = (attachment_mime is null))
);
create index messages_mission_idx on public.messages (mission_id, created_at);

create table public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid not null unique references public.missions (id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null,
  status text not null default 'held' check (status in ('held', 'available', 'paid_out', 'cancelled')),
  created_at timestamptz not null default now(),
  available_at timestamptz,
  payout_id uuid
);
create index wallet_entries_sitter_idx on public.wallet_entries (sitter_id, status);

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  sitter_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  -- requested → paid (Stripe transfer + payout, phase 3) | failed
  status text not null default 'requested' check (status in ('requested', 'paid', 'failed')),
  created_at timestamptz not null default now()
);
alter table public.wallet_entries add constraint wallet_entries_payout_fk foreign key (payout_id) references public.payouts (id);

create table public.paw_points_ledger (
  id bigint generated always as identity primary key,
  sitter_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid references public.missions (id) on delete set null,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (mission_id, reason)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.is_mission_party(p_mission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.missions m
    where m.id = p_mission_id and (select auth.uid()) in (m.owner_id, m.sitter_id)
  );
$$;
grant execute on function private.is_mission_party(uuid) to authenticated;
revoke execute on function private.is_mission_party(uuid) from anon, public;

create or replace function private.random_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select lpad((floor(random() * 1000000))::integer::text, 6, '0');
$$;

create or replace function private.log_event(p_mission_id uuid, p_kind text, p_payload jsonb default '{}')
returns void
language sql
set search_path = ''
as $$
  insert into public.mission_events (mission_id, kind, actor_id, payload)
  values (p_mission_id, p_kind, (select auth.uid()), p_payload);
$$;

create or replace function private.sitter_level(p_paw_points integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_paw_points >= 3000 then 'master'
    when p_paw_points >= 1500 then 'expert'
    when p_paw_points >= 600 then 'advanced'
    when p_paw_points >= 200 then 'explorer'
    else 'beginner'
  end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.mission_codes enable row level security;   -- no policy: RPC access only
alter table public.mission_events enable row level security;
alter table public.messages enable row level security;
alter table public.wallet_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.paw_points_ledger enable row level security;

create policy mission_events_read on public.mission_events for select to authenticated
  using ((select private.is_mission_party(mission_id)));

-- Chat opens once the mission is confirmed (paid) and stays readable afterwards; writing only while active.
create policy messages_read on public.messages for select to authenticated
  using ((select private.is_mission_party(mission_id)));
create policy messages_insert on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    -- an attachment must live in this mission's folder
    and (attachment_path is null or (storage.foldername(attachment_path))[1] = mission_id::text)
    and exists (
      select 1 from public.missions m
      where m.id = mission_id and (select auth.uid()) in (m.owner_id, m.sitter_id) and m.status in ('confirmed', 'in_progress')
    )
  );

create policy wallet_entries_read_own on public.wallet_entries for select to authenticated using (sitter_id = (select auth.uid()));
create policy payouts_read_own on public.payouts for select to authenticated using (sitter_id = (select auth.uid()));
create policy paw_points_ledger_read_own on public.paw_points_ledger for select to authenticated using (sitter_id = (select auth.uid()));

-- No UPDATE / DELETE policy on messages: RLS already forbids it; the trigger below also blocks
-- SECURITY DEFINER code paths. Only the server (account deletion cascade, legal retention jobs) may.
create or replace function private.messages_are_immutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if private.is_server() then
    return coalesce(new, old);
  end if;
  raise exception 'MESSAGES_ARE_IMMUTABLE';
end;
$$;
create trigger messages_immutable
  before update or delete on public.messages
  for each row execute function private.messages_are_immutable();

-- Mission files (photos, PDFs, documents): sensitive, mission parties only. Upload while the mission is active;
-- readable afterwards by the parties. No update/delete policy: files sent in the chat cannot be removed either.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values (
  'mission-files', 'mission-files', false, 20971520,
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
) on conflict (id) do nothing;
create policy mission_files_objects_read on storage.objects for select to authenticated
  using (bucket_id = 'mission-files' and (select private.is_mission_party(((storage.foldername(name))[1])::uuid)));
create policy mission_files_objects_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mission-files'
    and exists (
      select 1 from public.missions m
      where m.id = ((storage.foldername(name))[1])::uuid
        and (select auth.uid()) in (m.owner_id, m.sitter_id)
        and m.status in ('confirmed', 'in_progress')
    )
  );

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Phase 2 stand-in for payment: the owner confirms; phase 3 replaces this with the Stripe payment webhook.
create or replace function public.confirm_mission(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_cfg public.pricing_config;
  v_points integer;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.owner_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'pending_payment' then raise exception 'INVALID_STATUS'; end if;
  select c.* into v_cfg from public.pricing_config c join public.booking_requests r on r.country = c.country where r.id = v_m.request_id;
  select paw_points into v_points from public.sitter_profiles where id = v_m.sitter_id;
  update public.missions set
    status = 'confirmed',
    confirmed_at = now(),
    owner_fee_cents = round(v_m.price_cents * v_cfg.owner_fee_rate),
    sitter_commission_rate = (v_cfg.sitter_commission ->> private.sitter_level(coalesce(v_points, 0)))::numeric
  where id = p_mission_id;
  insert into public.mission_codes (mission_id, dropoff_code) values (p_mission_id, private.random_code());
  perform private.log_event(p_mission_id, 'confirmed');
end;
$$;

-- Owner only. Shown with the disclaimer: give it only when handing the pet over.
create or replace function public.get_dropoff_code(p_mission_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  select c.dropoff_code into v_code
  from public.mission_codes c join public.missions m on m.id = c.mission_id
  where c.mission_id = p_mission_id and m.owner_id = (select auth.uid()) and m.status = 'confirmed';
  if v_code is null then raise exception 'FORBIDDEN'; end if;
  return v_code;
end;
$$;

-- Sitter types the drop-off code → mission starts, share credited as HELD. Returns 'started' | 'invalid' | 'locked_out'.
create or replace function public.enter_dropoff_code(p_mission_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_c public.mission_codes;
  v_share integer;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.sitter_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'confirmed' then raise exception 'INVALID_STATUS'; end if;
  select * into v_c from public.mission_codes where mission_id = p_mission_id for update;
  if v_c.dropoff_attempts >= 5 then return 'locked_out'; end if;
  if trim(p_code) <> v_c.dropoff_code then
    update public.mission_codes set dropoff_attempts = dropoff_attempts + 1 where mission_id = p_mission_id;
    return 'invalid';
  end if;
  v_share := v_m.price_cents - round(v_m.price_cents * v_m.sitter_commission_rate);
  update public.missions set status = 'in_progress', started_at = now() where id = p_mission_id;
  insert into public.wallet_entries (sitter_id, mission_id, amount_cents, currency)
  select v_m.sitter_id, v_m.id, v_share, r.currency from public.booking_requests r where r.id = v_m.request_id;
  perform private.log_event(p_mission_id, 'started');
  return 'started';
end;
$$;

-- Sitter generates the pick-up code (always available while the mission runs). Before the last day the sitter
-- must say who ends early: 'early_owner' (owner picks up early, no refund) or 'early_sitter' (sitter withdraws, pro rata).
create or replace function public.generate_pickup_code(p_mission_id uuid, p_reason text default 'completed')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_code text := private.random_code();
  v_reason text := p_reason;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.sitter_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'in_progress' then raise exception 'INVALID_STATUS'; end if;
  if current_date >= v_m.end_date then
    v_reason := 'completed';
  elsif v_reason not in ('early_owner', 'early_sitter') then
    raise exception 'EARLY_REASON_REQUIRED';
  end if;
  update public.mission_codes
    set pickup_code = v_code, pickup_reason = v_reason, pickup_generated_at = now(), pickup_attempts = 0
    where mission_id = p_mission_id;
  -- The reason (not the code) is visible to the owner before typing the code.
  perform private.log_event(p_mission_id, 'pickup_code_generated', jsonb_build_object('reason', v_reason));
  return v_code;
end;
$$;

-- Owner types the pick-up code in the chat → mission ends, money settled, share becomes AVAILABLE.
create or replace function public.enter_pickup_code(p_mission_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_c public.mission_codes;
  v_req public.booking_requests;
  v_days_done integer;
  v_charged integer;
  v_earned integer;
  v_owner_club boolean;
  v_first boolean;
  v_points integer;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.owner_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'in_progress' then raise exception 'INVALID_STATUS'; end if;
  select * into v_c from public.mission_codes where mission_id = p_mission_id for update;
  if v_c.pickup_code is null then raise exception 'NO_PICKUP_CODE'; end if;
  if v_c.pickup_attempts >= 5 then return 'locked_out'; end if;
  if trim(p_code) <> v_c.pickup_code then
    update public.mission_codes set pickup_attempts = pickup_attempts + 1 where mission_id = p_mission_id;
    return 'invalid';
  end if;

  select * into v_req from public.booking_requests where id = v_m.request_id;
  v_days_done := least(v_req.days, greatest(1, (current_date - v_m.start_date) + 1));
  if v_c.pickup_reason = 'early_sitter' then
    v_charged := round(v_m.price_cents::numeric * v_days_done / v_req.days);
  else
    v_charged := v_m.price_cents; -- completed, or early pick-up by the owner: no refund
  end if;
  v_earned := v_charged - round(v_charged * v_m.sitter_commission_rate);

  update public.missions set
    status = 'completed', ended_at = now(), end_reason = v_c.pickup_reason, days_done = v_days_done,
    charged_cents = v_charged, refund_cents = v_m.price_cents - v_charged, sitter_earned_cents = v_earned
  where id = p_mission_id;
  update public.wallet_entries set amount_cents = v_earned, status = 'available', available_at = now()
  where mission_id = p_mission_id;
  update public.mission_codes set pickup_code = null where mission_id = p_mission_id;

  -- Paw Points: only when the sitter did not withdraw (×1.5 for Owner Club missions, +20 first mission). ⚠️ indicative values.
  if v_c.pickup_reason <> 'early_sitter' then
    select owner_club into v_owner_club from public.profiles where id = v_m.owner_id;
    select completed_missions = 0 into v_first from public.sitter_profiles where id = v_m.sitter_id;
    v_points := round((30 + case when v_first then 20 else 0 end) * case when v_owner_club then 1.5 else 1 end);
    insert into public.paw_points_ledger (sitter_id, mission_id, points, reason) values (v_m.sitter_id, v_m.id, v_points, 'mission_completed');
    update public.sitter_profiles set paw_points = paw_points + v_points, completed_missions = completed_missions + 1
    where id = v_m.sitter_id;
  end if;

  perform private.log_event(p_mission_id, 'completed',
    jsonb_build_object('reason', v_c.pickup_reason, 'days_done', v_days_done, 'refund_cents', v_m.price_cents - v_charged));
  return 'completed';
end;
$$;

-- Sitter transfers the AVAILABLE balance to their bank account (Stripe Connect payout in phase 3).
create or replace function public.request_payout()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_amount integer;
  v_currency text;
  v_id uuid;
begin
  select coalesce(sum(amount_cents), 0), min(currency) into v_amount, v_currency
  from public.wallet_entries where sitter_id = v_uid and status = 'available';
  if v_amount <= 0 then raise exception 'NOTHING_TO_PAY_OUT'; end if;
  insert into public.payouts (sitter_id, amount_cents, currency) values (v_uid, v_amount, v_currency) returning id into v_id;
  update public.wallet_entries set status = 'paid_out', payout_id = v_id where sitter_id = v_uid and status = 'available';
  return v_id;
end;
$$;

-- Cancellation before the drop-off (refund policy ⚠️ à valider — recorded, not applied yet).
create or replace function public.cancel_mission(p_mission_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or (select auth.uid()) not in (v_m.owner_id, v_m.sitter_id) then raise exception 'FORBIDDEN'; end if;
  if v_m.status not in ('pending_payment', 'confirmed') then raise exception 'INVALID_STATUS'; end if;
  update public.missions set status = 'cancelled' where id = p_mission_id;
  perform private.log_event(p_mission_id, 'cancelled', jsonb_build_object(
    'by', case when (select auth.uid()) = v_m.owner_id then 'owner' else 'sitter' end, 'reason', left(coalesce(p_reason, ''), 400)));
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.confirm_mission(uuid)', 'public.get_dropoff_code(uuid)', 'public.enter_dropoff_code(uuid, text)',
    'public.generate_pickup_code(uuid, text)', 'public.enter_pickup_code(uuid, text)', 'public.request_payout()',
    'public.cancel_mission(uuid, text)'
  ] loop
    execute format('revoke execute on function %s from anon, public', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
