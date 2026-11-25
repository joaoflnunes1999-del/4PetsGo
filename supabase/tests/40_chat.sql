-- Mission chat: files can be sent, messages can never be edited or deleted (by either party).
create table public._c (k text primary key, v text);
grant all on public._c to authenticated;
create or replace function pg_temp.act(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

-- A confirmed mission between Alice and Camille.
do $$
declare v_req text; v_m uuid;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 30, 2,
    array['00000000-0000-0000-0000-0000000000c1']::uuid[], 6000);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.respond_to_offer(v_req, '00000000-0000-0000-0000-0000000000c1', 'accept');
  select id into v_m from public.missions where request_id = v_req;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.confirm_mission(v_m);
  reset role;
  insert into public._c values ('m', v_m::text);
end $$;

-- Sending text and files.
do $$
declare v_m uuid := (select v::uuid from public._c where k = 'm'); v_msg uuid;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  insert into storage.objects (bucket_id, name) values ('mission-files', v_m || '/f1-ordonnance.pdf');
  insert into public.messages (mission_id, sender_id, body) values (v_m, auth.uid(), 'Voici son ordonnance');
  insert into public.messages (mission_id, sender_id, attachment_path, attachment_name, attachment_mime, attachment_size)
  values (v_m, auth.uid(), v_m || '/f1-ordonnance.pdf', 'ordonnance.pdf', 'application/pdf', 120000)
  returning id into v_msg;
  insert into public._c values ('msg', v_msg::text);
  begin
    insert into public.messages (mission_id, sender_id, attachment_path, attachment_name, attachment_mime, attachment_size)
    values (v_m, auth.uid(), '00000000-0000-0000-0000-000000000000/other.pdf', 'other.pdf', 'application/pdf', 10);
    raise exception 'expected rejection of a file from another mission';
  exception when insufficient_privilege then null;
  end;
  raise notice 'chat: text and files (PDF, photos, documents) can be sent; attachments must belong to the mission';
end $$;

do $$
declare v_m uuid := (select v::uuid from public._c where k = 'm');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  assert (select count(*) from public.messages where mission_id = v_m) = 2, 'sitter reads both messages';
  assert (select count(*) from storage.objects where bucket_id = 'mission-files' and name like v_m || '/%') = 1, 'sitter can read the file';
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000b2'); set local role authenticated;
  assert (select count(*) from storage.objects where bucket_id = 'mission-files') = 0, 'outsider cannot read mission files';
  begin
    insert into storage.objects (bucket_id, name) values ('mission-files', v_m || '/intrus.pdf');
    raise exception 'expected storage rejection';
  exception when insufficient_privilege then null;
  end;
  raise notice 'chat files: readable by both parties only; outsiders can neither read nor upload';
end $$;

-- Nobody can edit or delete a sent message or file.
do $$
declare v_msg uuid := (select v::uuid from public._c where k = 'msg'); v_m uuid := (select v::uuid from public._c where k = 'm');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  update public.messages set body = 'modifié' where id = v_msg;
  delete from public.messages where mission_id = v_m;
  delete from storage.objects where bucket_id = 'mission-files';
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  delete from public.messages where mission_id = v_m;
  reset role;
  assert (select count(*) from public.messages where mission_id = v_m) = 2, 'messages still there';
  assert (select body from public.messages where id = v_msg) is null, 'message not edited';
  assert (select count(*) from storage.objects where bucket_id = 'mission-files') = 1, 'file still there';
end $$;

-- Even code that bypasses RLS (but is not the server) is stopped by the trigger.
set client_min_messages = warning;
drop role if exists chat_tester;
reset client_min_messages;
create role chat_tester bypassrls;
grant usage on schema public, private to chat_tester;
grant select, update, delete on public.messages to chat_tester;
do $$
declare v_m uuid := (select v::uuid from public._c where k = 'm');
begin
  set local role chat_tester;
  begin
    delete from public.messages where mission_id = v_m;
    raise exception 'expected MESSAGES_ARE_IMMUTABLE';
  exception when others then assert sqlerrm = 'MESSAGES_ARE_IMMUTABLE', sqlerrm;
  end;
  reset role;
  raise notice 'chat: messages are immutable for both parties (RLS + trigger)';
end $$;
-- First Night Update: impossible before the hand-over, possible once, rewarded.
do $$
declare v_m uuid := (select v::uuid from public._c where k = 'm'); v_code text; v_before integer;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  begin perform public.submit_first_night_update(v_m, 'calm', 'playful'); raise exception 'expected NOT_STARTED';
  exception when others then assert sqlerrm = 'NOT_STARTED', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_code := public.get_dropoff_code(v_m);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.enter_dropoff_code(v_m, v_code);
  v_before := (select paw_points from public.sitter_profiles where id = auth.uid());
  perform public.submit_first_night_update(v_m, 'calm', 'playful',
    'Pistache a dormi toute la nuit au pied du lit, puis il a réclamé sa balle bleue dès sept heures du matin');
  assert (select paw_points from public.sitter_profiles where id = auth.uid()) = v_before + 10, 'detailed comment (16+ words): 8 + 2 = 10';
  begin perform public.submit_first_night_update(v_m, 'calm', 'playful'); raise exception 'expected ALREADY_SENT';
  exception when others then assert sqlerrm = 'ALREADY_SENT', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  assert (select night from public.first_night_reports where mission_id = v_m) = 'calm', 'owner reads the report';
  reset role;
  raise notice 'first night update: only after the hand-over, once per mission; 10 Paw Points with a 16+ word comment';
end $$;
do $$ begin
  assert (select points from public.paw_points_ledger where reason = 'first_night_update' limit 1) = 10;
end $$;
drop owned by chat_tester;
drop role chat_tester;
drop table public._c;
