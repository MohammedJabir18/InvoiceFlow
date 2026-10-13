# InvoiceFlow — Technology Decisions & Stack Architecture Record

**Date:** 6 October 2026  
**Auditor:** Antigravity Engineering Agent  
**PRD Version:** 1.0  
**Status:** Architecture Baseline & Technical Decision Record (TDR)

---

## 1. Selected Technologies and Architectural Rationale

This document establishes the official technology selections, pinned release lines, and integration boundaries for transforming InvoiceFlow from a single-user desktop application into a production multi-tenant SaaS.

> [!NOTE]
> **Superseded Decisions Notice:** All earlier planning mentions of custom Argon2id self-hosted auth, Redis / BullMQ worker queues, and Node.js 20/22 runtime baselines are **formally superseded** by the decisions recorded here.

| Layer | Selected Technology | Primary Architectural Rationale |
|---|---|---|
| **Frontend Framework** | **React 19.3 + Vite 8.3** | Delivers fast compilation with Vite 8, React 19 concurrent features, Actions, and seamless hydration for web clients. Reuses existing visual assets from `apps/desktop/src`. |
| **Styling & Design** | **Tailwind CSS 4.3** | Zero-config CSS engine utilizing `@tailwindcss/vite` for lightning-fast builds, CSS variables design tokens, and clean responsive UI styling. |
| **Client State Architecture** | **TanStack Query v5 + Zustand v5** | **Strict Separation of Concerns:** TanStack Query manages all server-state (caching, deduplication, optimistic updates, query invalidation). Zustand is restricted strictly to ephemeral, purely local UI state (modals, sheet toggles, editor draft focus). |
| **Client Routing & Types** | **React Router v7 + TypeScript Strict** | Retains existing route structure (`/invoices`, `/quotations`, `/clients`, `/settings`); TypeScript strict mode enforces exhaustive type safety across domain models. |
| **Backend Runtime & API** | **Node.js 24 LTS + Fastify 5** | Node.js 24 LTS provides modern V8 performance, native fetch, and long-term stability. Fastify 5 provides high-throughput schema validation and clean raw-buffer hooks for webhook signatures. |
| **Managed Data Platform** | **Supabase (PostgreSQL 17)** | Managed PostgreSQL 17 on current patched platform builds. Offloads WAL streaming, automated backups, and replica management. |
| **Authentication & IAM** | **Supabase Auth (GoTrue)** | Turnkey managed authentication: OAuth2/OIDC, email magic links/passwords, session token rotation, and built-in RFC 6238 TOTP MFA. |
| **Database Access Layer** | **Kysely (PostgreSQL Driver)** | Type-safe SQL query builder without binary engine overhead. Operates directly over standard `pg.Pool`, enabling explicit transaction-scoped `SELECT set_config('app.current_org_id', $1, true)` context for PostgreSQL RLS. |
| **Financial Arithmetic** | **decimal.js** | Server-authoritative 28-digit fixed-point arithmetic (`ROUND_HALF_UP`) supporting ISO 4217 scale awareness across 0-decimal (JPY), 2-decimal (USD/INR), and 3-decimal (KWD) currencies. |
| **Background Queue Engine** | **pg-boss (Deferred)** | **Queue-in-PostgreSQL:** Executes transactional background queues directly inside PostgreSQL 17 using `SKIP LOCKED`. Atomic enqueueing requires a proven shared transaction integration or a transactional outbox. **Queues are out of scope for Milestone 1A.** |
| **Document Generation** | **Puppeteer (Pinned Chromium)** | Containerized headless Chromium with Google Noto fonts (Latin, Malayalam, Devanagari, Arabic BiDi RTL) for deterministic PDF rendering. (Deferred to Milestone 3). |
| **Private Advisory AI** | **Private Laya Python Service** | Self-contained Python service running on CPU for intent classification. Strictly unprivileged, advisory-only, with a hard 3000ms timeout and manual UI fallback. (Deferred to Milestone 6). |
| **Document & Asset Storage** | **Supabase Storage** | Private S3-compatible object storage with short-lived signed URLs for invoice PDFs, company logos, and payment proofs. |
| **Testing & CI** | **Vitest + Real PostgreSQL + Playwright** | Unit testing with Vitest; real PostgreSQL 17 integration testing; end-to-end browser journey testing via Playwright; automated GitHub Actions CI. |
| **Proposed Hosting** | **Render + Supabase** | Render for static web frontend (CDN), Fastify API web service, background worker, and private Laya service. Supabase for data services. |

