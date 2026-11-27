-- 48 h photo reminders (server job).
create or replace function pg_temp.act(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;
do $$
declare v_req text; v_m uuid; v_code text;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 40, 7,
    array['00000000-0000-0000-0000-0000000000c1']::uuid[], 20000);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.respond_to_offer(v_req, '00000000-0000-0000-0000-0000000000c1', 'accept');
  select id into v_m from public.missions where request_id = v_req;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.confirm_mission(v_m);
  v_code := public.get_dropoff_code(v_m);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.enter_dropoff_code(v_m, v_code);
  reset role;
  update public.missions set started_at = now() - interval '40 hours' where id = v_m;

  -- 40 h after the hand-over: day-2 photo due (deadline 54 h).
  perform private.photo_reminders_due();
  assert (select count(*) from public.mission_events where mission_id = v_m and kind = 'photo_due') = 1, 'day 2 reminder';
  perform private.photo_reminders_due();
  assert (select count(*) from public.mission_events where mission_id = v_m and kind = 'photo_due') = 1, 'posted once';

  -- The sitter sends a photo → no late event for day 2; next reminders come for day 4.
  insert into public.messages (mission_id, sender_id, attachment_path, attachment_name, attachment_mime, attachment_size, created_at)
  values (v_m, '00000000-0000-0000-0000-0000000000c1', v_m || '/j2.jpg', 'j2.jpg', 'image/jpeg', 1000, now() - interval '1 hour');
  perform private.photo_reminders_due(now() + interval '20 hours');
  assert not exists (select 1 from public.mission_events where mission_id = v_m and kind = 'photo_late'), 'day 2 satisfied';

  -- Nothing for day 4 → late event once its deadline has passed (102 h after start).
  perform private.photo_reminders_due(now() + interval '70 hours');
  assert (select count(*) from public.mission_events where mission_id = v_m and kind = 'photo_late' and payload ->> 'day' = '4') = 1, 'day 4 late';
  raise notice 'photo reminders: due 12 h before each 48 h deadline, once; satisfied by a sitter photo; late event otherwise';
end $$;
