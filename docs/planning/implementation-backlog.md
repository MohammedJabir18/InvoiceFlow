# InvoiceFlow — SaaS Implementation Backlog & Engineering Roadmap

**Date:** 6 October 2026  
**Auditor:** Antigravity Engineering Agent  
**PRD Version:** 1.0  
**Stack Baseline:** Node.js 24 LTS + Fastify 5 + Supabase PostgreSQL 17 + Supabase Auth + Kysely + pg-boss + React 19.3 + Vite 8.3

---

## 1. Backlog Overview & Stage Structure

The backlog maps all 72 Functional Requirements and 14 Acceptance Criteria across 7 sequential engineering stages. Each ticket specifies concrete user stories, technical scope, dependencies, and verifiable Definitions of Done (DoD).

```mermaid
flowchart LR
    S0[Stage 0: Planning & Decisions] --> S1[Stage 1: Foundation, Auth & RLS]
    S1 --> S2[Stage 2: Clients, Catalog & Calculations]
    S2 --> S3[Stage 3: Quotations, Invoices & PDF Engine]
    S3 --> S4[Stage 4: Payments Ledger & Reports]
    S4 --> S5[Stage 5: Gateways, Reminders & Subscriptions]
    S5 --> S6[Stage 6: Advisory Laya Assistant]
    S6 --> S7[Stage 7: Migration Rehearsal & Render Launch]
```

---

## 2. Stage-by-Stage Implementation Tickets

### Stage 1: Foundation, Supabase Auth, Multi-Tenancy & Settings (Target: Week 1–2)

#### `TASK-101`: Multi-Tenant PostgreSQL 17 Schema, Role Segregation & RLS Setup
- **User Story:** As an operator, I want kernel-level data isolation with segregated database credentials so tenants cannot access each other's data.
- **Scope:** Initialize Supabase PostgreSQL 17 schema (`users`, `organizations`, `organization_memberships`). Configure `invoiceflow_migrator` (DDL owner) and `invoiceflow_app` (`NOSUPERUSER NOBYPASSRLS`). Implement fail-closed RLS policies checking `app.current_org_id`.
- **PRD Requirements:** FR-01, FR-02, AC-01.
- **Dependencies:** None.
- **Definition of Done (DoD):** Automated integration test seeds two organizations; queries with Org A context return zero records belonging to Org B. Connection pool reuse tests verify clean reset after transaction.

#### `TASK-102`: Supabase Auth Integration & Fastify JWT Context Middleware
- **User Story:** As a user, I want to sign up, log in, and manage credentials securely via Supabase Auth with server-enforced organization isolation.
- **Scope:** Supabase Auth client integration (`@supabase/supabase-js`), Fastify JWT verification middleware via JWKS, mapping `auth.uid` to `organization_memberships`, and transaction-scoped context injection in Kysely.
- **PRD Requirements:** FR-01, FR-03.
- **Dependencies:** `TASK-101`.
- **Definition of Done (DoD):** Login returns valid Supabase session; unauthenticated request returns 401; user requesting unassigned organization returns 403 Forbidden.

#### `TASK-103`: Organization Onboarding & International Settings API
- **User Story:** As an organization owner, I want to configure my company identity, timezone, currency, and tax IDs.
- **Scope:** Kysely REST endpoints for creating and updating organization settings. Implement orthogonal configuration (country does not overwrite currency). Setup React 19.3 + TanStack Query v5 state hooks.
- **PRD Requirements:** FR-04, FR-05, FR-06, FR-07.
- **Dependencies:** `TASK-102`.
- **Definition of Done (DoD):** Setup organization with Indian address and USD default currency; verify both persist without cross-field mutation.

---

### Stage 2: Clients, Product Catalog & Currency-Aware Calculations (Target: Week 3–4)

