# InvoiceFlow — Session History & Continuity Log

Welcome to the InvoiceFlow Session Log. This file tracks our development progress across all pairing sessions, recording dates, goals, completed tasks, architectural decisions, and pending tasks.

---

## Session 2026-10-13: Workspace Switch Isolation & Scoped Placeholder Data (feat-010d)

- **Date:** 2026-10-13
- **Lead AI:** Antigravity AI Pair Programmer (Gemini 3.8 Flash High)
- **Primary Goals:**
  - Address remaining workspace-switch UI data leak identified in `brain/reviews/2026-10-13-antigravity-integration-review.md`:
    - Ensure `useClients` reuses previous pagination data only within the exact same organization.
    - Clear old client rows, modals, editing state, and filters upon workspace switch.
    - Display explicit loading spinner state during new organization client fetches.
    - Disable stale row actions during placeholder data states.
    - Keep same-organization page navigation smooth and responsive.
    - Add a permanent Playwright Test 6 browser regression with delayed response.
- **Completed Tasks:**
  - [x] Updated `apps/web/src/hooks/queries.ts`: scoped `placeholderData` in `useClients` to `previousQuery?.queryKey?.[1] === orgId ? previousData : undefined`.
  - [x] Updated `apps/web/src/components/DashboardShell.tsx`: keyed `<ClientsView key={currentOrgId || 'none'} />` ensuring complete component remount on workspace switch.
  - [x] Updated `apps/web/src/components/ClientsView.tsx`:
    - Added explicit `useEffect` on `currentOrgId` to clear modals, editing state, and form alerts.
    - Rendered explicit spinner loading state with `data-testid="clients-loading-state"`.
    - Added `disabled={isPlaceholderData}` to row action buttons (`Edit`, `Archive`, `View Details`).
  - [x] Added Playwright E2E Test 6 in `apps/web/e2e/auth-and-journey.spec.ts`: verifies user switching from Workspace Alpha to Workspace Beta with delayed Beta fetch immediately clears Alpha rows, shows loading state, hides Alpha actions, and renders Beta empty state cleanly upon response release.
  - [x] Verified `./init.sh` PASS (full build, typecheck, cargo check).
  - [x] Verified `npm test` PASS (75/75 API tests on disposable PostgreSQL 18).
  - [x] Verified `bash scripts/test-e2e.sh` PASS (6/6 Playwright browser journeys in 10.1s).
- **Decisions Made:**
  - **Scoped Placeholder Scoping:** Constrained TanStack Query's placeholder data to identical tenant keys (`previousQuery.queryKey[1] === orgId`), maintaining smooth intra-organization pagination without leaking cross-workspace data.
  - **Keyed Remount Defense:** Keyed `ClientsView` on `currentOrgId` in `DashboardShell` to guarantee fresh local state across tenant switches in addition to reactive hook cleanup.
- **Pending Tasks / Recommended Next Steps:**
  - Review diff and prepare draft PR for Milestone 1A foundation and client management into `main`.
  - Verify live Supabase Auth against hosted project or local Supabase CLI when credentials are provisioned.
  - Begin Milestone 1B: Quotations & Estimates domain models and linking.

---

## Session 2026-10-13: SaaS Client Frontend Integration Completion, Hardened Pagination & Deterministic CI (feat-010c)

- **Date:** 2026-10-13
- **Lead AI:** Antigravity AI Pair Programmer (Gemini 3.8 Flash High)
- **Primary Goals:**
  - Address remaining integration findings from `brain/reviews/2026-10-13-antigravity-hardening-followup.md`:
    1. FINANCE contact editing: Omit lifecycle `status` from FINANCE payloads to prevent 403 Forbidden; guard archive/restore UI controls to OWNER/ADMIN; add browser regression test.
    2. Complete client directory pagination: Pass `page`/`limit` through typed API and query cache keys (`keepPreviousData`), add pagination footer controls with total count and page navigation, ensure secondary sorting tie-breaker (`id desc`), and verify with >50 clients fixture.
    3. Deterministic CI browser setup: Explicit `npx playwright install --with-deps chromium` in GitHub Actions, optional `channel` in config, and report artifact upload.