---

## 2. Version Categorization & Compatibility Verification Baseline

To maintain absolute engineering rigor, version numbers are strictly distinguished across four distinct operational categories:

1. **Registry Latest:** Published releases visible on the public registry (`npm view` or PyPI).
2. **Installed & Pinned:** Exact versions locked in `package.json` and committed in `package-lock.json`.
3. **Provider-Managed:** Upstream versions maintained and patched by cloud infrastructure providers (Supabase PG17, Supabase GoTrue Auth).
4. **Empirically Verified Together:** Combinations proven compatible through running automated test suites, typechecks, and integration runs in local CI.

> [!WARNING]
> **Registry Query vs. Compatibility:** An npm registry lookup or version query indicates only that a package has been published. **It is not proof of runtime compatibility, peer dependency resolution, or security posture.** True compatibility is established exclusively by local installation, lockfile resolution, typechecks, and test execution.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Version Classification & Tracking Table                                 │
├──────────────────────────┬───────────────────┬───────────────────┬───────────────────┬──────────────────┤
│ Dependency               │ Registry (npm)    │ Installed / Pinned│ Provider-Managed  │ Verification Mode│
├──────────────────────────┼───────────────────┼───────────────────┼───────────────────┼──────────────────┤
│ react                    │ 19.3.0            │ 19.3.0            │ N/A               │ Local Test & CI  │
│ react-dom                │ 19.3.0            │ 19.3.0            │ N/A               │ Local Test & CI  │
│ vite                     │ 8.3.3             │ 8.3.3             │ N/A               │ Local Test & CI  │
│ tailwindcss              │ 4.3.3             │ 4.3.3             │ N/A               │ Local Test & CI  │
│ @tailwindcss/vite        │ 4.3.3             │ 4.3.3             │ N/A               │ Local Test & CI  │
│ react-router-dom         │ 7.0.0             │ 7.0.0             │ N/A               │ Local Test & CI  │
│ @tanstack/react-query    │ 5.104.1           │ 5.104.1           │ N/A               │ Local Test & CI  │
│ zustand                  │ 5.0.0             │ 5.0.0             │ N/A               │ Local Test & CI  │
│ typescript               │ 5.7.0             │ 5.7.0             │ N/A               │ Local Test & CI  │
│ node                     │ 24.18.0 (LTS)     │ 24.18.0           │ N/A               │ Local Machine    │
│ fastify                  │ 5.12.5            │ 5.12.5            │ N/A               │ Local Test & CI  │
│ @fastify/cors            │ 10.0.2            │ 10.0.2            │ N/A               │ Local Test & CI  │
│ @fastify/helmet          │ 13.0.1            │ 13.0.1            │ N/A               │ Local Test & CI  │
│ @supabase/supabase-js    │ 2.117.2           │ 2.117.2           │ Cloud Platform    │ Local Test & CI  │
│ jose                     │ 6.0.8             │ 6.0.8             │ N/A               │ Local Test & CI  │
│ kysely                   │ 0.29.6            │ 0.29.6            │ N/A               │ Local Test & CI  │
│ pg                       │ 8.13.1            │ 8.13.1            │ N/A               │ Local Test & CI  │
│ decimal.js               │ 10.6.0            │ 10.6.0            │ N/A               │ Local Test & CI  │
│ vitest                   │ 5.0.3             │ 5.0.3             │ N/A               │ Local Test & CI  │
│ playwright               │ 1.63.0            │ 1.63.0            │ N/A               │ Local Test & CI  │
│ PostgreSQL               │ 17.6              │ 17.6 (Local psql) │ 17.0 (Supabase)   │ Real DB Tests    │
│ pg-boss (Deferred M3)    │ 12.37.0           │ Defer to M3       │ N/A               │ Deferred         │
│ puppeteer (Deferred M3)  │ 25.12.0           │ Defer to M3       │ N/A               │ Deferred         │
│ PyTorch / Laya (Def M6)  │ 2.5.1             │ Defer to M6       │ N/A               │ Deferred         │
└──────────────────────────┴───────────────────┴───────────────────┴───────────────────┴──────────────────┘
```

---

## 3. Migration Implications for the Existing Repository

The existing repository (`InvoiceFlow`) is a desktop application. Milestone 1A establishes the SaaS foundation without breaking or deleting existing desktop assets.

### 3.1. Directory Structure Strategy
```
InvoiceFlow/
├── apps/
│   ├── web/                         # React 19.3 + Vite 8.3 + Tailwind 4.3 Web Client
│   ├── api/                         # Fastify 5 API Server (Node.js 24 LTS)
│   └── desktop/                     # Preserved existing Tauri/Rust desktop app
├── packages/
│   ├── db/                          # Kysely schema definitions, migrations, DDL
│   ├── shared-types/                # Shared TypeScript DTOs and contracts
│   └── calculations/                # decimal.js CALC_V1 calculation engine
├── docs/planning/                   # Planning artifacts & specifications
├── package.json                     # Monorepo root workspace configuration
└── package-lock.json                # Pinned lockfile
```

### 3.2. Client State Migration
- **Server Data:** Removed from `localStorage` and client stores; managed exclusively via TanStack Query v5 hooks.
- **Local State:** Zustand stores manage strictly local UI flags (dialog visibility, drawer state).

---

## 4. Authentication, JWT Verification and Tenant-Isolation Boundaries

### 4.1. Supabase JWT Validation Specification
1. **Verified User Identity (`sub` Claim):**
   - The user's verified identity is derived **strictly from the `sub` claim** of the validated JWT, which corresponds to `auth.users.id`.
   - Never trust client-supplied user IDs in request bodies or query parameters.
2. **Maintained Verification Library (`jose`) & Key Strategy:**
   - Fastify API uses the maintained `jose` library (`jwtVerify`, `createRemoteJWKSet`) rather than custom string parsing or unmaintained libraries.
   - **Production Asymmetric JWKS Verification:**
     - Production environments (`NODE_ENV === 'production'`) mandate `SUPABASE_JWKS_URL` and use asymmetric key verification (`createRemoteJWKSet` with `RS256` or `ES256`).
     - Fastify rejects attempts to use symmetric `HS256` verification in production.
     - Public keys are fetched and cached automatically from Supabase's JWKS endpoint (`/.well-known/jwks.json`), rotating without service interruption.
   - **Local / Test Environment Symmetric Isolation:**
     - Symmetric `HS256` using `SUPABASE_JWT_SECRET` is strictly restricted to development and testing environments.
     - Production startup crashes with a clear configuration error if `SUPABASE_JWKS_URL` is omitted.
   - **Validation Checks Enforced on Every Request:**
     - Cryptographic signature verification against the JWKS or isolated secret.
     - Permitted algorithms: strictly allowlisted (e.g. `['RS256', 'ES256']` in production; `['HS256']` in test; rejects `none` or mismatched algorithms).
     - Issuer (`iss`) validation: must match `https://<project-ref>.supabase.co/auth/v1` or configured Supabase auth URL.
     - Audience (`aud`) validation: must match `authenticated`.
     - Expiry (`exp`) and Not-Before (`nbf`) temporal validation.
