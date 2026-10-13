#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
source scripts/dev-env.sh

mode="${1:-all}"
if [[ "$mode" != all && "$mode" != --saas ]]; then
  echo 'Usage: ./init.sh [--saas]' >&2
  exit 2
fi
command -v node >/dev/null || { echo 'Node 24 LTS required. See docs/development-setup.md.' >&2; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) !== 24) { console.error("Node 24 LTS required; found " + process.version); process.exit(1); }'
printf 'Node: %s\n' "$(node --version)"
echo '=== SaaS build ==='
npm run build
echo '=== SaaS type-check ==='
npm run typecheck
if [[ "$mode" == all ]]; then
  command -v bun >/dev/null || { echo 'Bun required. See docs/development-setup.md.' >&2; exit 1; }
  command -v cargo >/dev/null || { echo 'Rust/Cargo required. See docs/development-setup.md.' >&2; exit 1; }
  echo '=== Desktop frontend build ==='
  (cd apps/desktop && bun run build)
  echo '=== Rust workspace check ==='
  cargo check --workspace --locked
fi
echo '=== Build/type-check verification complete ==='
echo 'Database integration tests and browser journeys are separate; see docs/development-setup.md.'