- **Completed Tasks:**
  - [x] Added `PaginationMetadata`, `PaginatedResult<T>`, and `ListClientsParams` to `packages/shared-types/src/index.ts`.
  - [x] Added deterministic secondary tie-breaker `.orderBy('id', 'desc')` in `apps/api/src/routes/clients.ts`.
  - [x] Added `fetchWithAuthEnvelope` in `apps/web/src/lib/api-client.ts` preserving both `data` and top-level `pagination` metadata; updated `api.clients.list` to return `PaginatedResult<Client>`.
  - [x] Updated `useClients` in `apps/web/src/hooks/queries.ts` with `placeholderData: keepPreviousData` and cache keys `[orgId, status, search, page, limit]`.
  - [x] Updated `ClientsView.tsx`:
    - Extracted `canManageLifecycle = org?.role === 'OWNER' || org?.role === 'ADMIN'`.
    - Omitted `status` from payload unless `canManageLifecycle` and status changed.
    - Rendered `status` in Edit Modal as read-only badge with helper note for non-lifecycle managers.
    - Hid "Archive" action button for non-lifecycle managers.
    - Added pagination footer controls ("Showing X to Y of Z clients", Previous/Next, "Page X of Y").
    - Added automatic page reset on search/filter/org changes and page clamping to `totalPages`.
  - [x] Configured `apps/web/playwright.config.ts` to make `channel` optional (matching bundled Chromium in CI) and generate HTML reports in CI.
  - [x] Updated `scripts/test-e2e.sh` to default `PLAYWRIGHT_CHANNEL="chrome"` only in non-CI environments with Google Chrome present.
  - [x] Updated `.github/workflows/saas-ci.yml` with `playwright install --with-deps chromium` and test report artifact upload.
  - [x] Added Playwright E2E Test 4 (FINANCE contact editing regression & guarded lifecycle controls) and Test 5 (Directory pagination with 52 clients, page 1 to 2 navigation, and search filter reset).
  - [x] Verified `./init.sh` PASS (full build/typecheck/cargo check).
  - [x] Verified `npm test` PASS (75/75 API tests on isolated PostgreSQL 18).
  - [x] Verified `bash scripts/test-e2e.sh` PASS (5/5 browser journeys in 8.5s).
- **Decisions Made:**
  - **Payload Hygiene Over Server Permissiveness:** Maintained strict server-side authorization (blocking FINANCE from modifying lifecycle status) by fixing the UI payload instead of weakening backend security boundaries.
  - **Deterministic Pagination Ordering:** Added secondary sort on primary key `id DESC` after `created_at DESC` to eliminate row jumps across page boundaries when timestamps coincide.
  - **Non-Destructive Query Transitions:** Used TanStack Query's `keepPreviousData` and conditional clamping to prevent premature reset to page 1 during query fetches.
- **Pending Tasks / Recommended Next Steps:**
  - Create and push PR for `feat/milestone-1a-saas-foundation` into `main` when authorized.
  - Verify real Supabase authentication against hosted project or local Supabase CLI instance.
  - Begin Milestone 1B: Quotation and Invoice domain models and linking.

---

## Session 2026-10-13: Local Installation of Advanced Skills Suites (Security, Mental Models, Anti-Slop, XIAS Design Systems)

- **Date:** 2026-10-13
- **Lead AI:** Lead AI Pair Programmer (Gemini 3.8 Flash High)
- **Primary Goals:**
  - Install requested skill suites locally into `.agents/skills/` and `.claude/skills/`:
    1. `plugin87/ux-ui-agent-skills` (XIAS)
    2. `tjboudreaux/cc-thinking-skills`
    3. `cloudflare/security-audit-skill`
    4. `miqdadbadjuber/anti-slop`
  - Ensure zero collision with existing skills (`brandkit`, `prototype`).
  - Set up full supporting design tokens, specs, rules, and scripts for XIAS.