3. **Logout and Revocation Semantics:**
   - **Client-Side Session Termination & Cache Purging:**
     - When a user initiates sign out, the frontend deletes all stored tokens (`invoiceflow_jwt_token`, `invoiceflow_active_org_id`) from browser `localStorage`.
     - `purgeQueryCache()` synchronously cancels in-flight queries and clears all TanStack Query cache entries (`queryClient.clear()`), preventing memory leakage across account switches or subsequent browser sessions.
   - **Supabase GoTrue Server Session Invalidation:**
     - `supabase.auth.signOut()` calls GoTrue to revoke the session refresh token on the identity provider. The user cannot exchange their refresh token for a new access token.
   - **Immediate Server-Side Membership Revocation (Tenant Boundary):**
     - Because JWT access tokens are stateless bearer credentials, they remain cryptographically verifiable until their short-lived expiry (`exp`, default 1 hour).
     - However, **all protected API routes and queries do not trust the JWT alone for authorization**.
     - Every request to a tenant-scoped route executes `requireOrganizationMembership` and `getUserMembership`, which queries PostgreSQL to confirm the user has an active, non-revoked membership record for the requested organization.
     - The moment an organization admin revokes a user's membership or an owner removes them, all subsequent requests for that tenant fail immediately with `403 Forbidden` (`FORBIDDEN_ORGANIZATION_ACCESS`), without waiting for the JWT's `exp` to elapse.
   - **Global Stateless JWT Revocation Boundary:**
     - If a user's account itself is disabled or compromised globally, the bearer JWT remains valid for authentication (as a valid user) until `exp`.
     - Standard mitigation in production: set Supabase access token TTL aggressively short (e.g., 5 to 15 minutes) with automatic silent background refresh.
     - If instantaneous global revocation is mandated for compliance, a distributed token denylist (e.g., table of revoked `jti` IDs checked during auth plugin hook) or stateful session verification must be introduced. For Milestone 1A, membership-level immediate revocation is fully enforced.

