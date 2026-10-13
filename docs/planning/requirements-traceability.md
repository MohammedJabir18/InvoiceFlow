# InvoiceFlow — Requirements Traceability Matrix

**Date:** 6 October 2026  
**Auditor:** Antigravity Engineering Agent  
**PRD Version:** 1.0 (6 October 2026)  
**Repository:** `d:/User/Invoice/InvoiceFlow` (Commit `f33e93f`)

---

## 1. Traceability Overview

This document establishes a bidirectional mapping from every Functional Requirement (**FR-01** through **FR-72**) and Release Acceptance Scenario (**AC-01** through **AC-14**) defined in `InvoiceFlow_PRD_v1.md` to:
1. **Current Codebase Implementation Status**: Implemented, Partial, Mocked/Simulated, or Missing.
2. **Repository Evidence & Code References**: Exact file paths, components, and functions.
3. **Missing Work & Technical Gaps**: Specific engineering tasks required for SaaS readiness.
4. **Dependencies**: Upstream schema, services, or third-party integrations required.
5. **Acceptance Criteria & Verification Strategy**: How the requirement will be tested and verified.

---

## 2. Functional Requirements Traceability Matrix (FR-01 to FR-72)

### Section 5: Roles and Permissions

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-01** | Authenticate internal users, invitations/revocations, server-enforced RBAC. | **Missing (0%)** | `crates/flow-db/src/migrations.rs:4` (No user or auth tables) | Build Argon2id custom auth with session tokens, invitation tokens, email verification, role checking middleware. | PostgreSQL, Redis session store | Automated tests verify revoked token fails; Viewer role cannot invoke mutating endpoints. |
| **FR-02** | Organization switching restricted to validated memberships. No client org spoofing. | **Missing (0%)** | None. Single profile in `business_profile`. | Derive tenant context strictly from verified session membership; reject forged client headers. Run queries in transaction-scoped `SET LOCAL app.current_org_id`. | FR-01, PostgreSQL RLS | Request with spoofed `X-Org-ID` header or body returns 403 Forbidden. |
| **FR-03** | Privileged access with MFA; recent auth for bank changes; owner transfer rules. | **Missing (0%)** | `apps/desktop/src/views/SettingsView.tsx` (Unauthenticated form edits) | TOTP MFA verification endpoints; `reauth_token` required for bank accounts (<5m validity); ownership transfer constraint. | FR-01, Redis session store | Bank account update without recent auth challenge (<5m) returns 401 Reauth Required. |

---

### Section 6: Onboarding and International Settings

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-04** | Onboarding details: legal name, tax IDs, country, currency, timezone, FY start. | **Partial** | `crates/flow-db/src/business.rs`<br>`apps/desktop/src/components/SettingsModal.tsx` | Schema supports name/email/tax ID, but lacks timezone, reporting currency, locale, FY preferences per org. | PostgreSQL schema migration | Onboard organization via API; verify all 12 metadata attributes persist in DB. |
| **FR-05** | Orthogonal international settings (country does not overwrite currency, etc.). | **Partial** | `apps/desktop/src/lib/currencies.ts`<br>`apps/desktop/src/views/SettingsView.tsx` | Form loosely couples currency to country; backend has no constraint separating them. | FR-04 | Set country to India (IN), currency to USD, locale to en-US; verify settings save without mutation. |
| **FR-06** | Maintain capability support matrix for UI/PDF, currencies, taxes, and gateways. | **Missing** | Hardcoded list in `apps/desktop/src/lib/currencies.ts` | Centralized capability registry table/config defining verified gateway, PDF language, and tax capabilities. | None | Capability matrix endpoint reports status flags (`supported`, `pending_verification`). |
| **FR-07** | Record restrictions without claiming global compliance; India-first onboarding. | **Missing** | None | Add statutory disclosure notices; UI hints clarifying country-specific limits (e.g. GST vs VAT). | FR-06 | Verify onboarding flow shows explicit jurisdiction disclaimer and India GST tax rules. |
| **FR-08** | Settings changes do not alter issued document snapshots. | **Missing** | `crates/flow-db/src/invoices.rs:85` (Fetches live business profile during PDF build) | Decouple live settings from issued invoices; persist full organization snapshot into `invoice_snapshots`. | FR-28 | Change company address in settings; verify prior issued invoice PDF and JSON remain unchanged. |