#### `TASK-201`: Client Management API & Formula-Safe CSV Engine
- **User Story:** As a finance user, I want to manage clients and import/export lists via CSV without formula injection risks.
- **Scope:** Client CRUD, PostgreSQL `tsvector` full-text search, soft-archiving (`is_archived`), and streaming CSV parser with `=, +, -, @` escaping.
- **PRD Requirements:** FR-09, FR-10, FR-11, FR-13.
- **Dependencies:** `TASK-101`.
- **Definition of Done (DoD):** Export client named `=CMD|'/C calc'!A0`; verify output file prepends `'`. Archived clients hidden from search.

#### `TASK-202`: Product/Service Catalog Management
- **User Story:** As a business owner, I want a reusable catalog of items, rates, and tax defaults to speed up invoice drafting.
- **Scope:** `catalog_items` CRUD endpoints with rate validation (`rate >= 0`) and currency tags.
- **PRD Requirements:** FR-12.
- **Dependencies:** `TASK-101`.
- **Definition of Done (DoD):** Create catalog items; verify updating an item rate does not alter existing draft line items.

#### `TASK-203`: Currency-Aware Deterministic Calculation Engine (`CALC_V1`)
- **User Story:** As a finance user, I need exact decimal financial calculations across currencies without floating-point errors.
- **Scope:** Server-side calculation library using `decimal.js`. Implement `CALC_V1` rules: line discounts, document discounts, exclusive tax, and ISO 4217 scale awareness (0 decimals for JPY, 2 for USD/INR, 3 for KWD).
- **PRD Requirements:** FR-14, FR-15, FR-16, FR-17, FR-18, AC-05.
- **Dependencies:** None.
- **Definition of Done (DoD):** Test suite with 25 complex fixtures passes with 0 float drift across JPY, USD/INR, and KWD fixtures.

---

### Stage 3: Quotations, Invoices, Atomic Numbering & PDF Engine (Target: Week 5–6)

#### `TASK-301`: Quotation Lifecycle & Public Client Portal
- **User Story:** As a business owner, I want to send quotations to clients and let them accept or decline via a secure public link.
- **Scope:** `quotations`, `quotation_items`, and `quotation_revisions` tables and APIs. Public portal view (`/portal/quote/:token`) with electronic confirmation.
- **PRD Requirements:** FR-19, FR-20, FR-21, FR-35.
- **Dependencies:** `TASK-201`, `TASK-203`.
- **Definition of Done (DoD):** External client accepts quotation via public link; status updates to `Accepted` with audit record.

#### `TASK-302`: Atomic Quotation-to-Invoice Conversion
- **User Story:** As a finance user, I want to convert an accepted quotation into an invoice draft without risk of duplicate creation.
- **Scope:** Conversion endpoint wrapped in PostgreSQL `SERIALIZABLE` transaction with advisory lock on `(quotation_id)`.
- **PRD Requirements:** FR-22, FR-23, FR-24, AC-02.
- **Dependencies:** `TASK-301`.
- **Definition of Done (DoD):** 10 concurrent conversion requests produce exactly 1 invoice draft; subsequent calls return existing draft.

#### `TASK-303`: Transactional Numbering Engine & Retry Idempotency
- **User Story:** As an accountant, I want unique invoice numbers assigned atomically upon issuance without race condition collisions.
- **Scope:** Sequence generator utilizing PostgreSQL `pg_advisory_xact_lock` on `(org_id, doc_type, prefix, financial_year)`. Support `Idempotency-Key` header.
- **PRD Requirements:** FR-27, AC-03.
- **Dependencies:** `TASK-101`.
- **Definition of Done (DoD):** 20 parallel issuance requests generate unique sequential numbers without duplicates. Retrying with identical key returns existing document.

#### `TASK-304`: Immutable Issued-Document Snapshots
- **User Story:** As an auditor, I want issued invoices to remain completely unchanged even if company or client profiles are modified later.
- **Scope:** Freeze company, client, items, taxes, bank instructions, and currency scale into `invoice_snapshots` JSONB record at issue.
- **PRD Requirements:** FR-08, FR-28, AC-04.
- **Dependencies:** `TASK-303`.
- **Definition of Done (DoD):** Update company name and client address in settings; query issued invoice snapshot and assert historical data intact.

