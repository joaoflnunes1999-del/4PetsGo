-- Bilateral reviews: only after completion, hidden until both reviewed (or 14 days), sitter rating refreshed.
create table public._r (k text primary key, v text);
grant all on public._r to authenticated;
create or replace function pg_temp.act(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

-- A mission Alice ↔ Marc, taken to completion.
do $$
declare v_req text; v_m uuid; v_code text; v_pick text;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date, 2,
    array['00000000-0000-0000-0000-0000000000c2']::uuid[], 7000);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.respond_to_offer(v_req, '00000000-0000-0000-0000-0000000000c2', 'accept');
  select id into v_m from public.missions where request_id = v_req;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.confirm_mission(v_m);
  v_code := public.get_dropoff_code(v_m);
  -- Reviewing before the end is refused.
  begin perform public.submit_review(v_m, '{"care":5,"communication":5,"punctuality":5,"overall":5}');
    raise exception 'expected NOT_COMPLETED'; exception when others then assert sqlerrm = 'NOT_COMPLETED', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.enter_dropoff_code(v_m, v_code);
  v_pick := public.generate_pickup_code(v_m, 'early_owner');
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.enter_pickup_code(v_m, v_pick);
  reset role;
  insert into public._r values ('m', v_m::text);
  raise notice 'reviews: refused before the mission is completed';
end $$;

-- Alice reviews Marc: visible to Alice only until Marc reviews too.
do $$
declare v_m uuid := (select v::uuid from public._r where k = 'm');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  begin perform public.submit_review(v_m, '{"care":5,"communication":4}');
    raise exception 'expected INVALID_CRITERIA'; exception when others then assert sqlerrm = 'INVALID_CRITERIA', sqlerrm; end;
  begin perform public.submit_review(v_m, '{"care":9,"communication":4,"punctuality":4,"overall":5}');
    raise exception 'expected INVALID_CRITERIA'; exception when others then assert sqlerrm = 'INVALID_CRITERIA', sqlerrm; end;
  perform public.submit_review(v_m, '{"care":5,"communication":4,"punctuality":4,"overall":5}', 'Super garde, merci Marc !');
  assert (select count(*) from public.reviews where mission_id = v_m) = 1, 'author sees her own review';
  begin perform public.submit_review(v_m, '{"care":5,"communication":5,"punctuality":5,"overall":5}');
    raise exception 'expected ALREADY_REVIEWED'; exception when others then assert sqlerrm = 'ALREADY_REVIEWED', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  assert (select count(*) from public.reviews where mission_id = v_m) = 0, 'target cannot see it yet';
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000b2'); set local role authenticated;
  assert (select count(*) from public.reviews where mission_id = v_m) = 0, 'outsider cannot see it yet';
  reset role;
  assert (select review_count from public.sitter_profiles where id = '00000000-0000-0000-0000-0000000000c2') = 0, 'not counted while hidden';
  raise notice 'reviews: criteria validated, one review per party, hidden from the other party until both have reviewed';
end $$;

-- Marc reviews Alice → both published, Marc's rating updated, no edit possible.
do $$
declare v_m uuid := (select v::uuid from public._r where k = 'm');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.submit_review(v_m, '{"punctuality":5,"communication":5,"agreements":5,"handover":4}');
  assert (select count(*) from public.reviews where mission_id = v_m) = 2, 'both visible once both reviewed';
  update public.reviews set rating = 1 where mission_id = v_m;
  delete from public.reviews where mission_id = v_m;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000b2'); set local role authenticated;
  assert (select count(*) from public.reviews where mission_id = v_m) = 2, 'published reviews are public to members';
  reset role;
  assert (select rating from public.sitter_profiles where id = '00000000-0000-0000-0000-0000000000c2') = 4.5, 'rating = average of the 4 criteria (18/4)';
  assert (select review_count from public.sitter_profiles where id = '00000000-0000-0000-0000-0000000000c2') = 1;
  assert (select min(rating) from public.reviews where mission_id = v_m) > 1, 'reviews cannot be edited';
  raise notice 'reviews: published when both have reviewed, sitter rating refreshed, reviews cannot be edited or deleted';
end $$;

-- 14-day rule: a single review becomes public after 14 days.
do $$
declare v_m uuid;
begin
  v_m := (select v::uuid from public._r where k = 'm');
  delete from public.reviews where mission_id = v_m and author_role = 'sitter';
  update public.missions set ended_at = now() - interval '15 days' where id = v_m;
  perform pg_temp.act('00000000-0000-0000-0000-0000000000b2'); set local role authenticated;
  assert (select count(*) from public.reviews where mission_id = v_m) = 1, 'single review published after 14 days';
  reset role;
  raise notice 'reviews: a lone review is published 14 days after the end of the mission';
end $$;
drop table public._r;