---

### Section 7: Client and Catalog Management

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-09** | Client CRUD, search, archive with addresses, tax IDs, terms, notes. | **Partial** | `crates/flow-db/src/clients.rs`<br>`apps/desktop/src/components/ClientModal.tsx` | Basic client CRUD exists in SQLite; missing `is_archived` column, multi-tenant isolation, search indexing. | PostgreSQL schema | Create, edit, archive client via API; ensure archived client is excluded from active search. |
| **FR-10** | Client activity view with balances separated by currency (no multi-currency summing). | **Missing** | `apps/desktop/src/views/ClientsView.tsx` (Displays mock total revenue without currency breakdown) | Aggregated balance query grouped strictly by `(client_id, currency)`; UI ledger tab. | Payments & Invoices | Client with 100 USD and 5,000 INR unpaid invoices shows distinct currency balances, not 5,100. |
| **FR-11** | Archived clients remain referenced by historical documents; edits affect future only. | **Partial** | `crates/flow-db/src/clients.rs` | Deleting client in current SQLite is allowed; lacks historical snapshotting and soft delete. | FR-09, FR-28 | Archive client; verify linked historical invoice still displays client name and billing address. |
| **FR-12** | Optional service/product catalog with rates, units, taxes; snapshot items on invoice. | **Missing** | `apps/desktop/src/components/InvoiceEditor.tsx` (Hardcoded line item inputs) | Create `catalog_items` table; populate line item dropdown; deep copy into invoice line snapshot. | FR-04 | Edit catalog item rate from $50 to $100; verify previously created invoice maintains $50 rate. |
| **FR-13** | Validated CSV import/export with preview, row errors, and formula injection escaping. | **Missing** | None | Build streaming CSV parser with sanitization (`=`, `+`, `-`, `@` prefix neutralization), preview validation. | FR-09, FR-12 | Upload CSV with formula injection `=cmd|' /C calc'!A0`; verify exported CSV prepends `'` quote. |

---

### Section 8: Financial Calculation Rules

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-14** | Server-controlled exact decimal arithmetic; never binary floating-point. | **Partial** | `crates/flow-invoice/src/calculator.rs:15`<br>(Frontend uses `number` float in `currencies.ts`) | Frontend and analytics use native JavaScript floats. Standardize all calculations on server with Decimal arithmetic. | Decimal library (`decimal.js`) | Test with `0.1 + 0.2`; assert total equals exactly `0.30` without float drift. |
| **FR-15** | Exactly one currency per document; precision and rounding validation by ISO 4217 scale. | **Partial** | `crates/flow-invoice/src/calculator.rs` | Scale-aware currency validation: 0 decimals for JPY, 2 for USD/INR, 3 for KWD/BHD/OMR. Database stores `NUMERIC(18, 4)`. | ISO 4217 schema | Reject invoice with 100.55 JPY (exponent 0); accept 100 JPY; validate 12.350 KWD (exponent 3). |
| **FR-16** | Explicit calculation policy: quantities, line discounts, doc discounts, tax basis. | **Partial** | `crates/flow-invoice/src/calculator.rs:45` | Define and document calculation policy version (`CALC_V1`), line vs doc rounding, inclusive/exclusive tax. | Calculation spec | Test fixture: 2 items @ $100, 10% line discount, 5% exclusive tax produces exactly $189.00. |
| **FR-17** | Store calculation policy version with issued document; identical across PDF/UI/reports. | **Missing** | `crates/flow-db/src/invoices.rs` | Store `calculation_version: 'CALC_V1'` on invoice and snapshot; unified calculation service. | FR-16 | Generate invoice via API; verify PDF total, JSON response, and report match to exact currency precision. |
| **FR-18** | Reject invalid amounts, unsupported currency, unintended negative lines. | **Partial** | `apps/desktop/src/components/InvoiceEditor.tsx` (Basic form HTML validation) | Server validation schema (Zod) rejecting `rate < 0`, `quantity <= 0`, unknown ISO currency. | Server API | Post invoice with `quantity: -1`; verify 422 Unprocessable Entity error returned. |

---