- **Completed Tasks:**
  - [x] Cloned and verified all 4 repositories from GitHub.
  - [x] Installed `cloudflare/security-audit-skill` (`security-audit` skill + attack-class modules + audit validators) into `.agents/skills/security-audit/` and `.claude/skills/security-audit/`.
  - [x] Installed all 28 `tjboudreaux/cc-thinking-skills` (`thinking-first-principles`, `thinking-systems`, `thinking-pre-mortem`, etc.) into `.agents/skills/` and `.claude/skills/`.
  - [x] Installed all 6 `miqdadbadjuber/anti-slop` skills (`antislop`, `antislop-ui`, `antislop-copywriting`, `antislop-code`, `antislop-human`, `antislop-layoutmobile`) into `.agents/skills/` and `.claude/skills/`.
  - [x] Installed `plugin87/ux-ui-agent-skills` (XIAS):
    - 25 runnable skills (`a11y-audit`, `apply-aesthetic`, `ux-brandkit`, `critique`, `data-dashboard`, `design-code`, `design-component`, `design-doctrine`, `design-qa`, `design-review`, `design-screen`, `design-tokens`, `figma-integration`, `gate`, `governance`, `grill-me`, `image-to-code`, `migrate-design-system`, `performance`, `ux-prototype`, `redesign`, `scaffold-project`, `ship`, `token-build`, `ux-writing`).
    - Supporting design kit: `tokens/` (DTCG format), `taste/`, `design-systems/` (138 brand specs), `components/` (52 specs), `accessibility/`, `workflows/`, `content/`, `frameworks/`, `examples/`, `.claude/rules/`, and auditing scripts.
    - Preserved existing `brandkit` image generator and `prototype` variant generator by namespacing the XIAS versions as `ux-brandkit` and `ux-prototype`.
  - [x] Updated `.graphifyignore` to keep code AST indexing fast and exclude raw design examples.
  - [x] Updated `AGENTS.md` registering the newly installed skill suites.

- **Decisions Made:**
  - **Skill Coexistence:** Preserved existing `brandkit` (image prompt generator) and `prototype` (Emil Kowalski variant picker) by naming XIAS's token system generator `ux-brandkit` and fidelity ladder `ux-prototype`.
  - **Dual-Harness Discovery:** Mirrored all skills across both `.agents/skills/` (Antigravity IDE native) and `.claude/skills/` (Claude Code native) so all agent harnesses discover them seamlessly.

---

## Session 2026-10-10: Second Brain Architecture & Persistent Knowledge Graph Initialization

- **Date:** 2026-10-10
- **Lead AI:** Lead AI Pair Programmer (Gemini 3.8 Flash High)
- **Primary Goals:**
  - Initialize local Second Brain system (`brain/`).
  - Extract and link Graphify knowledge graph (AST & Obsidian vault format) unified into `brain/`.
  - Establish `brain/sessions.md` and `brain/architecture.md`.
  - Formalize session start/end protocols in `.agents/rules/brain-workflow.md` and `AGENTS.md`.

- **Completed Tasks:**
  - [x] Created `brain/` directory at the project root.
  - [x] Initialized Graphify AST extraction across the workspace (Rust, TypeScript, React, SQL, etc.).
  - [x] Exported Obsidian vault notes and canvas (`brain/graph.canvas`) into `brain/`.
  - [x] Configured `.graphifyignore` to keep code AST indexing pure and prevent infinite re-indexing loops.
  - [x] Created `brain/sessions.md` with complete historical continuity.
  - [x] Created `brain/architecture.md` detailing the hybrid local desktop + multi-tenant SaaS architecture.
  - [x] Persisted rules in `.agents/rules/brain-workflow.md` and integrated into `AGENTS.md`.

- **Decisions Made:**
  - **Second Brain Unification:** Stored both high-level markdown architecture/session notes and Graphify code graph entities in `brain/` so developers and agents can navigate relationships natively via Obsidian or graph query tools.
  - **Graphify Scope Control:** Configured `.graphifyignore` to exclude generated notes and build artifacts so code re-indexing remains instantaneous.
  - **Vault Note Protection:** Ensured user brain notes (`sessions.md`, `architecture.md`) are protected from automated AST note overwrites.

