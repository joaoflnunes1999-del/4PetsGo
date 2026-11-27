-- 4PetsGo — mandatory mission photos every 48 h (PRD §3.9). Mirrors src/features/chat/photoSchedule.ts:
-- slot k is due at started_at + k × 48 h (while before the end of the stay); it is satisfied by an image sent
-- by the sitter in its window (after the previous slot, up to 6 h after the due time); one image per slot.
-- An hourly job posts a 'photo_due' event 12 h before the deadline and a 'photo_late' event after it,
-- once per slot. Phase 3 turns these events into push notifications (never containing any code).

create or replace function private.photo_reminders_due(p_now timestamptz default now())
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_m record;
  v_k integer;
  v_due timestamptz;
  v_end timestamptz;
  v_used uuid[];
  v_hit uuid;
  v_count integer := 0;
begin
  for v_m in
    select m.id, m.sitter_id, m.started_at, r.days
    from public.missions m join public.booking_requests r on r.id = m.request_id
    where m.status = 'in_progress' and m.started_at is not null
  loop
    v_end := v_m.started_at + make_interval(days => v_m.days);
    v_used := '{}';
    v_k := 1;
    while v_m.started_at + make_interval(hours => 48 * v_k) < v_end loop
      v_due := v_m.started_at + make_interval(hours => 48 * v_k);
      select msg.id into v_hit from public.messages msg
      where msg.mission_id = v_m.id and msg.sender_id = v_m.sitter_id and msg.attachment_mime like 'image/%'
        and msg.created_at > v_due - interval '48 hours' and msg.created_at <= v_due + interval '6 hours'
        and not (msg.id = any (v_used))
      order by msg.created_at limit 1;
      if v_hit is not null then
        v_used := v_used || v_hit;
      elsif p_now > v_due + interval '6 hours' then
        if not exists (select 1 from public.mission_events e where e.mission_id = v_m.id and e.kind = 'photo_late' and (e.payload ->> 'slot')::integer = v_k) then
          insert into public.mission_events (mission_id, kind, payload) values (v_m.id, 'photo_late', jsonb_build_object('slot', v_k, 'day', v_k * 2));
          v_count := v_count + 1;
        end if;
      elsif p_now >= v_due - interval '12 hours' then
        if not exists (select 1 from public.mission_events e where e.mission_id = v_m.id and e.kind = 'photo_due' and (e.payload ->> 'slot')::integer = v_k) then
          insert into public.mission_events (mission_id, kind, payload)
          values (v_m.id, 'photo_due', jsonb_build_object('slot', v_k, 'day', v_k * 2, 'deadline', v_due + interval '6 hours'));
          v_count := v_count + 1;
        end if;
      end if;
      v_hit := null;
      v_k := v_k + 1;
    end loop;
  end loop;
  return v_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('photo-reminders', '5 * * * *', 'select private.photo_reminders_due()');
  end if;
end;
$$;
