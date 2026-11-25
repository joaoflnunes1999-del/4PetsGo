-- 4PetsGo — First Night Update (PRD §3.9). It only exists AFTER the hand-over (drop-off code entered),
-- i.e. while the mission is in_progress (founder rule 25/11/2026). One report per mission, immutable.

create table public.first_night_reports (
  mission_id uuid primary key references public.missions (id) on delete cascade,
  sitter_id uuid references public.profiles (id) on delete set null,
  night text not null check (night in ('calm', 'woke', 'restless')),
  morning text not null check (morning in ('relaxed', 'playful', 'stressed', 'tired')),
  comment text check (char_length(comment) <= 600),
  photo_path text, -- mission-files bucket
  created_at timestamptz not null default now()
);
alter table public.first_night_reports enable row level security;

create policy first_night_reports_read on public.first_night_reports for select to authenticated
  using ((select private.is_mission_party(mission_id)));

-- Written through the RPC only (credits the Paw Points reward in the same transaction).
create or replace function public.submit_first_night_update(
  p_mission_id uuid, p_night text, p_morning text, p_comment text default null, p_photo_path text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_words integer;
  v_points integer;
begin
  -- Reward (founder rule 25/11/2026, ⚠️ indicative): base 5, or 8 with a comment of more than 15 words,
  -- +1 per answered question (2) → 7 or 10. Mirrors firstNightReward() in levels.ts.
  v_words := coalesce(array_length(regexp_split_to_array(trim(coalesce(p_comment, '')), '\s+'), 1), 0);
  if trim(coalesce(p_comment, '')) = '' then v_words := 0; end if;
  v_points := (case when v_words > 15 then 8 else 5 end) + 2;
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.sitter_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'in_progress' then raise exception 'NOT_STARTED'; end if;
  if exists (select 1 from public.first_night_reports where mission_id = p_mission_id) then raise exception 'ALREADY_SENT'; end if;
  if p_photo_path is not null and (storage.foldername(p_photo_path))[1] <> p_mission_id::text then raise exception 'INVALID_PHOTO'; end if;
  insert into public.first_night_reports (mission_id, sitter_id, night, morning, comment, photo_path)
  values (p_mission_id, v_m.sitter_id, p_night, p_morning, nullif(trim(p_comment), ''), p_photo_path);
  insert into public.paw_points_ledger (sitter_id, mission_id, points, reason) values (v_m.sitter_id, v_m.id, v_points, 'first_night_update');
  update public.sitter_profiles set paw_points = paw_points + v_points where id = v_m.sitter_id;
  perform private.log_event(p_mission_id, 'first_night_update', jsonb_build_object('reward', v_points));
end;
$$;
revoke execute on function public.submit_first_night_update(uuid, text, text, text, text) from anon, public;
grant execute on function public.submit_first_night_update(uuid, text, text, text, text) to authenticated;
