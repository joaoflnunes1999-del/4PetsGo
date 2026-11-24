-- Mission lifecycle: confirmation, hand-over codes, held wallet, early end rules, payout, chat privacy.
create table public._m (k text primary key, v text);
grant all on public._m to authenticated;

-- Helper to act as a user inside DO blocks.
create or replace function pg_temp.act(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
end $$;

-- Scenario A — Alice ↔ Camille, 3 days, owner picks up early (no refund).
do $$
declare v_req text; v_mission uuid; v_code text; v_pick text;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date, 3,
    array['00000000-0000-0000-0000-0000000000c1']::uuid[], 6000);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.respond_to_offer(v_req, '00000000-0000-0000-0000-0000000000c1', 'accept');
  select id into v_mission from public.missions where request_id = v_req;
  begin perform public.confirm_mission(v_mission); raise exception 'expected FORBIDDEN';
  exception when others then assert sqlerrm = 'FORBIDDEN', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  begin insert into public.messages (mission_id, sender_id, body) values (v_mission, auth.uid(), 'trop tôt');
    raise exception 'expected chat closed before confirmation'; exception when insufficient_privilege then null; end;
  perform public.confirm_mission(v_mission);
  v_code := public.get_dropoff_code(v_mission);
  assert v_code ~ '^\d{6}$', 'six-digit drop-off code';
  insert into public.messages (mission_id, sender_id, body) values (v_mission, auth.uid(), 'Bonjour Camille !');
  assert (select owner_fee_cents from public.missions where id = v_mission) = 300, 'owner fee 5 %';
  insert into public._m values ('mA', v_mission::text), ('codeA', v_code);
  raise notice 'confirm: only the owner confirms; chat opens after confirmation; 6-digit drop-off code for the owner';
end $$;

-- Camille cannot see the owner's code; a wrong code is counted and refused; the right one starts the mission.
do $$
declare v_mission uuid := (select v::uuid from public._m where k = 'mA');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  begin perform public.get_dropoff_code(v_mission); raise exception 'expected FORBIDDEN';
  exception when others then assert sqlerrm = 'FORBIDDEN', sqlerrm; end;
  assert (select count(*) from public.mission_codes) = 0, 'codes table unreadable';
  assert public.enter_dropoff_code(v_mission, '000000') in ('invalid', 'started');
end $$;
do $$
declare v_mission uuid := (select v::uuid from public._m where k = 'mA');
begin
  if (select status from public.missions where id = v_mission) = 'confirmed' then
    assert (select dropoff_attempts from public.mission_codes where mission_id = v_mission) = 1, 'wrong attempt persisted';
  end if;
end $$;
do $$
declare v_mission uuid := (select v::uuid from public._m where k = 'mA');
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  assert public.enter_dropoff_code(v_mission, (select v from public._m where k = 'codeA')) = 'started';
  assert (select status from public.missions where id = v_mission) = 'in_progress';
  assert (select status from public.wallet_entries where mission_id = v_mission) = 'held', 'share held until the end';
  assert (select amount_cents from public.wallet_entries where mission_id = v_mission) = 6000 - 300, 'price minus 5 % beginner commission';
  begin perform public.request_payout(); raise exception 'expected NOTHING_TO_PAY_OUT';
  exception when others then assert sqlerrm = 'NOTHING_TO_PAY_OUT', sqlerrm; end;
  raise notice 'drop-off: codes unreadable by the sitter, wrong attempts counted, correct code starts the mission; money HELD, not withdrawable';
end $$;

-- Bob (outsider) cannot read the chat or events.
do $$ begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000b2'); set local role authenticated;
  assert (select count(*) from public.messages) = 0, 'outsider cannot read the chat';
  assert (select count(*) from public.mission_events) = 0, 'outsider cannot read events';
  raise notice 'chat: private to the two mission parties';
end $$;

-- Early pick-up requested by the owner: the sitter must give a reason; full price kept, Paw Points credited.
do $$
declare v_mission uuid := (select v::uuid from public._m where k = 'mA'); v_pick text;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  begin perform public.generate_pickup_code(v_mission); raise exception 'expected EARLY_REASON_REQUIRED';
  exception when others then assert sqlerrm = 'EARLY_REASON_REQUIRED', sqlerrm; end;
  v_pick := public.generate_pickup_code(v_mission, 'early_owner');
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  assert (select payload ->> 'reason' from public.mission_events where mission_id = v_mission and kind = 'pickup_code_generated') = 'early_owner',
    'owner sees the reason before typing the code';
  assert public.enter_pickup_code(v_mission, '999999') in ('invalid', 'completed');
  assert public.enter_pickup_code(v_mission, v_pick) = 'completed';
  reset role;
  assert (select refund_cents from public.missions where id = v_mission) = 0, 'early pick-up by the owner: no refund';
  assert (select status from public.wallet_entries where mission_id = v_mission) = 'available';
  assert (select paw_points from public.sitter_profiles where id = '00000000-0000-0000-0000-0000000000c1') = 50, '30 + first-mission bonus 20';
  raise notice 'pick-up (owner early): no refund, share AVAILABLE, Paw Points credited';
end $$;

-- Payout of the available balance.
do $$
declare v_payout uuid;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  v_payout := public.request_payout();
  assert (select amount_cents from public.payouts where id = v_payout) = 5700;
  assert (select count(*) from public.wallet_entries where status = 'available') = 0;
  raise notice 'wallet: available balance transferred to the bank account (payout request)';
end $$;