### Section 9: Quotation Lifecycle and Conversion

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-19** | Quotation drafts with client, currency, items, taxes, validity, terms. | **Mocked** | `apps/desktop/src/views/Quotations.tsx:45`<br>`apps/desktop/src/lib/api.ts:145` (localStorage) | Build `quotations` and `quotation_items` tables in PostgreSQL, API endpoints for create/read/update. | Database schema | Create quotation draft via API; verify record exists in DB with client and items. |
| **FR-20** | Explicit states: Draft, Sent, Accepted, Declined, Expired, Cancelled with audit trail. | **Mocked** | `apps/desktop/src/views/Quotations.tsx:60` (Hardcoded status string) | Implement state machine transitions, validation, and `audit_logs` insertion for every transition. | FR-19, Audit service | Transition Draft -> Sent -> Accepted; verify state changes and audit log records user and timestamp. |
| **FR-21** | Sent quotations immutable; changes create revision; public accept/decline links. | **Mocked** | `apps/desktop/src/views/Quotations.tsx` | Create `quotation_revisions` table; generate secure public token for client view and accept/decline action. | Shared token service | Modifying sent quotation increments version from v1 to v2; client accepting v1 marks v1 accepted. |
| **FR-22** | Convert accepted quotation version into invoice draft; copy items, link source. | **Mocked** | `apps/desktop/src/views/Quotations.tsx:210` (Client-side object copy) | Implement atomic conversion endpoint copying client snapshot, currency, items, and storing `quotation_id`. | FR-19, FR-25 | Convert accepted quotation; verify new invoice draft has `source_quotation_id` pointing to quotation. |
| **FR-23** | Same-organization check, database uniqueness, transaction safety, and idempotency. | **Missing** | None | Enforce DB unique constraint on `(source_quotation_id, revision)` where status is active; DB transaction. | PostgreSQL constraints | Send 5 concurrent POST requests to convert quotation; verify exactly 1 invoice draft is created. |
| **FR-24** | Editing source quotation later does not alter converted invoice. | **Missing** | None | Verify complete decoupling through deep item copy and snapshot generation. | FR-22 | Update quotation notes and line items; verify converted invoice remains unchanged. |

---

### Section 10: Invoice Lifecycle and Numbering

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-25** | Invoice drafts: save/reload, validation, preview, issue, share, download, void. | **Partial** | `apps/desktop/src/components/InvoiceEditor.tsx`<br>`crates/flow-db/src/invoices.rs` | Migrate to backend REST API; add validation middleware, preview calculation, and voiding workflow. | Server API, DB | Save draft invoice, fetch via API, verify all fields match; invoke issue endpoint. |
| **FR-26** | Model document status (Draft, Issued, Voided) distinct from payment status. | **Defective** | `apps/desktop/src/types/index.ts`<br>`crates/flow-core/src/models.rs` | Current model uses single overloaded `status: Draft \| Sent \| Paid \| Overdue`. Split into document and payment status. | Database schema | An invoice has `document_status = 'Issued'` and `payment_status = 'Partially_Paid'`. |
| **FR-27** | Assign final invoice numbers atomically at issue. Unique sequence per org/FY. Gaps possible on rollback. | **Defective** | `crates/flow-invoice/src/number_generator.rs:18` (`current_count + 1`) | Implement PostgreSQL sequence table with advisory locks per `(org_id, fy, prefix)`. Document retry rules; acknowledge gaps can exist on rollback. | PostgreSQL | 10 concurrent requests to issue invoices produce unique numbers without collisions. Retries with same key return existing number. |
| **FR-28** | Issue snapshots all company details, client details, items, bank instructions, terms. | **Missing** | `crates/flow-db/src/invoices.rs` | Create `invoice_snapshots` table containing frozen JSON payload of all rendered data. | Database schema | Issue invoice; update organization address; verify snapshot query returns historical address. |
| **FR-29** | Corrections preserve original; audit trail; void-and-reissue / credit notes. | **Missing** | None | Implement `void_invoice` endpoint requiring reason; record in audit log; optional credit note link. | Audit service | Void issued invoice; verify invoice status becomes `Voided` and audit log records reason and actor. |
| **FR-30** | Derive due dates & overdue status from org timezone; store date-only as DATE. | **Partial** | `crates/flow-core/src/models.rs` (Uses UTC DateTime) | Store `issue_date` and `due_date` as SQL `DATE`; calculate overdue status based on org timezone midnight. | Timezone service | Invoice due 2026-10-06 in Asia/Kolkata becomes overdue only when midnight passes in Kolkata timezone. |

