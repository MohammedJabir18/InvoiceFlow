# InvoiceFlow — Milestone 1A Execution Plan

**Date:** 6 October 2026  
**Auditor:** Antigravity Engineering Agent  
**PRD Version:** 1.0  
**Status:** Foundation implemented; real Supabase integration verification blocked by the local Docker environment.  
**Stack Baseline:** Node.js 24 LTS + Fastify 5 + Supabase PostgreSQL 17 + Supabase Auth + Kysely + React 19.3 + Vite 8.3  
**Scope:** Local Web/API/Database Foundation, Supabase Authentication, Organization Onboarding & International Settings, and Automated Tenant Isolation.

---

## 1. Milestone 1A Objective & Exact Scope Boundary

Milestone 1A implements and verifies the **local SaaS foundation** running on real PostgreSQL 17.

> [!NOTE]
> **Superseded Decisions Notice:** All earlier custom-auth (Argon2id self-hosted), Redis/BullMQ, and Node 22 decisions are formally superseded by the Supabase Auth, PostgreSQL 17, and Node.js 24 LTS baseline.

### In Scope for Milestone 1A (Vertical Slice):
1. **Isolated Workspace:** Monorepo structure preserving the existing desktop application in `apps/desktop` without modification.
2. **Web App & Fastify API:** Separate modern web client (`apps/web`) on React 19.3 + Vite 8.3 + Tailwind 4.3 and API server (`apps/api`) on Fastify 5 + Node.js 24 LTS.
3. **State Architecture:** TanStack Query v5 for server state cache; Zustand v5 strictly for local UI state.
4. **Authentication:** Supabase Auth integration. Fastify JWT verification validates signature, permitted algorithm (`HS256`/`RS256`), issuer, audience, and expiry using `jose`. User identity is derived strictly from the `sub` claim.
5. **Organization Onboarding:** Creation of organizations with memberships (`OWNER`, `ADMIN`, `FINANCE`, `VIEWER`). Secured bootstrap path for initial creation.
6. **Independent Business Settings:** Independently editable business country, currency, locale, and timezone.
7. **Database Roles:** Migration owner (`invoiceflow_migrator` / `postgres`) separate from restricted runtime application role (`invoiceflow_app`: `NOSUPERUSER NOBYPASSRLS`).
8. **Parameterized Transaction-Local Context:** Context set via `SELECT set_config('app.current_org_id', $1, true)` on the exact same connection as protected queries.
9. **Fail-Closed RLS:** Kernel-level read and write policies blocking access when context is missing or invalid.
10. **Data API & Schema Protection:** Restrict runtime grants to the application schema; revoke default public grants; protect against unauthorized bypass.
11. **Environment Validation:** Validated configuration with an `.env.example` containing placeholders only.

### Explicitly Excluded from Milestone 1A:
- Invoice generation, numbering sequences, quotations, payment gateway integrations, subscription billing, AI assistant, PDF workers, background queues (`pg-boss`), and cloud deployment.

---

## 2. Database Architecture & Role Privilege Segregation

### 2.1. Dedicated Roles Setup
```sql
-- Migration Role (Schema Owner, DDL)
-- Runs all migrations and owns tables
CREATE USER invoiceflow_migrator WITH PASSWORD 'migrator_dev_password';

-- Restricted Runtime Role (Application Queries, DML only)
CREATE USER invoiceflow_app WITH PASSWORD 'app_dev_password'
    NOSUPERUSER 
    NOBYPASSRLS 
    NOCREATEDB 
    NOCREATEROLE;

-- Grant DML privileges only
GRANT USAGE ON SCHEMA public TO invoiceflow_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO invoiceflow_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO invoiceflow_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO invoiceflow_app;
```

### 2.2. Parameterized Transaction-Local Context
In Kysely, every tenant-protected operation is wrapped in a transaction that sets the transaction-local configuration:

```typescript
export async function withTenantContext<T>(
  orgId: string,
  db: Kysely<Database>,
  operation: (tx: Transaction<Database>) => Promise<T>
): Promise<T> {
  return await db.transaction().execute(async (tx) => {
    // Parameterized transaction-local context: is_local = true ensures auto-reset on COMMIT/ROLLBACK
    await sql`SELECT set_config('app.current_org_id', ${orgId}, true)`.execute(tx);
    return await operation(tx);
  });
}
```

