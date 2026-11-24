#!/usr/bin/env bash
# Two sitters accept the SAME request at the same time, in two separate connections.
# Expected: exactly one wins ('locked'), the other gets REQUEST_LOCKED. Run after scripts/db-test.sh.
set -euo pipefail
DB=fourpetsgo_test
export PGUSER="${PGUSER:-postgres}"
as() { echo "set role authenticated; select set_config('request.jwt.claims', '{\"sub\":\"$1\",\"role\":\"authenticated\"}', false);"; }
REQ=$(psql -qAt -d "$DB" <<SQL | tail -1
$(as 00000000-0000-0000-0000-0000000000a1)
select public.create_booking_request(array['00000000-0000-0000-0000-00000000f001']::uuid[], 'boarding', current_date + 3, 2,
  array['00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000c2']::uuid[]);
SQL
)
echo "request $REQ"
TMP=$(mktemp -d)
# Session A takes the row lock, then holds the transaction open for 2 s.
psql -qAt -d "$DB" > "$TMP/a" 2>&1 <<SQL &
$(as 00000000-0000-0000-0000-0000000000c1)
begin;
select public.respond_to_offer('$REQ', '00000000-0000-0000-0000-0000000000c1', 'accept');
select pg_sleep(2);
commit;
SQL
sleep 0.5
# Session B tries to accept while A is still in flight: it must wait, then fail.
psql -qAt -d "$DB" > "$TMP/b" 2>&1 <<SQL &
$(as 00000000-0000-0000-0000-0000000000c2)
select public.respond_to_offer('$REQ', '00000000-0000-0000-0000-0000000000c2', 'accept');
SQL
wait
echo "session A (Camille): $(grep -v '^$' "$TMP/a" | grep -v set_config | tr '\n' ' ')"
echo "session B (Marc):    $(grep -v '^$' "$TMP/b" | tr '\n' ' ')"
grep -q '^locked$' "$TMP/a" && grep -q 'REQUEST_LOCKED' "$TMP/b" \
  && [ "$(psql -qAt -d "$DB" -c "select locked_sitter_id from public.booking_requests where id = '$REQ'")" = "00000000-0000-0000-0000-0000000000c1" ] \
  && [ "$(psql -qAt -d "$DB" -c "select count(*) from public.missions where request_id = '$REQ'")" = "1" ] \
  && echo "Concurrency test passed: one winner, one mission." || { echo "Concurrency test FAILED"; exit 1; }