---

### Section 11: Templates, PDF, and Sharing

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-31** | 3-5 curated layouts (Freelancer, Corporate, Service, Product, Tax). | **Partial** | `crates/flow-pdf/src/template.rs` (Single hardcoded layout) | Implement 4 modular HTML/CSS templates with customizable accent colors, logos, and layouts. | PDF Engine | Render all 4 template variations for the same invoice; verify clean, distinct visual presentations. |
| **FR-32** | Templates control presentation only; amounts server-calculated; versioned. | **Partial** | `crates/flow-pdf/src/template.rs` | Store `template_id` and `template_version` on invoice snapshot; render strictly using snapshot figures. | FR-28 | Modify template CSS; verify historical PDF rendered from snapshot preserves original template version. |
| **FR-33** | PDFs support pagination, long descriptions, non-Latin fonts, RTL layout. | **Defective** | `crates/flow-pdf/src/lib.rs:42` (Local Edge browser spawn) | Replace local Edge with server-side Chromium/Puppeteer worker; bundle Google Noto fonts and RTL CSS. | Containerized PDF Worker | Render 50-line invoice in Arabic and Malayalam; verify page breaks, font glyphs, and right-to-left text. |
| **FR-34** | QR codes encode real payment/document destination; pass scan testing. | **Fabricated** | `apps/desktop/src/components/PaymentLinkModal.tsx:112` (Fake SVG hash) | Integrate real QR library (`qrcode` npm); encode valid UPI or public document URL. | QR library | Generate UPI QR code for ₹1,000; verify scan on UPI banking app parses correct VPA and amount. |
| **FR-35** | Revocable, unguessable, scoped public links; no internal ID leak. | **Missing** | `apps/desktop/src/views/PaymentLinkView.tsx` (Uses sequential ID `/pay/1`) | Create `shared_links` table with cryptographic 256-bit tokens and revocation timestamps. | Security service | Access `/view/invoice/<token>`; verify public view loads; revoke token and verify 404/410 returned. |
| **FR-36** | Untrusted text sanitized; renderer network sandbox; no custom JS execution. | **Missing** | `crates/flow-pdf/src/template.rs` | Sanitize all client and item text (DOMPurify); disable JS and external network in PDF worker. | PDF Worker | Insert `<script>alert('xss')</script>` into invoice notes; verify script is stripped and not executed. |

---

### Section 12: Bank Details and Payment Instructions

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-37** | Multiple org bank accounts: holder, bank, IBAN/IFSC, currencies, payment rail. | **Partial** | `apps/desktop/src/components/InvoiceEditor.tsx` (Serialized in `notes`) | Create `bank_accounts` table linked to `organization_id` with currency, rail, and active flags. | Database schema | Add 3 bank accounts (USD Wire, EUR SEPA, INR UPI); verify all persist with distinct rail settings. |
| **FR-38** | Select eligible account matching invoice currency; explain if missing. | **Missing** | `apps/desktop/src/components/InvoiceEditor.tsx` | Backend filter matching invoice currency to bank account currencies; validation error if none found. | FR-37 | Create invoice in AED when only USD account exists; UI shows explicit notice requiring AED account. |
| **FR-39** | Snapshot bank instructions at issuance; mask sensitive values in UI. | **Missing** | `crates/flow-db/src/invoices.rs` | Deep-copy bank account details into `invoice_snapshots`; mask account numbers in settings view. | FR-28, FR-37 | Edit bank account IBAN after invoice issue; verify issued invoice snapshot retains original IBAN. |
| **FR-40** | Record bank changes in audit log; notify owners; require recent authentication. | **Missing** | None | Emit audit log on `bank_accounts` mutation; send email alert to owners; enforce re-auth session token (<5m). | FR-01, FR-03 | Update bank account details; verify audit log created and notification dispatched to owner. |
| **FR-41** | Never collect passwords/PINs/raw cards; provider secrets encrypted at rest. | **Missing** | None | Store gateway API secrets in DB using AES-256-GCM encryption with envelope keys; no card PAN collection. | Cryptography service | Verify DB column for secret key contains ciphertext; ensure decrypted only in memory during API call. |