- **Pending Tasks / Recommended Next Steps:**
  - Run environment verification (`./init.sh` or npm/cargo test suites).
  - Proceed with Milestone 1B / Next SaaS backlog items: Invoice & Quotation cloud models, payment gateway webhooks (Stripe / Razorpay), and pg-boss background workers.

---

## Session 2026-10-06 to 2026-10-07: Milestone 1A SaaS Foundation & Security Hardening

- **Date:** 2026-10-06 to 2026-10-07
- **Commit:** `336456d` (`feat/milestone-1a-saas-foundation`)
- **Primary Goals:**
  - Transition InvoiceFlow architecture into a multi-tenant cloud SaaS foundation without discarding existing Tauri desktop capabilities.
  - Establish PostgreSQL 17 schema with fail-closed Row Level Security (RLS).
  - Build Fastify 5 API with Supabase Auth JWKS verification and parameter-scoped tenant context.
  - Build React 19 web application shell with onboarding, tenant switching, and state boundaries.

- **Completed Tasks:**
  - [x] Monorepo workspace setup: `apps/api` (Fastify 5), `apps/web` (React 19 + Vite 8), `packages/db` (Kysely + Postgres), `packages/shared-types`.
  - [x] PostgreSQL 17 multi-tenant schema migrations (001, 002, 003) with fail-closed RLS on `app.current_organization_id`.
  - [x] Migration runner with `public._migrations` tracking ledger.
  - [x] Fastify JWT authentication with JWKS asymmetric key verification and tenant scoping middleware.
  - [x] Comprehensive security audit and isolation test suite: 40 tests covering tenant boundary leaks, cross-tenant mutation rejection, and schema upgrades.
  - [x] Web UI with React 19, Tailwind CSS 4, TanStack Query v5, and Zustand v5 ephemeral UI store.

- **Decisions Made:**
  - **Fail-Closed RLS:** RLS policies strictly enforce `app.current_organization_id`; transactions without context cannot read or mutate tenant data.
  - **Strict State Separation:** Server data belongs entirely in TanStack Query; Zustand is reserved strictly for local transient UI state (modals, drawers).
  - **Coexistence Strategy:** Existing local-first Tauri desktop app (`apps/desktop` + Rust `crates/`) preserved alongside cloud SaaS services.

- **Pending Tasks:**
  - Complete Milestone 1B: Invoicing, quotations, and payments domain models in `packages/db` and `apps/api`.

---

## Session 2026-09-23: Local-First Desktop & Mobile Upgrade (Milestones feat-001 through feat-008)

- **Date:** 2026-09-23
- **Commit:** `f33e93f` (`main`)
- **Primary Goals:**
  - Deliver desktop invoicing command center with Tauri v2, SQLite (`crates/flow-db`), and custom Tabby BNPL MCP server.
- **Completed Tasks:**
  - [x] feat-001: Local-First Core & SQLite DB migrations.
  - [x] feat-002: Midday Invoicing slide-over sheet & line-item calculations.
  - [x] feat-003: Quotations & Estimates module with printable PDF contracts.
  - [x] feat-004: Monthly Financial Reports & Tax Statements.
  - [x] feat-005: Shareable payment links & mobile web portal (`/pay/:id`).
  - [x] feat-006: Tabby BNPL MCP Server integration (`mcp-servers/tabby/`).
  - [x] feat-007: Subscription SaaS licensing & offline license key validation.
  - [x] feat-008: Mobile viewport responsiveness and LAN network binding.

## 2026-10-10 — Codex startup check and first-step guidance

- Restored session/architecture context and inspected project instructions, planning documents, feature tracker, and recent commits.
- Ran `./init.sh`: exit 127 at line 7, `bun: command not found`. Desktop build and Cargo check did not complete. This is an environment blocker, not evidence of a product-code defect.
- No product code changed; no feature marked complete. Existing feature statuses are historical and not reverified this session.
- Next: reconcile existing SaaS requirements with current implementation, establish the intended toolchain, restore baseline verification, and add explicit SaaS checks before product implementation.
- User guidance: define the first sellable release and its acceptance criteria using existing planning documents; country/payment onboarding decisions remain open.