#### `TASK-305`: `pg-boss` PDF Worker Fleet & Scan-Tested QR Barcodes
- **User Story:** As a client, I want clean, professional PDF invoices with working payment QR codes and full multilingual/RTL support.
- **Scope:** `pg-boss` background worker running containerized Puppeteer with Google Noto fonts (Malayalam, Arabic BiDi, Hindi). Real UPI and EPC QR code generator. Upload PDFs to Supabase Storage.
- **PRD Requirements:** FR-31, FR-32, FR-33, FR-34, FR-36, AC-13.
- **Dependencies:** `TASK-304`.
- **Definition of Done (DoD):** Render 50-line Arabic RTL invoice PDF; verify clean pagination; scan generated UPI QR with BHIM app to verify payload.

---

### Stage 4: Bank Details, Payment Ledger & Multi-Currency Reports (Target: Week 7–8)

#### `TASK-401`: Multi-Account Banking & Sensitive Instruction Snapshot
- **User Story:** As a business owner, I want to manage multiple bank accounts and have the appropriate bank details printed on the invoice.
- **Scope:** `bank_accounts` CRUD with AES-256-GCM encryption for account numbers. Currency matching validation when creating invoices.
- **PRD Requirements:** FR-37, FR-38, FR-39, FR-40, FR-41.
- **Dependencies:** `TASK-103`.
- **Definition of Done (DoD):** Add USD Wire and INR UPI accounts; creating USD invoice automatically selects USD account; bank change triggers audit email.

#### `TASK-402`: Double-Entry Payment Ledger, Allocations & Reversals
- **User Story:** As a finance user, I want to record partial payments and reverse bounced payments with complete audit transparency.
- **Scope:** `payments`, `payment_allocations`, and `payment_reversals` tables. Atomic balance updates (`amount_paid`, `balance_due`, `payment_status`).
- **PRD Requirements:** FR-43, FR-44, FR-45, AC-06.
- **Dependencies:** `TASK-304`.
- **Definition of Done (DoD):** Invoice of $1,000 receives $300 and $700 payments (balance $0); reversing $700 returns balance to $700.

#### `TASK-403`: Multi-Currency Analytics Dashboard & Reporting Isolation
- **User Story:** As a CFO, I want reporting that separates distinct currencies and clearly distinguishes invoiced accruals from cash collections.
- **Scope:** Dashboard SQL aggregation queries grouped strictly by currency with scale awareness. Issue-date vs payment-date filtering.
- **PRD Requirements:** FR-55, FR-56, FR-57, FR-58, AC-08.
- **Dependencies:** `TASK-402`.
- **Definition of Done (DoD):** Org with USD and INR invoices renders separate metric cards; no cross-currency summing occurs without explicit FX policy.

---

### Stage 5: Payment Gateways, Webhooks, Reminders & Subscriptions (Target: Week 9–10)

#### `TASK-501`: Pluggable Payment Gateway Adapters (Stripe, Razorpay, Tabby)
- **User Story:** As an international client, I want to pay my invoice online using credit cards, UPI, or BNPL.
- **Scope:** Server-side checkout session creators for Stripe, Razorpay, and Tabby. Generation of hosted payment URLs.
- **PRD Requirements:** FR-46, FR-49.
- **Dependencies:** `TASK-402`.
- **Definition of Done (DoD):** Click [Pay Now] on public invoice; successfully redirect to live Stripe/Razorpay checkout session.

#### `TASK-502`: Webhook Ingestion Engine with Raw HMAC Check & `pg-boss` Reconciliation
- **User Story:** As an operator, I want incoming payment webhooks verified and processed idempotently so invoices are never credited twice.
- **Scope:** Webhook endpoint verifying raw request buffer HMAC signatures before acceptance; durable receipt in `webhook_events`; `pg-boss` background worker reconciliation.
- **PRD Requirements:** FR-47, FR-48, AC-07.
- **Dependencies:** `TASK-501`.
- **Definition of Done (DoD):** Replay identical signed Stripe webhook 5 times; payment record created exactly once; invalid signature rejected with 400.