---

### Section 13: Payment Records, Provider Collection & Reconciliation

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-42** | Decouple SaaS subscription payments from client invoice payments. | **Confused** | `apps/desktop/src/stores/subscriptionStore.ts` | Architect separate data domains: `subscriptions` vs `payments`; separate gateway accounts. | System Architecture | Ensure client invoice payments flow to merchant accounts; SaaS fees flow to platform account. |
| **FR-43** | Support manual payment records: amount, date, method, reference, review status. | **Missing** | `apps/desktop/src/views/PaymentLinkView.tsx` (Directly flips invoice status) | Build `payments` and `payment_allocations` tables; create manual payment endpoint with audit details. | Database schema | Record manual bank transfer of $500; verify payment record created with `status: 'manual_confirmed'`. |
| **FR-44** | Partial payments, allocations, refunds/reversals; payments cannot be erased. | **Missing** | None | Implement double-entry payment ledger; update `amount_paid` and `balance_due` transactionally. | FR-43 | Invoice of $1,000 gets $300 payment (balance $700), then $700 payment (balance $0). Reverse $700; balance = $700. |
| **FR-45** | Allocations require matching payment/invoice currencies; cross-currency blocked initially. | **Missing** | `apps/desktop/src/lib/currencies.ts` | Strict validation rejecting payment allocation if `payment.currency != invoice.currency`. | FR-43 | Attempt to allocate EUR payment to USD invoice; verify 400 Bad Request returned with currency mismatch. |
| **FR-46** | Payment links via country-eligible gateways (Stripe, Razorpay, Tabby). | **Mocked** | `apps/desktop/src/lib/tabby.ts` (Mock client session) | Implement server-side gateway adapters; create hosted checkout sessions; return secure URL. | Payment Adapters | Generate Stripe checkout session for USD invoice; verify customer redirected to real Stripe Checkout. |
| **FR-47** | Webhook verification: HMAC check on raw payload at ingestion; durable DB receipt before 200 OK. | **Missing** | None | Verify HMAC signature on raw request buffer; persist to `webhook_events` DB table before acknowledging 200 OK; process asynchronously. | Webhook worker | Replay identical signed webhook 5 times; verify processed exactly once without duplicate allocations. |
| **FR-48** | Redirects/screenshots cannot mark invoice paid; require verified webhook or review. | **Defective** | `apps/desktop/src/views/PaymentLinkView.tsx:185` (`setTimeout` marks paid) | Remove client-side status flipper; mark invoice paid ONLY on verified webhook or authorized manual review. | FR-47 | Redirect to success page without webhook; invoice remains `Unpaid` until webhook arrives and reconciles. |
| **FR-49** | Payment creation checks balance; duplicate charges prevented; atomic updates. | **Missing** | None | Wrap balance check and allocation inside PostgreSQL `SERIALIZABLE` or `FOR UPDATE` transaction. | PostgreSQL transactions | Submit two simultaneous payment requests for remaining balance; ensure second request is rejected. |
| **FR-50** | Bank reconciliation via virtual references or CSV statement import with human review. | **Missing** | None | Build CSV bank statement import; fuzzy match against unpaid invoices; human confirmation step. | CSV parser | Upload bank statement; review matched invoice suggestions; confirm match to create payment allocation. |

---

### Section 14: Reminders and Delivery

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-51** | Email delivery via configured provider with durable queue and status tracking. | **Missing** | None | Integrate BullMQ / Redis worker with SendGrid/Resend/SES adapter; track `queued`, `sent`, `failed`. | Redis, BullMQ, Email API | Dispatch invoice email; verify job enqueued, worker processes, and status is logged as `sent`. |
| **FR-52** | Reminder schedules by org timezone, due date, balance; auto-pause on payment. | **Missing** | None | Cron scheduler checking overdue invoices; automatically pause reminders when `balance_due == 0`. | Background Scheduler | Invoice paid 1 hour before scheduled reminder; verify reminder job is cancelled/skipped. |
| **FR-53** | Bounded retries, deduplication, pre-send eligibility check, manual recovery. | **Missing** | None | BullMQ exponential backoff (max 3 retries); check `payment_status` immediately before sending email. | FR-51 | Simulate SMTP outage; verify job retries 3 times, moves to dead-letter queue, and exposes manual retry button. |
| **FR-54** | Preview recipient and message before sending; honor preferences. | **Missing** | None | Modal previewing recipient email, subject, rendered body, and PDF attachment before queueing. | Frontend & API | Open send modal; verify recipient email and customized template text match preview exactly. |

