-- 4PetsGo — bilateral reviews (PRD §3.11).
--  * Only after a mission really completed (pick-up code entered), once per party.
--  * Hidden until BOTH parties have reviewed, or 14 days after the end (limits retaliation).
--  * Published reviews are readable by signed-in users (sitter reputation is public).
--  * The sitter's rating is the average of published reviews written by owners. No automatic suspension.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  target_id uuid references public.profiles (id) on delete cascade,
  author_role text not null check (author_role in ('owner', 'sitter')),
  -- owner → sitter: care, communication, punctuality, petCondition, overall
  -- sitter → owner: punctuality, clarity, communication, agreements, handover
  criteria jsonb not null,
  rating numeric(2, 1) not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  unique (mission_id, author_role)
);
create index reviews_target_idx on public.reviews (target_id, created_at desc);
alter table public.reviews enable row level security;

create or replace function private.review_is_published(p_mission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select count(*) from public.reviews r where r.mission_id = p_mission_id) = 2
      or exists (select 1 from public.missions m where m.id = p_mission_id and m.ended_at <= now() - interval '14 days');
$$;
grant execute on function private.review_is_published(uuid) to authenticated;
revoke execute on function private.review_is_published(uuid) from anon, public;

create policy reviews_read on public.reviews for select to authenticated
  using (author_id = (select auth.uid()) or (select private.review_is_published(mission_id)));
-- No insert/update/delete policy: reviews are written through submit_review and cannot be edited afterwards.

create or replace function private.refresh_sitter_rating(p_sitter_id uuid)
returns void
language sql
set search_path = ''
as $$
  update public.sitter_profiles s set
    rating = sub.avg_rating,
    review_count = sub.n
  from (
    select round(avg(r.rating), 1) as avg_rating, count(*)::integer as n
    from public.reviews r
    where r.target_id = p_sitter_id and r.author_role = 'owner' and private.review_is_published(r.mission_id)
  ) sub
  where s.id = p_sitter_id;
$$;

create or replace function public.submit_review(p_mission_id uuid, p_criteria jsonb, p_comment text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_m public.missions;
  v_role text;
  v_keys text[];
  v_key text;
  v_value integer;
  v_sum integer := 0;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found then raise exception 'FORBIDDEN'; end if;
  if v_uid = v_m.owner_id then v_role := 'owner';
  elsif v_uid = v_m.sitter_id then v_role := 'sitter';
  else raise exception 'FORBIDDEN';
  end if;
  if v_m.status <> 'completed' then raise exception 'NOT_COMPLETED'; end if;
  if exists (select 1 from public.reviews where mission_id = p_mission_id and author_role = v_role) then
    raise exception 'ALREADY_REVIEWED';
  end if;

  v_keys := case when v_role = 'owner'
    then array['care', 'communication', 'punctuality', 'petCondition', 'overall']
    else array['punctuality', 'clarity', 'communication', 'agreements', 'handover'] end;
  if p_criteria is null or (select count(*) from jsonb_object_keys(p_criteria)) <> cardinality(v_keys) then
    raise exception 'INVALID_CRITERIA';
  end if;
  foreach v_key in array v_keys loop
    begin
      v_value := (p_criteria ->> v_key)::integer;
    exception when others then
      raise exception 'INVALID_CRITERIA';
    end;
    if v_value is null or v_value not between 1 and 5 then raise exception 'INVALID_CRITERIA'; end if;
    v_sum := v_sum + v_value;
  end loop;

  insert into public.reviews (mission_id, author_id, target_id, author_role, criteria, rating, comment)
  values (p_mission_id, v_uid, case when v_role = 'owner' then v_m.sitter_id else v_m.owner_id end, v_role,
          p_criteria, round(v_sum::numeric / cardinality(v_keys), 1), nullif(trim(p_comment), ''));
  perform private.refresh_sitter_rating(v_m.sitter_id);
  perform private.log_event(p_mission_id, 'review_submitted', jsonb_build_object('by', v_role));
end;
$$;
revoke execute on function public.submit_review(uuid, jsonb, text) from anon, public;
grant execute on function public.submit_review(uuid, jsonb, text) to authenticated;

-- Daily: publish reviews whose 14-day window has passed and refresh the affected sitters' ratings.
create or replace function private.publish_due_reviews()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_sitter uuid;
  v_count integer := 0;
begin
  for v_sitter in
    select distinct m.sitter_id from public.missions m
    join public.reviews r on r.mission_id = m.id
    where m.ended_at <= now() - interval '14 days' and m.ended_at > now() - interval '16 days'
  loop
    perform private.refresh_sitter_rating(v_sitter);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('publish-due-reviews', '17 3 * * *', 'select private.publish_due_reviews()');
  end if;
end;
$$;