### 4.2. Database Role Isolation & Fail-Closed RLS
1. **Role Privilege Boundaries:**
   - `invoiceflow_migrator` / `postgres`: Owner of schemas and tables; runs DDL migrations.
   - `invoiceflow_app`: Runtime connection role configured with `NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE`.
2. **Parameterized Transaction-Local Context:**
   - To prevent connection-pool leakage across requests, tenant context is set using parameterized transaction-local configuration on the **exact same connection** as protected queries:
     ```sql
     SELECT set_config('app.current_org_id', $1, true);
     ```
     The third argument `is_local = true` ensures the setting applies **strictly to the current transaction** and resets automatically on `COMMIT` or `ROLLBACK`.
3. **Fail-Closed RLS Kernel Policies:**
   ```sql
   CREATE POLICY tenant_isolation_policy ON organizations
       AS RESTRICTIVE
       FOR ALL
       USING (
           id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
       )
       WITH CHECK (
           id = NULLIF(current_setting('app.current_org_id', true), '')::UUID
       );
   ```
   If `app.current_org_id` is missing or uninitialized, `NULLIF` evaluates to `NULL`, the expression yields false, and **all reads and writes are blocked**.
4. **Explicit Secured Bootstrap Path:**
   - Organization creation and initial membership assignment run through an explicitly secured bootstrap transaction where the authenticated user (`auth.uid`) is verified before creating an organization and assigning `OWNER` role.

---

## 5. Database Connection, Pooling and Transaction Strategy

1. **Connection Pooling:**
   - Uses `pg.Pool` with bounded max connections.
   - All protected database access executes within explicit Kysely transactions (`db.transaction().execute(...)`).
2. **Connection Leakage Defense:**
   - Because `set_config(..., true)` is transaction-local, connection checkout/checkin does not retain tenant state between queries.
   - Automated tests explicitly verify connection reuse after commit, rollback, and error conditions.

---

## 6. Worker Reliability & Idempotency (`pg-boss` Notice)

- `pg-boss` executes queues in PostgreSQL using `SKIP LOCKED`.
- **Atomic Enqueue Caveat:** True atomic enqueueing alongside application business changes requires a proven shared transaction integration (enqueuing with the same transaction client) or a Transactional Outbox pattern.
- **Milestone 1A Scope:** Background workers and job queues are **explicitly deferred**. Milestone 1A does not implement queues.

---

## 7. Deployment Trade-offs & Unvalidated Cost Disclaimers

- **Proposed Hosting Model:** Render (Static Site, Fastify API, Worker, Private AI) + Supabase (PostgreSQL 17, Auth, Storage).
- **Cost Disclaimer:** The previously cited **\$46/month estimate is unvalidated and indicative only**. Actual production costs will depend on:
  - Puppeteer memory requirements (concurrency scaling).
  - Laya PyTorch compute sizing (CPU vs. GPU instance pricing).
  - Supabase database egress and storage volume.
  - Sizing and pricing decisions are formally deferred to their respective milestones.

---

## 8. Minimal Compatibility Verification Plan (Milestone 1A)

The local test suite must verify the following on real PostgreSQL 17:
1. Fastify 5 server initializes on Node.js 24 LTS and handles authenticated HTTP requests.
2. Valid Supabase JWT with `sub` claim is accepted; invalid/expired tokens return 401.
3. Kysely transaction executes `SELECT set_config('app.current_org_id', $1, true)`.
4. RLS fails closed when context is absent.
5. Connection pool reuse does not leak tenant context after commit or rollback.
6. Organization onboarding successfully persists independent country, currency, locale, and timezone.