### 2026-10-10 — India/GCC connected invoicing research
- Confirmed India-based user, Indian primary audience and GCC target; custom templates and minimal dashboard with daily/monthly/yearly filters.
- Added `docs/planning/2026-10-10-connected-invoicing-research.md` with primary sources, lifecycle, dashboard semantics, template versioning and optional Laya recommendations. Recommendations are not approved implementation decisions.
- No product code changed, tests/model inference not run, no feature completed; prior missing-bun startup blocker remains unresolved.
- Next: clarify custom template editor scope, reconcile PRD/backlog and restore baseline verification.


### 2026-10-10 — Template scope clarification and Bun guidance
- User confirmed existing 2–3 built-in invoice templates with editing only for initial release; no custom template creation/builder. Research note amended.
- Checked Bun official installation instructions; unzip available, bun absent from PATH. Installation not performed; startup blocker remains. No product code or feature completion changes.


## 2026-10-11 — Baseline verification after Bun installation
- Confirmed Bun 1.4.3 at /home/jabir/.bun/bin/bun. Current Codex PATH does not include it; checks used an explicit PATH prefix.
- Identified cross-platform dependency mismatch: Windows esbuild present, Linux Rollup/lightningcss absent. Root npm ci --include=optional completed but root lock lacks Linux Rollup package entry; restored exact Rollup 4.64.0 locally. Desktop bun install --frozen-lockfile restored 9 packages. No substantive lockfile changes. Root clean-install reproducibility still needs repair.
- Downloaded official Node 24.21.0 LTS to /tmp and verified SHA256 against official SHASUMS256.txt. This is a temporary validation runtime, not a permanent system upgrade; default Node remains 20.18.0 while Kysely/Supabase packages require >=22.
- npm run typecheck: all four SaaS workspaces PASS, including rerun on Node 24.
- ./init.sh with Node 24 and Bun PATH: desktop tsc/Vite build PASS (2623 modules); warnings for large bundle and mixed static/dynamic import. Script then FAILS exit 127 because cargo is unavailable. Rust checks not run.
- npm audit: 3 findings (2 critical, 1 moderate) in Vitest/tinypool/@vitest/mocker chain; reported fix is Vitest 4.1.11 major upgrade. No force-upgrade applied; needs reviewed upgrade and tests.
- No product feature implemented/completed, DB tests not run, no production readiness claim.
- Next: permanent supported Node setup, Rust/Cargo setup, reproducible Linux root lockfile repair, repeat startup verification, and address test-tool vulnerabilities before product scope.


## 2026-10-12 — Development foundation completed and verified

- Installed persistent Node 24.21.0 LTS under ~/.local/share/invoiceflow-toolchains and Rust/Cargo 1.99.0 under the standard user directories; Bun 1.4.3 confirmed. Bash PATH appended; repository scripts source scripts/dev-env.sh explicitly. Linux desktop libraries and PostgreSQL 18 are now available.
- Rebuilt root npm lockfile with platform optional packages; pinned Vitest 4.1.11. Kept existing direct dependency versions except this intended upgrade; transitive resolution refreshed. Cargo.lock is no longer ignored.
- init.sh now builds SaaS packages in dependency order, then type-checks, builds desktop and checks Rust with --locked; --saas supports web-only verification. Focused review caught and corrected typecheck-before-build on clean checkouts.
- Added scripts/test-api-local.sh and made npm test use it: disposable loopback PostgreSQL cluster, restricted app role, explicit test settings, guaranteed exit cleanup. NODE_ENV=test skips local .env loading.
- Fixed missing rust_decimal workspace dependency in flow-pdf; compilation failure reproduced before fix.
- Verification: ./init.sh PASS; clean temporary checkout npm ci + ./init.sh --saas PASS; API suite 47/47 PASS in 3 files; root npm audit 0 advisories; shell syntax and scoped diff whitespace checks PASS.
- Evidence: artifacts/foundation/{build.log,api-tests.log,clean-install.log,clean-build.log,npm-audit.json}; setup instructions: docs/development-setup.md.
- Remaining: bundle-size/unused-code warnings, real browser journeys, CI/lint coverage, hosted auth/payment integrations, and product feature implementation. This is development readiness, not production launch approval.
- User's pre-existing changes preserved. First product milestone remains sign-in/business onboarding/client management; initial invoice template scope is built-in templates with editing only.