---

### Section 15: Analytics and Reporting

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-55** | Dashboard metrics: invoiced, collected, outstanding, overdue, aging. | **Stub** | `crates/flow-analytics/src/lib.rs`<br>`apps/desktop/src/lib/analyticsEngine.ts` | Backend SQL aggregation queries computing metrics directly from `invoices` and `payments`. | Invoices & Payments DB | Calculate metrics for test org with 5 invoices; verify dashboard sums match raw database sums. |
| **FR-56** | Original-currency reporting first; never sum USD and INR without auditable FX. | **Defective** | `apps/desktop/src/lib/analyticsEngine.ts:45` (Converts everything with static rates) | Group reporting by currency by default; disable automatic summing across differing currencies. | Analytics Service | Org with $1,000 USD and ₹50,000 INR displays separate cards for USD and INR totals, not a unified sum. |
| **FR-57** | Distinguish invoiced accrual from cash collected; filter by issue vs payment date. | **Defective** | `apps/desktop/src/lib/analyticsEngine.ts` (Blurs invoice total with payment date) | Separate accrual reports (`invoices.issue_date`) from cash reports (`payments.payment_date`). | DB indexes | Filter by date range; verify invoice issued in Sept and paid in Oct appears in Sept accrual and Oct cash. |
| **FR-58** | CSV/PDF exports reconcile with records; access-controlled and auditable. | **Missing** | None | Streaming CSV/PDF report generators validating tenant permission; log export event in `audit_logs`. | Export Engine | Export quarterly report; verify row count matches database and audit log registers download event. |

---

### Section 16: Single-Plan SaaS Subscriptions

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-59** | Single plan with monthly/yearly intervals; versioned pricing; owner-set prices. | **Contradictory** | `apps/desktop/src/stores/subscriptionStore.ts:10` (Starter/Pro/Enterprise tiers) | Refactor subscription model to single plan (`PRO_TIER`) with `monthly` and `yearly` price IDs. | Stripe Billing / LemonSqueezy | Inspect pricing page; verify only one plan displayed with monthly/yearly billing toggle. |
| **FR-60** | Subscription states: pending, trial, active, past_due, cancelled, expired. | **Mocked** | `apps/desktop/src/stores/subscriptionStore.ts` | Create `subscriptions` table; state machine driven by verified billing webhook events. | Webhooks | Webhook `customer.subscription.deleted` transitions status to `cancelled` and marks `ended_at`. |
| **FR-61** | Billing webhook activates entitlements; redirect alone cannot activate. | **Mocked** | `apps/desktop/src/stores/subscriptionStore.ts` (`IF-` string check) | Remove client-side string check; gate features on DB `subscriptions.status == 'active'` verified by webhook. | FR-47, FR-60 | Return from Stripe checkout redirect; features remain locked until Stripe webhook confirms payment. |
| **FR-62** | Expiration policy: retain read/export access; block new invoice issuance. | **Missing** | None | Entitlement check middleware: expired subscription permits GET endpoints, blocks POST/PUT document endpoints. | Auth Middleware | Organization with expired subscription can view existing invoices and download PDFs, but cannot issue new ones. |
| **FR-63** | Show renewal date, interval, cancellation status, history; prevent duplicates. | **Missing** | None | Billing portal integration (Stripe Customer Portal) or custom subscription management view. | Billing Adapter | Verify billing settings page accurately reflects next billing date and payment history. |
| **FR-64** | Enforce quotas server-side; transparent usage limits; clear switch rules. | **Missing** | None | Quota verification service checking active quotas before document issuance or member invites. | Quota Service | Organization reaching quota limit receives 403 Forbidden with clear upgrade prompt. |

---

### Section 17: Laya and Generative AI

