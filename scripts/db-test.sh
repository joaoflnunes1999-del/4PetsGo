#!/usr/bin/env bash
# Applies all migrations to a throw-away local PostgreSQL database (with a Supabase shim) and runs the SQL tests.
# Usage: PGHOST=/tmp PGPORT=54329 scripts/db-test.sh
set -euo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."
DB=fourpetsgo_test
export PGUSER="${PGUSER:-postgres}"
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1" >/dev/null; }
run supabase/tests/00_supabase_shim.sql
for f in supabase/migrations/*.sql; do run "$f"; done
echo "migrations applied: $(ls supabase/migrations/*.sql | wc -l)"
for f in supabase/tests/[1-9]*.sql; do
  if out=$(psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" 2>&1); then
    echo "$out" | grep -E "NOTICE" | sed 's/.*NOTICE:  /  ✓ /' || true
  else
    echo "$out" | sed 's/^/  /'; echo "FAILED $(basename "$f")"; exit 1
  fi
done
echo "All database tests passed."