- Final focused review: no remaining important findings after build-order fix. Commit attempted but Git author identity is unset; scoped changes staged, no commit or push made. Graphify update extraction completed with missing SQL parser and partial TSX extraction warnings; graph processing still pending at this checkpoint.

- Commit follow-up: repository-local identity configured as Mohammed Jabir with user-supplied email. Final reviewed changes ready for commit. Graphify update was interrupted during processing; existing graph.json remains the older valid graph and analysis metadata is stale. Obsidian export was attempted against that graph; do not treat it as a fresh architecture audit. Graph refresh is a remaining documentation-tool limitation, separate from passed build/test checks.

- Obsidian export completed (exit 0) using the retained older graph; fresh graph reconstruction remains pending.


## 2026-10-12 — Consolidated conversation memory saved
- Added brain/project-summary.md covering owner context, confirmed requirements, superseded template scope, researched recommendations, Laya boundaries, setup/tooling history, verified results and open questions.
- Reconciled brain/architecture.md against current source; preserved old notes in brain/architecture-history-2026-10-12.md. Corrected tenant context, schema/roles, auth/validation stack and migration ledger assertions.
- Foundation commit is 4b33153; commit succeeded locally after repository identity configuration. Earlier log entries describing failed commit/staging are historical checkpoints, now superseded. No GitHub push was performed.
- No product feature changed in this memory task. Fresh startup verification launched; result recorded below on completion.
- Next: browser validation/completion of sign-in/business onboarding/client management; fresh Graphify rebuild remains pending and old graph must not be treated as current.

- Memory-save verification: ./init.sh completed successfully (exit 0); required memory files and feature JSON validated. Evidence: artifacts/foundation/brain-save-startup.log. Graph retained unchanged because this task updates narrative memory; no fresh graph coverage claim.


## 2026-10-13 — Multi-Tenant SaaS Client Management & First Customer Journey (feat-010)

- **Date:** 2026-10-13
- **Lead AI:** Antigravity AI Pair Programmer
- **Primary Goals:**
  - Context restoration & baseline verification
  - Complete first customer journey: Sign in -> create/select business workspace -> save business details -> create a client -> view/edit that client -> reload persistence -> sign out
  - Forward migration 004 with fail-closed RLS for clients
  - Fastify client endpoints with role-based authorization
  - React 19 Client Directory UI with modals, filters, and loading/error states
  - Automated browser journey verification with Playwright
- **Completed Tasks:**
  - [x] Verified baseline: `./init.sh` PASS (SaaS build/typecheck, desktop build, cargo check), 47/47 API tests PASS, root npm audit 0.
  - [x] Implemented `packages/db/src/migrations/004_create_clients_table.sql` with fail-closed RLS on `organization_id = get_current_org_id()` and role permissions.
  - [x] Added `ClientsTable`, `DbClient`, `NewDbClient`, and `ClientUpdate` to `packages/db/src/types.ts`.
  - [x] Added `Client`, `ClientStatus`, `CreateClientDTO`, and `UpdateClientDTO` to `packages/shared-types`.
  - [x] Implemented `apps/api/src/routes/clients.ts` with Zod validation, search/status filtering, and role-based permissions (OWNER, ADMIN, FINANCE write, VIEWER read).
  - [x] Registered client routes in `apps/api/src/server.ts`.
  - [x] Added 18 comprehensive integration & security tests in `apps/api/test/clients.test.ts` and updated migration upgrade tests in `apps/api/test/migrations.test.ts` (API suite expanded to 66/66 PASS).
  - [x] Implemented `apps/web/src/components/ClientsView.tsx`, integrated subnav tab in `DashboardShell.tsx`, and added shortcut in `DashboardView.tsx`.
  - [x] Created `scripts/test-e2e.sh` and updated `apps/web/e2e/auth-and-journey.spec.ts` (3/3 Playwright browser journeys PASS).
  - [x] Verified `./init.sh` full build and typecheck passes with 0 errors.
