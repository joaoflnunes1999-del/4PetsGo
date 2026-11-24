-- Server-side negotiation rules (depends on fixtures from 10_*).
create table if not exists public._t (k text primary key, v text);
grant all on public._t to authenticated;

-- Alice sends a request to Camille and Marc.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$
declare v_id text;
begin
  begin
    perform public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 1, 3,
      array['00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2']::uuid[], 1000);
    raise exception 'expected BELOW_MINIMUM';
  exception when others then assert sqlerrm = 'BELOW_MINIMUM', sqlerrm;
  end;
  v_id := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 1, 3,
    array['00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2']::uuid[]);
  assert v_id ~ '^4PG-[A-Z2-9]{6}$', 'mission code format';
  insert into public._t values ('req', v_id);
  assert (select floor_cents from public.booking_requests where id = v_id) = 1300 * 3, 'floor = FR large dog minimum x 3 days';
  assert (select price_cents from public.offers where request_id = v_id and sitter_id = '00000000-0000-0000-0000-0000000000c1') = 2340 * 3,
    'initial offer = sitter listed price';
  assert (select count(*) from public.negotiation_threads where request_id = v_id) = 2, 'two threads';
  raise notice 'request: server computes floor (39,00 €) and listed prices; proposals under the floor are refused';
end $$;
commit;

-- Camille sees the pet but not its care data; Bob sees nothing.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pet_care) = 0, 'sitter without confirmed mission cannot see care';
  assert (select count(*) from public.booking_requests) = 1, 'sitter sees the request';
  raise notice 'sitter with a request: sees the request, never the care data before a confirmed mission';
end $$;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.booking_requests) = 0, 'other owner cannot see request';
  assert (select count(*) from public.offers) = 0, 'other owner cannot see offers';
end $$;
commit;

-- Camille negotiates: floor, turn and 3-offer limit.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$
declare v_id text := (select v from public._t where k = 'req');
begin
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 100);
    raise exception 'expected BELOW_MINIMUM'; exception when others then assert sqlerrm = 'BELOW_MINIMUM', sqlerrm; end;
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c2', 'accept');
    raise exception 'expected FORBIDDEN'; exception when others then assert sqlerrm = 'FORBIDDEN', sqlerrm; end;
  assert public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 8000) = 'countered';
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 7900);
    raise exception 'expected NOT_YOUR_TURN'; exception when others then assert sqlerrm = 'NOT_YOUR_TURN', sqlerrm; end;
  raise notice 'negotiation: floor enforced, sitters can only answer their own thread, strict turn-taking';
end $$;
commit;

-- Ping-pong up to the limit (owner initial + 2 counters = 3; sitter 3 counters).
do $$
declare
  v_id text := (select v from public._t where k = 'req');
  i integer;
begin
  for i in 1..2 loop
    perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
    set local role authenticated;
    perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 7000 + i);
    reset role;
    perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
    set local role authenticated;
    perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 7500 + i);
    reset role;
  end loop;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
  set local role authenticated;
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'counter', 7300);
    raise exception 'expected MAX_ROUNDS'; exception when others then assert sqlerrm = 'MAX_ROUNDS', sqlerrm; end;
  reset role;
  assert (select count(*) from public.offers where request_id = v_id and sitter_id = '00000000-0000-0000-0000-0000000000c1') = 6;
  raise notice 'negotiation: each party is limited to 3 offers per thread';
end $$;

-- Marc accepts Alice's initial offer → the request locks; Camille can no longer accept.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
do $$
declare v_id text := (select v from public._t where k = 'req');
begin
  assert public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c2', 'accept') = 'locked';
end $$;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$
declare v_id text := (select v from public._t where k = 'req');
begin
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'accept');
    raise exception 'expected REQUEST_LOCKED'; exception when others then assert sqlerrm = 'REQUEST_LOCKED', sqlerrm; end;
  assert (select status from public.booking_requests where id = v_id) = 'locked';
  assert (select locked_sitter_id from public.booking_requests where id = v_id) = '00000000-0000-0000-0000-0000000000c2';
  assert (select status from public.negotiation_threads where request_id = v_id and sitter_id = '00000000-0000-0000-0000-0000000000c1') = 'closed';
  assert (select status from public.missions where request_id = v_id) = 'pending_payment';
  raise notice 'lock: first acceptance wins, other threads closed, mission created (pending payment)';
end $$;
commit;

-- Care data: Marc gets it only once the mission is confirmed; Camille never.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
do $$ begin assert (select count(*) from public.pet_care) = 0, 'no care before confirmation'; end $$;
commit;
update public.missions set status = 'confirmed', confirmed_at = now() where request_id = (select v from public._t where k = 'req');
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pet_care) = 1, 'confirmed sitter sees care';
end $$;
commit;
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pet_care) = 0, 'losing sitter never sees care';
end $$;
commit;
update public.missions set status = 'cancelled' where request_id = (select v from public._t where k = 'req');
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
do $$ begin
  assert (select count(*) from public.pet_care) = 0, 'access revoked after cancellation';
  raise notice 'care data: only the confirmed sitter, revoked on cancellation';
end $$;
commit;

-- Expiry: an offer older than 48 h closes the thread and the request.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
do $$
declare v_id text;
begin
  v_id := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 2, 2,
    array['00000000-0000-0000-0000-0000000000c1']::uuid[]);
  insert into public._t values ('req2', v_id);
end $$;
commit;
update public.offers set expires_at = now() - interval '1 minute' where request_id = (select v from public._t where k = 'req2');
do $$ begin assert private.expire_all_open_requests() = 1; end $$;
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
do $$
declare v_id text := (select v from public._t where k = 'req2');
begin
  begin perform public.respond_to_offer(v_id, '00000000-0000-0000-0000-0000000000c1', 'accept');
    raise exception 'expected REQUEST_CLOSED'; exception when others then assert sqlerrm = 'REQUEST_CLOSED', sqlerrm; end;
  raise notice 'expiry: offers expire after 48 h (scheduled job) and the request closes';
end $$;
commit;
-- Floor without weight: breed typical size (Saint-bernard = dogXL → 17 € x 2 days).
insert into public.pets (id, owner_id, name, species, breed_id) values
  ('00000000-0000-0000-0000-00000000f002', '00000000-0000-0000-0000-0000000000a1', 'Bernie', 'dog', 'dog-saint-bernard');
do $$ begin
  assert private.request_floor_cents('boarding', 'FR', array['00000000-0000-0000-0000-00000000f002']::uuid[], 2) = 1700 * 2,
    'floor uses breed typical size when weight is unknown';
  assert private.request_floor_cents('boarding', 'CH', array['00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-00000000f002']::uuid[], 3)
    = (3080 + 4030) * 3, 'floor sums every pet (weight or breed) x days, CH grid';
  raise notice 'floor: per pet (weight, else breed size) x days; an owner can never propose less';
end $$;
drop table public._t;
