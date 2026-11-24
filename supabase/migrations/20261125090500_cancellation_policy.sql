-- 4PetsGo — cancellation policy before the drop-off and fee refunds (founder rules, 25/11/2026).
--  * Owner cancels: refund of the service price by time left before the start:
--      > 14 days → 100 % · 3–14 days → 75 % · 24–72 h → 50 % · < 24 h → 0 %.
--    The retained part (cancellation fee) goes to the sitter, minus their commission.
--  * Sitter cancels: owner refunded 100 %.
--  * The sitter may WAIVE the cancellation fee (compassion, e.g. an emergency) → service price refunded 100 %,
--    but 4PetsGo keeps its 5 % fee: it is still charged to the owner.
--  * Owner cancels: the 5 % fee is never refunded. Sitter cancels or withdraws: the 5 % fee is refunded in full.

alter table public.missions
  add column owner_fee_refund_cents integer,
  add column cancelled_by text check (cancelled_by in ('owner', 'sitter')),
  add column cancelled_at timestamptz,
  add column cancel_reason text,
  add column cancellation_fee_cents integer,
  add column cancellation_fee_waived boolean not null default false;

-- Missions start at 00:00 Europe/Paris on start_date (FR and CH share the time zone).
create or replace function private.mission_start_at(p_start_date date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select (p_start_date::timestamp at time zone 'Europe/Paris');
$$;

create or replace function private.cancellation_refund_rate(p_hours_before_start numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when p_hours_before_start > 14 * 24 then 1.0
    when p_hours_before_start >= 72 then 0.75
    when p_hours_before_start >= 24 then 0.5
    else 0
  end;
$$;

create or replace function public.cancel_mission(p_mission_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
  v_by text;
  v_rate numeric;
  v_hours numeric;
  v_retained integer := 0;
  v_currency text;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or (select auth.uid()) not in (v_m.owner_id, v_m.sitter_id) then raise exception 'FORBIDDEN'; end if;
  if v_m.status not in ('pending_payment', 'confirmed') then raise exception 'INVALID_STATUS'; end if;
  v_by := case when (select auth.uid()) = v_m.owner_id then 'owner' else 'sitter' end;

  if v_m.status = 'confirmed' then
    v_hours := extract(epoch from (private.mission_start_at(v_m.start_date) - now())) / 3600;
    v_rate := case when v_by = 'sitter' then 1.0 else private.cancellation_refund_rate(v_hours) end;
    v_retained := v_m.price_cents - round(v_m.price_cents * v_rate);
    update public.missions set
      refund_cents = v_m.price_cents - v_retained,
      -- The platform keeps its 5 % fee when the OWNER cancels; refunded in full when the SITTER cancels.
      owner_fee_refund_cents = case when v_by = 'sitter' then v_m.owner_fee_cents else 0 end,
      cancellation_fee_cents = v_retained,
      sitter_earned_cents = v_retained - round(v_retained * v_m.sitter_commission_rate)
    where id = p_mission_id;
    if v_retained > 0 then
      select r.currency into v_currency from public.booking_requests r where r.id = v_m.request_id;
      insert into public.wallet_entries (sitter_id, mission_id, amount_cents, currency, status, available_at)
      values (v_m.sitter_id, v_m.id, v_retained - round(v_retained * v_m.sitter_commission_rate), v_currency, 'available', now());
    end if;
  end if;

  update public.missions set status = 'cancelled', cancelled_by = v_by, cancelled_at = now(), cancel_reason = left(coalesce(p_reason, ''), 400)
  where id = p_mission_id;
  perform private.log_event(p_mission_id, 'cancelled', jsonb_build_object('by', v_by, 'cancellation_fee_cents', v_retained));
end;
$$;

-- Compassion: the sitter gives up the cancellation fee (only while it has not been transferred).
create or replace function public.waive_cancellation_fee(p_mission_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m public.missions;
begin
  select * into v_m from public.missions where id = p_mission_id for update;
  if not found or v_m.sitter_id is distinct from (select auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if v_m.status <> 'cancelled' or coalesce(v_m.cancellation_fee_cents, 0) = 0 or v_m.cancellation_fee_waived then
    raise exception 'NOTHING_TO_WAIVE';
  end if;
  if exists (select 1 from public.wallet_entries where mission_id = p_mission_id and status = 'paid_out') then
    raise exception 'ALREADY_PAID_OUT';
  end if;
  update public.wallet_entries set status = 'cancelled', amount_cents = 0 where mission_id = p_mission_id;
  update public.missions set
    -- Compassion covers the sitter's part only: 4PetsGo's 5 % fee stays charged to the owner.
    cancellation_fee_waived = true, refund_cents = price_cents,
    cancellation_fee_cents = 0, sitter_earned_cents = 0
  where id = p_mission_id;
  perform private.log_event(p_mission_id, 'cancellation_fee_waived');
end;
$$;

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
    charged_cents = v_charged, refund_cents = v_m.price_cents - v_charged, sitter_earned_cents = v_earned,
    -- Sitter withdraws → the owner's 5 % service fee is refunded in full (founder rule 25/11/2026).
    owner_fee_refund_cents = case when v_c.pickup_reason = 'early_sitter' then v_m.owner_fee_cents else 0 end
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

revoke execute on function public.waive_cancellation_fee(uuid) from anon, public;
grant execute on function public.waive_cancellation_fee(uuid) to authenticated;