### 2.3. Fail-Closed Row-Level Security Policies
```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_current_org_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_org_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- Organizations Table Policy
CREATE POLICY tenant_isolation_orgs ON organizations
    AS RESTRICTIVE
    FOR ALL
    USING (id = get_current_org_id())
    WITH CHECK (id = get_current_org_id());

-- Memberships Table Policy
CREATE POLICY tenant_isolation_memberships ON organization_memberships
    AS RESTRICTIVE
    FOR ALL
    USING (organization_id = get_current_org_id())
    WITH CHECK (organization_id = get_current_org_id());
```

---

## 3. Secured Organization Bootstrap & Membership Path

### 3.1. The Bootstrap Challenge
When a newly registered user creates their first organization, no `organization_id` exists yet. If RLS on `organizations` blocks all writes when `get_current_org_id()` is `NULL`, initial organization creation would be blocked.

### 3.2. Explicit Secured Bootstrap Procedure
1. The user authenticates; Fastify extracts `auth.uid` (`sub` claim).
2. The user submits `POST /api/organizations` with initial details.
3. Fastify initiates an isolated database transaction.
4. The transaction inserts the organization into `organizations` and immediately inserts the membership into `organization_memberships` linking `user_id = auth.uid` and `role = 'OWNER'`.
5. To support this safely without disabling RLS:
   - A dedicated secure PostgreSQL stored function `create_organization_with_owner(auth_uid, org_data)` with `SECURITY DEFINER` executes the atomic creation.
   - The function strictly binds `user_id` to the authenticated `auth_uid` parameter, ensuring an unauthenticated or unauthorized user cannot bootstrap an organization on behalf of another user.
6. The created `organization.id` is returned, and subsequent requests set `set_config('app.current_org_id', $orgId, true)`.

---

## 4. Verification Test Suite & Pass Criteria

The verification suite runs against real local PostgreSQL 17 using the restricted `invoiceflow_app` role:

1. **Clean Installation & Build:** Monorepo installs cleanly; TypeScript strict mode passes with 0 errors; Vite produces production bundle.
2. **Token Security (`jose`):** Valid token with `sub` accepted; expired token rejected (401); forged signature rejected (401); wrong issuer/audience rejected (401).
3. **Fail-Closed RLS:** Queries without `set_config` return 0 rows.
4. **Tenant Isolation:** Org A (USD, US) and Org B (INR, IN) created. Queries authenticated as Org A member cannot read or mutate Org B data.
5. **Spoofed Context Rejection:** Authenticated user of Org A attempting to query with Org B identifier receives 403 Forbidden.
6. **Connection Pool Reuse Safety:** Connection checked out, executes Org A query, committed. Next query without context on the same connection returns 0 rows.
7. **Rollback & Error Safety:** Transaction sets Org A context and errors out. Next query on that connection does not leak Org A context.
8. **Membership Revocation:** Revoking a user's membership prevents subsequent access to that organization.
9. **Orthogonal Settings Persistence:** Updating country does not mutate currency or timezone.
10. **End-to-End Happy Path:** Browser/HTTP journey: Sign up -> Sign in -> Create Organization -> Update Settings -> Retrieve Settings.

---

## 5. Milestone 1A Verification Results (Recorded on 2026-10-06)

Empirical verification executed against local PostgreSQL 17 cluster on port 5434 using the restricted `invoiceflow_app` runtime role (`NOSUPERUSER`, `NOBYPASSRLS`).

### 5.1. Test Suite Summary
- **API Unit & Multi-Tenant Isolation Suite:**
  - **File:** `apps/api/test/isolation.test.ts`
  - **Runner:** Vitest v3.2.7 on Node.js v24.18.0 LTS
  - **Results:** 25 passing tests, 0 failing, 0 skipped
  - **Execution Time:** ~400ms
- **API Security Audit Suite:**
  - **File:** `apps/api/test/security-audit.test.ts`
  - **Runner:** Vitest v3.2.7 on Node.js v24.18.0 LTS
  - **Results:** 10 passing tests, 0 failing, 0 skipped
  - **Execution Time:** ~600ms
- **Browser End-to-End Suite:**
  - **File:** `apps/web/e2e/auth-and-journey.spec.ts`
  - **Runner:** Playwright v1.58.2 (Chromium headless)
  - **Results:** 3 passing tests, 0 failing, 0 skipped
  - **Execution Time:** ~4.0s

### 5.2. Verified Security & Architectural Boundaries
1. **Token Security & Asymmetric Verification (`jose`):**
   - Valid token with `sub` accepted (200).
   - Missing token rejected (401 `UNAUTHORIZED`).
   - Expired token rejected (401 `INVALID_TOKEN`).
   - Forged signature rejected (401 `INVALID_TOKEN`).
   - Wrong audience rejected (401 `INVALID_TOKEN`).
   - Mock token route (`/api/auth/mock-token`) completely removed from runtime; returns 404 in production-configured and runtime apps.
   - Asymmetric JWKS verification successfully validates `RS256` key pairs; rejects symmetric `HS256` tokens when configured for JWKS.