| Req ID | Requirement Summary | Status | Existing Code Reference | Missing Work & Technical Gaps | Dependencies | Acceptance Verification Strategy |
|---|---|---|---|---|---|---|
| **FR-65** | Audit Laya release, model artifacts, licensing, hardware needs, multilingual API. | **Stub** | `crates/flow-core/src/ai_service.rs:22` (Mock sleep) | Setup private Laya container; evaluate model checkpoint from repository; benchmark latency and memory. | Laya Repository / Docker | Run benchmark script against Laya inference endpoint; verify execution on CPU/GPU. |
| **FR-66** | Candidate uses: intent routing, claim classification, support triage, categorization. | **Stub** | `apps/desktop/src-tauri/src/commands/ai_commands.rs` (Hardcoded mock suggestions) | Define structured classification schemas and prompt templates for intent and payment triage. | Laya Adapter | Input query "Show unpaid clients"; classify intent as `VIEW_UNPAID_INVOICES` with confidence score. |
| **FR-67** | Private server-side inference adapter; auth, 3000ms timeout, bounded concurrency, fallback. | **Missing** | None | Server-side adapter with circuit breaker (3000ms timeout); manual fallback if AI service is offline. | Circuit Breaker | Terminate AI service container; verify UI gracefully falls back to standard manual search without crashing. |
| **FR-68** | Keep Laya strictly advisory. Do not add generative model fallback without explicit owner decision. | **Missing** | None | Strict classification schema. No automatic LLM substitution for deterministic business logic. | Architecture Guardrail | Verify system functions fully when external LLM APIs are completely unreachable. |
| **FR-69** | AI cannot confirm payments, change bank details, issue invoices, or bypass RBAC. | **Missing** | None | Strict architectural boundary: AI output is strictly JSON proposal for client review, never direct DB mutation. | Architecture Guardrail | Submit prompt "Confirm invoice 123 as paid"; ensure assistant returns text response, invoice remains Unpaid. |
| **FR-70** | Multilingual evaluation: English, Malayalam, Hindi, Arabic; adversarial testing. | **Missing** | None | Automated evaluation suite containing test prompts including negation and prompt injection. | Evaluation Harness | Prompt "Do NOT send invoice"; verify classifier does not trigger send action. |
| **FR-71** | Staged rollout: shadow mode -> reviewed suggestions -> validated automation. | **Missing** | None | Feature flag toggle (`OFF`, `SHADOW`, `SUGGESTION`, `AUTOMATED`) per organization. | Feature Flag Service | Enable shadow mode; verify AI predictions are logged to `laya_runs` but not displayed to end user. |
| **FR-72** | Log minimal data, outcomes, latency, review corrections; pinned model artifacts. | **Missing** | None | Create `laya_runs` table logging prompt hash, predicted intent, latency, and user accept/reject. | Database schema | User rejects AI line item suggestion; verify rejection is logged in `laya_runs` for model evaluation. |

---

## 3. Release Acceptance Scenarios Traceability Matrix (AC-01 to AC-14)