- **Decisions Made:**
  - **Client Archiving vs Deletion:** Default deletion performs soft delete / archiving (`status = 'ARCHIVED'`), preserving auditability and avoiding breaking foreign key constraints when linked to future quotes/invoices. Permanent deletion is available via query flag.
  - **Role-Based Authorization:** Strict server-side enforcement: OWNER, ADMIN, and FINANCE can create/edit clients; VIEWER has read-only access with server-side 403 Forbidden.
  - **Automated E2E Test Harness:** Created `scripts/test-e2e.sh` spinning up an isolated loopback PostgreSQL 18 cluster with ephemeral port, starting API and Vite preview, and executing Playwright tests in system Chrome channel cleanly.
- **Pending Tasks / Recommended Next Steps:**
  - Proceed with Milestone 1B: Quotation and Invoice domain models and linking (`feat-011`).


## 2026-10-13 — Antigravity milestone and GitHub branch review
- Live GitHub has main at f33e93f and SaaS feature at 336456d; local SaaS HEAD a6cab19 has 3 unpushed commits (4b33153, 59dc262, a6cab19). No PRs returned.
- Independent verification: full init PASS, API 66/66 PASS, browser 3/3 PASS. Browser authentication uses injected local JWTs; real provider login remains unverified.
- Disposable reproductions confirmed FINANCE archive permission inconsistency (DELETE 403, PATCH 200) and invalid UUID/repeated search inputs returning 500. OWNER permanent deletion also exists.
- Decision: current SaaS branch is the correct work base; harden client/API/Auth/test harness and add CI before integration/new financial scope. No branches changed, product fixes implemented, or remote writes performed.
- Detailed evidence and next Antigravity prompt: brain/reviews/2026-10-13-antigravity-branch-review.md.

## 2026-10-13 — SaaS Client Hardening, Parameter Validation Resilience & CI Pipeline (feat-010b)

- **Date:** 2026-10-13
- **Lead AI:** Antigravity AI Pair Programmer
- **Primary Goals:**
  - Implement focused hardening milestone from `brain/reviews/2026-10-13-antigravity-branch-review.md`.
  - Reproduce and resolve authorization inconsistency: FINANCE status change vs DELETE archiving.
  - Reproduce and resolve request validation: malformed UUID params and repeated search query params returning 500.
  - Defer destructive permanent deletion pending data retention rules.
  - Add bounded pagination to client listings.
  - Harden E2E runner (`scripts/test-e2e.sh`) against occupied ports, dead processes, and readiness timeouts.
  - Establish SaaS CI via GitHub Actions workflow (`.github/workflows/saas-ci.yml`).
  - Report exact status of real Supabase Auth configuration versus mock/local tokens.
- **Completed Tasks:**
  - [x] Reproductions confirmed with 8 failing tests before fix in `apps/api/test/clients.test.ts`.
  - [x] Fixed permission inconsistency: `PATCH /api/organizations/:id/clients/:clientId` blocks altering `status` for FINANCE with 403 `INSUFFICIENT_PERMISSIONS`. Both DELETE and status changes in PATCH now strictly enforce OWNER and ADMIN role policy.
  - [x] Fixed request validation in `apps/api/src/routes/clients.ts` and `apps/api/src/plugins/tenant.ts`: added Zod route param schemas (`orgParamsSchema`, `clientParamsSchema`) and query schema (`listClientsQuerySchema`). Returns structured 400 `VALIDATION_ERROR` on malformed UUID or repeated query params.
  - [x] Deferred permanent deletion: disabled `?permanent=true` with 400 `PERMANENT_DELETION_DISABLED`.
  - [x] Implemented bounded pagination (`page`, `limit` max 100) with total count and total pages.
  - [x] Hardened `scripts/test-e2e.sh` with `check_port_free` (ports 3001, 5173), PID liveness checks, `--strictPort`, and dynamic PostgreSQL binary detection.
  - [x] Created `.github/workflows/saas-ci.yml` running SaaS build, type-check, API tests on disposable PostgreSQL, and browser journeys.
  - [x] Verified `./init.sh` PASS (exit 0), `npm test` PASS (75/75 tests in 4 files), and `scripts/test-e2e.sh` PASS (3/3 browser journeys).
