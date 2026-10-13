#!/usr/bin/env bash
# Always creates its own PostgreSQL cluster. Never uses an existing DATABASE_URL.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/dev-env.sh
if [[ -z "${INVOICEFLOW_PG_BIN:-}" ]]; then
  if [[ -x "/usr/lib/postgresql/18/bin/initdb" ]]; then
    pg_bin="/usr/lib/postgresql/18/bin"
  elif command -v pg_config >/dev/null 2>&1 && [[ -x "$(pg_config --bindir)/initdb" ]]; then
    pg_bin="$(pg_config --bindir)"
  elif [[ -d "/usr/lib/postgresql" ]]; then
    pg_bin="$(find /usr/lib/postgresql -mindepth 1 -maxdepth 1 -name '[0-9]*' 2>/dev/null | sort -V | tail -n 1)/bin"
  else
    pg_bin="/usr/lib/postgresql/18/bin"
  fi
else
  pg_bin="$INVOICEFLOW_PG_BIN"
fi
[[ -x "$pg_bin/initdb" ]] || { echo 'PostgreSQL binaries required; set INVOICEFLOW_PG_BIN.' >&2; exit 1; }
npm run build -w @invoiceflow/shared-types
npm run build -w @invoiceflow/db
scratch="$(mktemp -d /tmp/invoiceflow-api-test.XXXXXXXX)"
port="$(node -e 'const s=require("node:net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
cleanup() { "$pg_bin/pg_ctl" -D "$scratch/data" -m fast -w stop >/dev/null 2>&1 || true; }
trap cleanup EXIT
"$pg_bin/initdb" -D "$scratch/data" -U postgres -A trust --encoding=UTF8 --no-locale > "$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/postgres.log" -o "-h 127.0.0.1 -p $port -k $scratch" -w start >/dev/null
"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$port" -U postgres -d postgres <<'SQL'
CREATE ROLE invoiceflow_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE invoiceflow_test;
SQL
export NODE_ENV=test
export DATABASE_URL="postgresql://invoiceflow_app@127.0.0.1:$port/invoiceflow_test"
export MIGRATOR_DATABASE_URL="postgresql://postgres@127.0.0.1:$port/invoiceflow_test"
export TEST_PROVISIONER_DATABASE_URL="$MIGRATOR_DATABASE_URL"
export SUPABASE_URL='http://127.0.0.1:54321'
export SUPABASE_JWT_SECRET='invoiceflow-isolated-tests-only-secret-0000000000'
unset SUPABASE_JWKS_URL
export STANDALONE_POSTGRES_FIXTURES=true
node packages/db/dist/migrate.js
npm run test -w @invoiceflow/api -- --maxWorkers=1 --no-file-parallelism
"$pg_bin/pg_ctl" -D "$scratch/data" -m fast -w stop >/dev/null
trap - EXIT
echo "Disposable PostgreSQL stopped; test logs retained at $scratch."
