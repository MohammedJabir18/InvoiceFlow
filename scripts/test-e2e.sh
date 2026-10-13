#!/usr/bin/env bash
# Runs end-to-end browser journey tests against an isolated loopback PostgreSQL cluster and local servers.
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

# In local environments with Google Chrome installed, default to chrome channel unless explicitly overridden or running in CI
if [[ -z "${PLAYWRIGHT_CHANNEL:-}" && -z "${CI:-}" && -x "/usr/bin/google-chrome" ]]; then
  export PLAYWRIGHT_CHANNEL="chrome"
fi

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

check_port_free() {
  local port="$1"
  local name="$2"
  if ! node -e "const s = require('node:net').createServer(); s.once('error', () => process.exit(1)); s.listen($port, '127.0.0.1', () => { s.close(); process.exit(0); });" 2>/dev/null; then
    echo "ERROR: Port $port for $name is already occupied. Terminate the conflicting process or choose another port." >&2
    exit 1
  fi
}

wait_for_service() {
  local url="$1"
  local pid="$2"
  local name="$3"
  local max_attempts=50
  local delay=0.2

  for ((i=1; i<=max_attempts; i++)); do
    # 1. Check if process is still alive
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "ERROR: $name process (PID $pid) terminated unexpectedly during startup." >&2
      local logfile="$scratch/${name,,}.log"
      if [[ -f "$logfile" ]]; then
        echo "=== $name Startup Log ===" >&2
        cat "$logfile" >&2
      fi
      exit 1
    fi

    # 2. Check HTTP endpoint
    if curl -s -f "$url" >/dev/null 2>&1; then
      echo "$name is ready at $url (PID $pid)."
      return 0
    fi

    sleep "$delay"
  done

  echo "ERROR: Timed out waiting for $name to be ready at $url." >&2
  local logfile="$scratch/${name,,}.log"
  if [[ -f "$logfile" ]]; then
    echo "=== $name Startup Log ===" >&2
    cat "$logfile" >&2
  fi
  exit 1
}

# Verify required ports are free before startup
check_port_free 3001 "API Server"
check_port_free 5173 "Web Preview Server"

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
wait_for_service "http://127.0.0.1:3001/health" "$api_pid" "api"

echo "=== Starting Web preview server on port 5173 ==="
(cd apps/web && npx vite preview --port 5173 --strictPort --host 127.0.0.1) > "$scratch/web.log" 2>&1 &
web_pid=$!
wait_for_service "http://127.0.0.1:5173" "$web_pid" "web"

echo "=== Running Playwright Browser Journey Tests ==="
(cd apps/web && npx playwright test)

echo "=== Playwright Tests Completed Successfully ==="