- **Decisions Made:**
  - **Single Archive/Restore Permission Policy:** Only OWNER and ADMIN can alter client lifecycle status (archive or restore) across both DELETE and PATCH. FINANCE can edit client contact and billing details, but cannot deactivate or reactivate clients.
  - **Permanent Deletion Deferred:** Deferring destructive permanent deletion protects foreign key relational integrity with upcoming quotations (`feat-011`) and invoices (`feat-012`).
  - **E2E Liveness Guarantee:** E2E runner now fails fast if child processes exit or if ports are collided, preventing false positives from orphaned background processes.
- **Auth Provider Reality Assessment:**
  - Local environment does not have a live Supabase instance running on 54321 (`NOT_RUNNING`) and lacks remote hosted project credentials (`SUPABASE_URL=http://127.0.0.1:54321` with local dummy keys).
  - Browser tests verify authenticated SaaS application mechanics via signed local development tokens, but real Supabase user registration, email confirmations, session refresh, and password recovery remain unverified until remote credentials or local Supabase CLI is provisioned.
- **Pending Tasks / Recommended Next Steps:**
  - Proceed with Milestone 1B: Quotation and Estimate Cloud Domain (`feat-011`).



## 2026-10-13 — Review of Antigravity hardening commit 4e077b2f
- Independently verified full init PASS, 75 API tests PASS, 3 local-token browser journeys PASS. Earlier role/validation/permanent-delete findings reproduced as resolved.
- New integration findings: FINANCE frontend edits always send status and receive 403 even for contact-only changes; API pagination defaults to 50 but UI/API client discard metadata and provide no page controls. Reproduced UI-shaped request and 52-client pagination fixture on disposable DB.
- SaaS CI exists locally but no Actions result is verified and explicit browser provisioning is missing. Real provider Auth remains unverified. Current local feature branch is 4 commits ahead of confirmed remote feature.
- Next: focused Finance edit + pagination frontend task, deterministic CI browser setup, then authorized PR publication/CI observation and real Auth verification before financial feature expansion.
- Details: brain/reviews/2026-10-13-antigravity-hardening-followup.md. No product code, branch checkout, push or merge performed.


## 2026-10-13 — Installed skill inventory and persistent usage preference
- User requested memory of 17 installed skill repositories and use throughout development/UI work.
- Inspected global Codex, shared project skill folders, known Antigravity global locations and plugin cache/config metadata without exposing secrets. Found 31 global skill files, 166 project files per identical mirror, 145 unique project names, 176 global/project unique names (fixtures excluded).
- Additional global user skills: archify, karpathy-guidelines, i-have-adhd; bundled system/helpers and enabled/cached plugin families classified separately.
- Added brain/agent-skill-policy.md, brain/installed-skills.md and brain/skill-inventory-2026-10-13.json; appended concise routing preference to AGENTS.md and project summary. Existing AGENTS edits preserved.
- No skill installation/update/removal and no product feature change. Next task remains Finance edit/pagination frontend completion and deterministic CI/Auth verification.


## 2026-10-13 — Frontend integration review of 3c26cd56
- Finance edits, full client pagination and explicit CI Chromium setup are present; independent full init PASS, API 75/75 PASS, browser 5/5 PASS.
- Focused reviewer flagged cross-workspace keepPreviousData reuse. Temporary browser reproduction confirmed old Org A row remains visible under selected Org B while B response is delayed; this is UI data mixing, not demonstrated server auth bypass. Temporary test removed from normal suite and retained in ignored artifacts.
- Next small task: constrain placeholder reuse to same org, clear old editing/selection state on org switch, add a permanent delayed-response regression. Then authorized draft PR publication/actual CI review; real Auth remains unverified and must be exercised before customer launch.
- Local feature branch is 5 commits ahead of last confirmed remote; no PRs returned, no push/merge performed.
- Detailed review: brain/reviews/2026-10-13-antigravity-integration-review.md. No product implementation changes made in this review.