2. **PostgreSQL 17 RLS & Fail-Closed Behavior:**
   - Raw queries to `organizations` without context return 0 rows.
   - Raw queries to `organization_memberships` without context return 0 rows.
   - Unscoped writes fail closed with PostgreSQL policy violation.
   - Parameterized context (`SELECT set_config('app.current_org_id', $1, true)`) retrieves exactly the active tenant's records.
   - `public.users` table protected by RLS; linked via foreign key to `auth.users(id) ON DELETE CASCADE`.
   - All `SECURITY DEFINER` functions enforce explicit `SET search_path = public, pg_temp` to prevent hijacking.
   - All custom functions have `PUBLIC EXECUTE` revoked; execution granted strictly to `invoiceflow_app`.
   - PostgREST roles (`anon`, `authenticated`) have all schema permissions revoked to prevent direct Data API bypass.
3. **Connection Pool Reuse Cleanliness:**
   - Following transaction `COMMIT`, subsequent queries on the same pooled connection return 0 rows.
   - Following transaction `ROLLBACK`, subsequent queries on the same pooled connection return 0 rows.
4. **Cross-Tenant Isolation & Spoofed Header Protection:**
   - Org A user querying Org B returns 403 `FORBIDDEN_ORGANIZATION_ACCESS`.
   - Org B user querying Org A returns 403 `FORBIDDEN_ORGANIZATION_ACCESS`.
   - Forged `x-organization-id` header returns 403 `FORBIDDEN_ORGANIZATION_ACCESS`.
   - Cross-tenant mutations rejected with 403 Forbidden.
5. **Role-Based Authorization, Revocation & Concurrency:**
   - Owner can assign member roles (`OWNER`, `ADMIN`, `FINANCE`, `VIEWER`).
   - Member with `VIEWER` role cannot update settings (403 `INSUFFICIENT_PERMISSIONS`).
   - Revoking a user's membership immediately terminates access to that organization.
   - Row-level lock (`FOR UPDATE` on `organizations`) prevents race conditions when concurrent requests attempt to remove the last remaining owner.
   - Removing the last owner is rejected with 400 `CANNOT_REMOVE_LAST_OWNER`.
6. **Orthogonal Business Settings:**
   - Updating `businessCountry` ('US' -> 'GB') does not mutate currency ('USD') or timezone ('America/New_York').
   - Updating `baseCurrency` ('USD' -> 'GBP') preserves country ('GB') and timezone.
   - Updating `timezone` ('Europe/London') preserves country ('GB') and currency ('GBP').
7. **Browser End-to-End User Journeys (Playwright):**
   - **Service Failure Transparency:** Attempting login when Supabase is unreachable displays a transparent user alert; zero silent logins, zero fallbacks to mock auth.
   - **Complete Lifecycle:** Onboarding -> Settings update -> Page reload persistence -> Sign out session termination & cache purge.
   - **Cross-User Browser Isolation:** User B logging in cannot view or select User A's organizations or cached data.

---

## 6. Local Environment Status & Cloud Transition Path

### 6.1. Local Environment Status
- **PostgreSQL 17 Database:** Running on loopback `127.0.0.1:5434` with `scram-sha-256` password authentication. The pre-existing Windows service (`postgresql-x64-17` on port 5433) was completely untouched.
- **Fastify API Server:** Running on loopback `127.0.0.1:3001` with strict CORS, helmet, and Supabase JWT verification.
- **Vite Web Client:** Running on loopback `127.0.0.1:5173` with React 19.3, TanStack Query v5, and Zustand v5.
- **Docker Desktop / Local Supabase Daemon Blocker:**
  - On this Windows host, Docker Desktop's daemon service (`com.docker.service`) is currently stopped and non-elevated terminal processes cannot start Windows services (`Start-Service` requires Administrator privileges).
  - Consequently, the full local Supabase container stack (GoTrue auth service, PostgREST) cannot run locally until Docker Desktop is started with administrative access.
  - Development tests and Playwright flows run against the authenticated local PostgreSQL cluster with synthetic test-only JWTs conforming to the Supabase specification.
  - When Docker Desktop is started or when connecting to a remote Supabase project, standard environment variables in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_JWKS_URL`) wire the frontend and backend directly to live GoTrue without code changes.

