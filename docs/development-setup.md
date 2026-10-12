# InvoiceFlow development setup

## Toolchain

Verified target: Node 24.21.0 LTS (`.nvmrc`), Bun 1.4.3, Rust/Cargo 1.99.0, PostgreSQL 18 for isolated integration tests. The PostgreSQL version used in these tests is not a production hosting selection.

On this workstation Node is installed at `~/.local/share/invoiceflow-toolchains/node-v24.21.0-linux-x64`, Bun at `~/.bun`, Rust at `~/.cargo` / `~/.rustup`. Bash PATH was appended without replacing existing configuration. Open a fresh terminal, or run:

```bash
source scripts/dev-env.sh
node --version
bun --version
cargo --version
```

The startup and test scripts source this helper themselves, including when launched from Codex with an older inherited PATH. On other machines install Node matching `.nvmrc` with your version manager; the helper uses the local installation only if present. Node 20 is incompatible with current Kysely/Supabase dependencies.

Linux native desktop prerequisites on Ubuntu/Debian:

```bash
sudo apt update
sudo apt install build-essential pkg-config libwebkit2gtk-4.1-dev libssl-dev libxdo-dev libayatana-appindicator3-dev librsvg2-dev postgresql
```

See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for other distributions.

## Install locked dependencies

Do not copy `node_modules` between operating systems. The root npm lockfile includes platform-specific optional packages. Keep `Cargo.lock` under version control for repeatable native resolution.

```bash
source scripts/dev-env.sh
npm ci --include=optional
(cd apps/desktop && bun install --frozen-lockfile)
```

Root npm workspaces cover the SaaS packages; desktop remains a separate Bun workspace. Do not regenerate one lockfile using the other package manager. Recent npm may warn about esbuild lifecycle-script approval; Linux native packages are included in the lockfile, and build verification remains the acceptance gate.

## Verification

```bash
./init.sh          # SaaS type-check/build, desktop build, locked Rust workspace check
./init.sh --saas   # SaaS type-check/build only
npm test          # runs scripts/test-api-local.sh
```

Build order explicitly compiles shared-types and db before API/web. Missing workspace type-check scripts fail instead of being silently skipped. The legacy `npm run lint` is not evidence of lint coverage: lint configuration is still a future task. Browser journeys are not covered by this foundation check.

The API runner creates a new cluster in a unique `/tmp/invoiceflow-api-test.*` directory, binds only to loopback at an ephemeral port, creates a restricted runtime role, applies migrations and runs the security/isolation/migration suites. It never reuses an existing DATABASE_URL. Test-mode config skips `.env` loading. Fixtures use a local JWT secret and a minimal auth schema, not hosted Supabase Auth.

Set `INVOICEFLOW_PG_BIN` to your PostgreSQL binary directory if not `/usr/lib/postgresql/18/bin`. Run as a regular user. Test-only loopback authentication is trust-based; this runner is intended for a trusted developer workstation, not shared/public infrastructure. The cluster is stopped on completion/failure; temporary data/logs remain for diagnosis. Never run the API tests directly against production: migration tests create/drop databases and other tests mutate fixtures.

## Security scope

Vitest is pinned to 4.1.11 to remove findings in the previous Vitest/tinypool/mocker dependency chain. `npm audit` is dependency-advisory evidence only, not a full security audit. Use `source scripts/dev-env.sh` before npm commands outside the scripts.

## Verification evidence — 12 October 2026

- A fresh temporary copy without node_modules, dist or TypeScript build caches passed npm ci and ./init.sh --saas.
- API isolation/security/migration suite: 47 tests passed across 3 files on disposable PostgreSQL 18; cluster stopped afterwards.
- Root npm audit: 0 reported advisories. This does not cover Rust advisories, the separate desktop dependency graph, or application security.
- Rust workspace compilation passed after adding the missing workspace rust_decimal dependency to flow-pdf.
- Remaining non-blocking warnings: large frontend bundles, mixed static/dynamic import in desktop PDF generation, unused Rust import/field.
- Browser journeys, hosted auth/payment integrations, production deployment and load tests were not performed in this foundation task.
- Local command logs are retained in ignored artifacts/foundation/.