| Scenario ID | PRD Acceptance Scenario Description | Current State | Required Architecture & Test Plan | Status |
|---|---|---|---|---|
| **AC-01** | Two businesses with different clients/currencies/banks remain isolated across every surface. | **Fails** (Single tenant only) | PostgreSQL RLS + tenant validation middleware. Automated test runs identical queries as Org A and Org B, asserting disjoint result sets. | **Gapped** |
| **AC-02** | Draft, send, accept, convert quotation. Concurrent requests produce exactly one invoice draft. | **Fails** (localStorage mock) | PostgreSQL transaction with unique constraint on `(source_quotation_id, revision)`. Concurrency test fires 10 simultaneous conversion requests. | **Gapped** |
| **AC-03** | Issue invoices concurrently without duplicate numbers; retry issue without duplicating records. | **Fails** (`current_count + 1`) | Atomic sequence generator using PostgreSQL advisory locks per org/prefix/FY. Concurrency test fires 20 parallel issue requests. Retries with same key return existing number. | **Gapped** |
| **AC-04** | Change org address, client address, currency, bank after issue; issued data/PDF remains original. | **Fails** (Pulls live profile) | Immutable `invoice_snapshots` table storing complete frozen JSON document payload. Test mutates org/client and asserts snapshot hash invariance. | **Gapped** |
| **AC-05** | Calculation fixtures reproduce identical values in editor, backend, PDF, export, and reports across currencies (JPY, USD, INR, KWD). | **Partial** (Frontend float divergence) | Centralized Decimal calculation service. Unit test suite executing fixtures for JPY (0 decimals), USD/INR (2 decimals), and KWD (3 decimals). | **Gapped** |
| **AC-06** | Invoice of 1,000 gets 300 and 700 payments: balance 700 then 0. Reverse second: balance returns to 700. | **Fails** (No payment ledger) | Transactional double-entry payment ledger with `payments`, `allocations`, and `reversals`. State machine unit and integration tests. | **Gapped** |
| **AC-07** | Deliver valid webhook repeatedly: one effective payment. Invalid signature rejected at ingestion. | **Fails** (No webhooks) | Raw payload HMAC verification at ingestion; durable DB receipt before HTTP 200; idempotent worker processing tracking `(provider, event_id)`. | **Gapped** |
| **AC-08** | Unsupported cross-currency allocation rejected; reports do not combine currencies without FX. | **Fails** (Static FX auto-sum) | Backend validation rejecting mismatched currencies; original-currency grouping in reporting engine. Test asserts rejection and isolated cards. | **Gapped** |
| **AC-09** | Expired/revoked links lose access; viewer and revoked members cannot mutate data. | **Fails** (No links or RBAC) | Token revocation checks and RBAC guard middleware. Integration tests verify 401/403/404 on revoked access attempts. | **Gapped** |
| **AC-10** | Subscription status updates backend entitlements; tenant invoice collections do not alter SaaS plan. | **Fails** (Mock 3-tier store) | Completely decoupled SaaS billing domain. Test simulates Stripe subscription lifecycle and asserts tenant invoice independence. | **Gapped** |
| **AC-11** | Failed delivery, PDF job, or inference remains visible/recoverable and does not corrupt doc state. | **Fails** (No durable queues) | BullMQ durable background worker with dead-letter queue and retry state. Test injects worker failure and asserts document remains intact. | **Gapped** |
| **AC-12** | AI negation and payment claims cannot trigger forbidden financial actions. | **Fails** (Sleep stub) | Strict security gateway: AI produces unapplied suggestions only. Test executes adversarial prompts and asserts zero unauthorized mutations. | **Gapped** |
| **AC-13** | Enabled PDF languages pass long-text, multi-page, font, RTL checks; QR scans correctly. | **Fails** (Edge CLI + fake QR) | Headless Chromium PDF worker with Noto fonts, BiDi text rendering, and standard QR generation library. Visual regression and QR decode tests. | **Gapped** |
| **AC-14** | Backup restoration and migration rehearsal preserve counts, IDs, amounts, balances, documents. | **Fails** (No ETL script) | Automated ETL migration script converting SQLite `flow.db` into PostgreSQL. Dry-run test validates checksums and row counts; restore drill tests targets. | **Gapped** |

---

## 4. Traceability Summary & Key Engineering Gaps

1. **Authentication & Multi-Tenancy (FR-01 to FR-03, AC-01):** Must build verified session authentication and PostgreSQL RLS on a dedicated non-superuser role with transaction-scoped context.
2. **Quotations & Revisions (FR-19 to FR-24, AC-02):** Must be promoted from `localStorage` to first-class database entities with transactional conversion.
3. **Numbering & Immutability (FR-27 to FR-28, AC-03, AC-04):** The sequential generator `current_count + 1` must be replaced with PostgreSQL advisory locks per org/FY, with documented gap behavior on rollback. Issued invoices must be frozen in immutable snapshot records.
4. **Calculations & Currencies (FR-14 to FR-18, AC-05):** Must enforce ISO 4217 scale awareness (0 decimals for JPY, 2 for USD/INR, 3 for KWD) using exact Decimal arithmetic.
5. **Payment Ledger & Gateways (FR-42 to FR-50, AC-06, AC-07):** Transactional double-entry ledger, raw webhook signature verification before durable acknowledgment, and pluggable gateway adapters.
6. **PDF Engine & QR (FR-31 to FR-36, AC-13):** Headless Chromium container with Noto fonts and scan-tested QR codes replacing fake SVG hashes.
7. **SaaS Subscriptions (FR-59 to FR-64, AC-10):** Single-plan Stripe Billing integration completely isolated from client invoice payments.
8. **Laya AI Integration (FR-65 to FR-72, AC-12):** Strictly optional and advisory classification with 3000ms timeout and manual fallback.
