# InvoiceFlow — current architecture

Updated 12 October 2026 from source inspection and recorded verification. Start with [[project-summary]] for product requirements. Earlier architecture notes are preserved in [[architecture-history-2026-10-12]]; their Vite 8, schema, checksum and unimplemented endpoint claims are not current implementation evidence.

## Implemented repository structure

- apps/web: React/TypeScript/Vite SaaS shell. Recorded Vite build 6.4.4; TanStack Query for server state, Zustand for transient UI, React Router and Tailwind.
- apps/api: Fastify 5 API; Zod validation, jose JWT verification, pg/Kysely access. Registered groups: health, auth, organizations, members. Hosted production auth requires asymmetric JWKS; local test auth uses an explicitly configured development secret.
- packages/db: Kysely types and PostgreSQL access, migrations 001–003, standalone auth fixtures. Declared business tables: users, organizations, organization_memberships; migration ledger _migrations.
- packages/shared-types: shared TypeScript contracts.
- apps/desktop: React/Vite frontend (recorded Vite 6.4.1) and Tauri v2 Rust shell.
- crates/flow-core, flow-db, flow-invoice, flow-analytics, flow-pdf: desktop domain/core, SQLite access, calculations/numbering, analytics, PDF support. Exact rendering capabilities should be verified before adding templates.

## Tenant data and security

Organizations contain legal/display name, country/tax identifier/address/contact details, timezone, locale, document_language, base_currency, reporting_currency and financial-year start. Membership roles are OWNER, ADMIN, FINANCE, VIEWER, not the historical lowercase role set.

Application membership checks precede tenant-scoped queries. Kysely transactions set app.current_org_id and, when provided, app.current_user_id using parameterized transaction-local set_config. RLS provides another boundary. Existing tests check this foundation, not all future financial tables.

Migration runner records applied names in public._migrations and applies migration SQL in transactions. It does not currently record SHA-256 migration checksums. Standalone auth.users fixture is test-only.

## Product boundaries / planned work

Cloud client/invoice/quotation/payment domains, provider webhook routes, subscription billing and analytics are planned; do not infer completion from desktop screens or historical feature flags. Desktop payment settlement and AI paths include simulation/stub behavior. No production payment or Laya integration was verified in this conversation.

Product direction: India-first with GCC expansion, tenant-owned business/client records, one monthly/yearly subscription plan, linked quote/invoice documents, built-in editable invoice templates and minimal filtered dashboard. Detailed lifecycle/finance/Laya recommendations remain subject to requirements reconciliation; see [[project-summary]].

## Development harness

Node 24.21.0 LTS, Bun 1.4.3 and Rust/Cargo 1.99.0 were used. PostgreSQL 18 is a disposable test environment, not a production database decision. .nvmrc and scripts/dev-env.sh select Node; Cargo.lock is retained. Root npm and separate desktop Bun lockfiles have distinct ownership. Vitest is pinned to 4.1.11.

./init.sh builds SaaS packages in dependency order, type-checks, builds desktop and checks the locked Rust workspace. ./init.sh --saas checks SaaS only. npm test provisions its own local PostgreSQL cluster, applies fixtures/migrations and runs API suites. NODE_ENV=test does not load local .env credentials.

Recorded evidence: foundation commit 4b33153; full build checks and clean SaaS install/build passed; 47 API tests passed; root npm audit zero reported advisories. Browser journeys, hosted integrations, full security/load assessment and production deployment remain pending. See ../docs/development-setup.md and ../artifacts/foundation/.

## Graph memory reliability

brain/graph.json remains the retained older graph; the interrupted update did not produce a verified replacement. Obsidian export completed from that retained graph. Missing SQL parser, partial TSX extraction and indexing of installed skill code limit graph coverage/relevance. Graph relationships assist navigation; source and runtime evidence determine implementation status.