-- Scenario B — Alice ↔ Marc, 4 days, sitter withdraws after day 1 → owner pays 1/4, refund 3/4, no Paw Points.
do $$
declare v_req text; v_mission uuid; v_pick text;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date, 4,
    array['00000000-0000-0000-0000-0000000000c2']::uuid[], 8000);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.respond_to_offer(v_req, '00000000-0000-0000-0000-0000000000c2', 'accept');
  select id into v_mission from public.missions where request_id = v_req;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.confirm_mission(v_mission);
  insert into public._m values ('codeB', public.get_dropoff_code(v_mission)), ('mB', v_mission::text);
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.enter_dropoff_code(v_mission, (select v from public._m where k = 'codeB'));
  v_pick := public.generate_pickup_code(v_mission, 'early_sitter');
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.enter_pickup_code(v_mission, v_pick);
  reset role;
  assert (select days_done from public.missions where id = v_mission) = 1;
  assert (select charged_cents from public.missions where id = v_mission) = 2000, '1 day of 4';
  assert (select refund_cents from public.missions where id = v_mission) = 6000, 'owner refunded 3 days';
  assert (select amount_cents from public.wallet_entries where mission_id = v_mission) = 2000 - 100;
  assert (select paw_points from public.sitter_profiles where id = '00000000-0000-0000-0000-0000000000c2') = 0, 'no points when the sitter withdraws';
  assert (select owner_fee_refund_cents from public.missions where id = v_mission) = 400, 'owner 5 % fee refunded in full';
  raise notice 'early end (sitter withdraws): owner pays only the days done, rest refunded, 5 %% fee refunded in full, no Paw Points';
end $$;

-- Cancellation before the drop-off.
create or replace function pg_temp.new_confirmed_mission(p_sitter text, p_start date, p_price integer) returns uuid language plpgsql as $$
declare v_req text; v_mission uuid;
begin
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  v_req := public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', p_start, 2,
    array[p_sitter]::uuid[], p_price);
  reset role; perform pg_temp.act(p_sitter); set local role authenticated;
  perform public.respond_to_offer(v_req, p_sitter::uuid, 'accept');
  select id into v_mission from public.missions where request_id = v_req;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.confirm_mission(v_mission);
  reset role;
  return v_mission;
end $$;

do $$ begin
  assert private.cancellation_refund_rate(15 * 24) = 1.0 and private.cancellation_refund_rate(14 * 24) = 0.75
     and private.cancellation_refund_rate(72) = 0.75 and private.cancellation_refund_rate(71) = 0.5
     and private.cancellation_refund_rate(24) = 0.5 and private.cancellation_refund_rate(23) = 0, 'brackets';
  raise notice 'cancellation brackets: >14 d 100 %%, 3–14 d 75 %%, 24–72 h 50 %%, <24 h 0 %%';
end $$;

do $$
declare v_m uuid;
begin
  -- Owner cancels 20 days ahead → everything refunded, nothing retained.
  v_m := pg_temp.new_confirmed_mission('00000000-0000-0000-0000-0000000000c1', current_date + 20, 6000);
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.cancel_mission(v_m, 'Changement de programme');
  reset role;
  assert (select refund_cents from public.missions where id = v_m) = 6000 and (select cancellation_fee_cents from public.missions where id = v_m) = 0;

  -- Owner cancels 7 days ahead → 75 % refunded, 25 % retained for the sitter (minus commission).
  v_m := pg_temp.new_confirmed_mission('00000000-0000-0000-0000-0000000000c1', current_date + 7, 8000);
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.cancel_mission(v_m, 'Voyage annulé');
  reset role;
  assert (select refund_cents from public.missions where id = v_m) = 6000, '75 % refunded';
  assert (select cancellation_fee_cents from public.missions where id = v_m) = 2000, '25 % retained';
  assert (select status from public.wallet_entries where mission_id = v_m) = 'available';
  raise notice 'owner cancellation: refund by time left, retained fee credited to the sitter';

  -- Compassion: the sitter waives the fee → the owner gets everything back.
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  begin perform public.waive_cancellation_fee(v_m); raise exception 'expected FORBIDDEN';
  exception when others then assert sqlerrm = 'FORBIDDEN', sqlerrm; end;
  reset role; perform pg_temp.act('00000000-0000-0000-0000-0000000000c1'); set local role authenticated;
  perform public.waive_cancellation_fee(v_m);
  reset role;
  assert (select refund_cents from public.missions where id = v_m) = 8000 and (select cancellation_fee_waived from public.missions where id = v_m);
  assert (select status from public.wallet_entries where mission_id = v_m) = 'cancelled';
  raise notice 'compassion: only the sitter can waive the cancellation fee; owner refunded 100 %%';

  -- Owner cancels on the start day (< 24 h) → nothing refunded.
  v_m := pg_temp.new_confirmed_mission('00000000-0000-0000-0000-0000000000c1', current_date, 5000);
  perform pg_temp.act('00000000-0000-0000-0000-0000000000a1'); set local role authenticated;
  perform public.cancel_mission(v_m, 'Oubli');
  reset role;
  assert (select refund_cents from public.missions where id = v_m) = 0, '< 24 h: no refund';

  -- Sitter cancels (even last minute) → owner refunded 100 %, fee included.
  v_m := pg_temp.new_confirmed_mission('00000000-0000-0000-0000-0000000000c2', current_date, 5000);
  perform pg_temp.act('00000000-0000-0000-0000-0000000000c2'); set local role authenticated;
  perform public.cancel_mission(v_m, 'Urgence familiale');
  reset role;
  assert (select refund_cents from public.missions where id = v_m) = 5000 and (select owner_fee_refund_cents from public.missions where id = v_m) = 250;
  raise notice 'sitter cancellation: owner refunded 100 %% including the 5 %% fee';
end $$;

drop table public._m;
