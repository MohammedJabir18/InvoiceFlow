#!/usr/bin/env bash
# Runs end-to-end browser journey tests against an isolated loopback PostgreSQL cluster and local servers.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source scripts/dev-env.sh

pg_bin="${INVOICEFLOW_PG_BIN:-/usr/lib/postgresql/18/bin}"
[[ -x "$pg_bin/initdb" ]] || { echo 'PostgreSQL binaries required; set INVOICEFLOW_PG_BIN.' >&2; exit 1; }

echo "=== Building SaaS packages ==="
npm run build -w @invoiceflow/shared-types
npm run build -w @invoiceflow/db
npm run build -w @invoiceflow/api
npm run build -w @invoiceflow/web

scratch="$(mktemp -d /tmp/invoiceflow-e2e.XXXXXXXX)"
pg_port="$(node -e 'const s=require("node:net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"

api_pid=""
web_pid=""

cleanup() {
  echo "Cleaning up test processes..."
  if [[ -n "$web_pid" ]]; then kill "$web_pid" 2>/dev/null || true; fi
  if [[ -n "$api_pid" ]]; then kill "$api_pid" 2>/dev/null || true; fi
  "$pg_bin/pg_ctl" -D "$scratch/data" -m fast -w stop >/dev/null 2>&1 || true
  rm -rf "$scratch" 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Initializing isolated PostgreSQL cluster on port $pg_port ==="
"$pg_bin/initdb" -D "$scratch/data" -U postgres -A trust --encoding=UTF8 --no-locale > "$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/data" -l "$scratch/postgres.log" -o "-h 127.0.0.1 -p $pg_port -k $scratch" -w start >/dev/null

"$pg_bin/psql" -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p "$pg_port" -U postgres -d postgres <<'SQL'
CREATE ROLE invoiceflow_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
CREATE DATABASE invoiceflow_test;
SQL

export NODE_ENV=test
export DATABASE_URL="postgresql://invoiceflow_app@127.0.0.1:$pg_port/invoiceflow_test"
export MIGRATOR_DATABASE_URL="postgresql://postgres@127.0.0.1:$pg_port/invoiceflow_test"
export TEST_PROVISIONER_DATABASE_URL="$MIGRATOR_DATABASE_URL"
export SUPABASE_URL='http://127.0.0.1:54321'
export SUPABASE_JWT_SECRET='super_secret_local_dev_jwt_secret_min_32_chars_long_123456'
unset SUPABASE_JWKS_URL
export STANDALONE_POSTGRES_FIXTURES=true

echo "=== Running database migrations ==="
node packages/db/dist/migrate.js

echo "=== Starting API server on port 3001 ==="
PORT=3001 HOST=127.0.0.1 node apps/api/dist/index.js > "$scratch/api.log" 2>&1 &
api_pid=$!

# Wait for API server to be responsive
for i in {1..30}; do
  if curl -s http://127.0.0.1:3001/health >/dev/null 2>&1; then
    echo "API server ready."
    break
  fi
  sleep 0.2
done

echo "=== Starting Web preview server on port 5173 ==="
(cd apps/web && npx vite preview --port 5173 --host 127.0.0.1) > "$scratch/web.log" 2>&1 &
web_pid=$!

# Wait for Web server to be responsive
for i in {1..30}; do
  if curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
    echo "Web server ready."
    break
  fi
  sleep 0.2
done

echo "=== Running Playwright Browser Journey Tests ==="
(cd apps/web && npx playwright test)

echo "=== Playwright Tests Completed Successfully ==="