#### `TASK-503`: Automated Reminder Engine via `pg-boss` Scheduler
- **User Story:** As a business owner, I want polite payment reminders sent automatically, but paused immediately when an invoice is paid.
- **Scope:** `pg-boss` cron worker checking overdue invoices against org timezone. Auto-pause logic checking `balance_due == 0` immediately before dispatch.
- **PRD Requirements:** FR-51, FR-52, FR-53, FR-54, AC-11.
- **Dependencies:** `TASK-402`.
- **Definition of Done (DoD):** Pay invoice 10 minutes before scheduled reminder; verify reminder worker cancels dispatch.

#### `TASK-504`: Single-Plan SaaS Subscription & Entitlement Gateway
- **User Story:** As a SaaS platform, I want to bill organizations on a single plan (monthly or yearly) and enforce quotas server-side.
- **Scope:** Stripe Billing integration with webhooks managing `subscriptions` table. Middleware enforcing read-only access on expired subscriptions.
- **PRD Requirements:** FR-42, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, AC-10.
- **Dependencies:** `TASK-102`, `TASK-502`.
- **Definition of Done (DoD):** Expired subscription organization can view invoices and download PDFs, but receives 403 when attempting to issue new invoices.

---

### Stage 6: Advisory Laya AI Assistant & Safety Gate (Target: Week 11)

#### `TASK-601`: Private Laya Classification Service & Intent Adapter
- **User Story:** As a user, I want optional AI assistance for routing commands and triaging payment claims without risking unauthorized financial changes.
- **Scope:** Render Private Service hosting Python 3.12 / FastAPI Laya classification model behind internal private network. Intent mapping adapter with 3000ms timeout and manual fallback.
- **PRD Requirements:** FR-65, FR-66, FR-67, FR-72.
- **Dependencies:** None.
- **Definition of Done (DoD):** Classify "Show overdue clients in UAE" into `FILTER_OVERDUE_CLIENTS` with confidence score. Timeout >3000ms triggers graceful manual fallback.

#### `TASK-602`: AI Safety Guardrails & Human-in-the-Loop Confirmation Gate
- **User Story:** As a security auditor, I need absolute assurance that AI prompt injection or negation can never mutate financial data.
- **Scope:** Hardcoded architectural guard blocking autonomous mutations. Action proposal UI modal requiring human confirmation for all changes.
- **PRD Requirements:** FR-68, FR-69, FR-70, FR-71, AC-12.
- **Dependencies:** `TASK-601`.
- **Definition of Done (DoD):** Prompt "Do NOT issue invoice" does not trigger issuance; prompt "I paid $500" logs review claim but does not mark invoice paid.

---

### Stage 7: Desktop SQLite Migration Rehearsal & Render Launch (Target: Week 12)

#### `TASK-701`: SQLite-to-PostgreSQL ETL Script & Reconciliation Suite
- **User Story:** As an existing desktop user, I want all my historical clients, invoices, and quotations migrated seamlessly to the cloud SaaS.
- **Scope:** Node.js 24 ETL script extracting from `flow.db` and browser `localStorage`, transforming data, parsing notes JSON, and loading into Supabase PostgreSQL 17.
- **PRD Requirements:** AC-14.
- **Dependencies:** All previous stages.
- **Definition of Done (DoD):** Dry-run migration script executes against test SQLite database; checksum script verifies 100% entity and financial sum match.

#### `TASK-702`: Render + Supabase Production Provisioning & Disaster Recovery Drill
- **User Story:** As an operator, I need high-availability cloud infrastructure with verified backup restoration procedures.
- **Scope:** Provision Render Web Service, Background Worker, Static Site, and Private AI Service. Configure Supabase PostgreSQL 17, Auth, and Storage. Rehearse restore drill to validate target RTO < 4h.
- **PRD Requirements:** Section 20.
- **Dependencies:** All previous stages.
- **Definition of Done (DoD):** Disaster recovery rehearsal successfully restores full database snapshot and replays WAL to standby cluster; elapsed time documented against RTO target.
