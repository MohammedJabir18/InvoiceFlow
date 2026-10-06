# InvoiceFlow — Current-State Codebase Audit

**Date:** 6 October 2026  
**Auditor:** Antigravity Engineering Agent  
**Repository:** `d:/User/Invoice/InvoiceFlow`  
**Current Branch:** `main`  
**Head Commit:** `f33e93f` (`feat: portal context menu, multi-device support, daylight contrast, and complete invoice PDF engine`)  
**Working Tree Status:** Clean (untracked `MD/` and `docs/`)  
**Scope:** Complete audit of desktop Tauri/Rust/React application vs. target SaaS PRD v1.0.

---

## 1. Executive Summary & Audit Methodology

InvoiceFlow currently exists as a **desktop-first hybrid application** built on **Tauri v2 (Rust backend)** and **React 19 + Vite 6 + Tailwind CSS v4 (TypeScript frontend)**. The application is designed to run locally on a single user's workstation with a local SQLite database (`flow.db`). 

When running outside the Tauri runtime (e.g., standard browser development), the frontend falls back entirely to browser `localStorage` mock stores.

### Verified Stack & Dependency Baseline (File Evidence: `apps/desktop/package.json`)
- **Frontend Framework:** `react: ^19.0.0`, `react-dom: ^19.0.0` (React 19 verified; earlier documentation references to React 18 are superseded by repo package definition).
- **Routing & State:** `react-router-dom: ^7.0.0`, `zustand: ^5.0.0`.
- **Styling & Icons:** `tailwindcss: ^4.2.0`, `@tailwindcss/vite: ^4.2.0`, `lucide-react: ^0.460.0`, `framer-motion: ^11.0.0`.
- **Tooling & Build:** `vite: ^6.0.0`, `typescript: ^5.7.0`, `@vitejs/plugin-react: ^4.3.0`.
- **Desktop Runtime:** `@tauri-apps/api: ^2.0.0`, `@tauri-apps/cli: ^2.0.0`, Tauri v2 plugins (`dialog: ^2.6.0`, `process: ^2.3.1`, `shell: ^2.0.0`, `updater: ^2.10.0`).
- **Target Node.js Runtime for Web SaaS:** **Node.js 22 LTS (Active LTS in October 2026)**. Node.js 20 reached End-of-Life (April 2026) and is not used as the production baseline.

### Fundamental Architectural Realities
1. **Single-Tenant Desktop Architecture:** There is zero concept of user authentication, multi-tenancy, memberships, invitations, or organization isolation. The SQLite database schema contains a single `business_profile` table representing a single local company.
2. **Heavy Browser Mocking & State Divergence:** Key commercial workflows—specifically Quotations and Tabby BNPL—exist **exclusively in frontend browser memory / localStorage** and have **zero backend, database, or Rust representation**.
3. **Simulated Integrations:** Payment gateway flows (Tabby BNPL) and AI capabilities (Gemini / Laya) are client-side simulations utilizing randomized IDs, mock checkout cards, `setTimeout` status flippers, and `tokio::time::sleep` stubs.
4. **Desktop-Bound System Calls:** PDF generation directly invokes Windows Edge / Chrome executables via hardcoded paths in `C:\Program Files (x86)\...` through child process spawning (`Command::new`).
5. **Data Structure Fragility:** Invoices store complex business metadata (bank details, project scope, payment terms) by serializing raw JSON directly into the plain text `notes` database column. Furthermore, SQLite repositories drop tax and discount rates upon retrieval.

---

## 2. Codebase Structure & Technology Stack

```
InvoiceFlow/
├── apps/
│   └── desktop/
│       ├── package.json              # React 19, Tailwind v4, Vite 6, TS 5.7 dependencies
│       ├── src/                      # React 19 SPA frontend
│       │   ├── components/           # UI components, layout, modals, editors
│       │   ├── lib/                  # API bridge (api.ts), currency engine, Tabby mock
│       │   ├── stores/               # Zustand state stores (subscriptionStore, etc.)
│       │   ├── types/                # TypeScript domain models
│       │   └── views/                # Page views (Invoices, Quotations, Analytics, Settings)
│       └── src-tauri/                # Tauri v2 Rust desktop shell
│           ├── src/
│           │   ├── commands.rs       # Tauri IPC command handlers
│           │   ├── commands/         # Modular command modules (ai_commands.rs)
│           │   └── lib.rs            # Tauri application builder & plugin registration
│           └── Cargo.toml            # Desktop wrapper crate configuration
├── crates/                           # Modular Rust backend crates
│   ├── flow-core/                    # Domain models, Decimal types, stubbed AI service
│   ├── flow-invoice/                 # Invoice calculator, sequential number generator
│   ├── flow-pdf/                     # Headless browser print-to-pdf engine, HTML template
│   ├── flow-db/                      # SQLx SQLite migrations and repository layer
│   └── flow-analytics/               # Stubbed analytics & metrics calculation
├── MD/                               # PRD and reference specifications
├── docs/planning/                    # Production SaaS architecture and planning artifacts
├── Cargo.toml                        # Cargo workspace root
└── Cargo.lock                        # Cargo dependency lockfile
```

---

## 3. Deep-Dive Module-by-Module Audit

### 3.1. Authentication, Tenancy & Identity
* **Target PRD Requirements:** FR-01, FR-02, FR-03, AC-01.
* **Current Implementation:** **Non-Existent (0%)**.
* **Code Evidence:**
  - `crates/flow-db/src/migrations.rs` lines 4–42: Schema definitions for `business_profile`, `clients`, `invoices`, and `invoice_items` contain **zero** `organization_id`, `user_id`, or `tenant_id` foreign keys.
  - `apps/desktop/src-tauri/src/commands.rs`: Commands (`get_business_profile`, `save_business_profile`, `get_invoices`) accept no authentication context or tenant identifiers.
  - `apps/desktop/src/lib/api.ts` lines 27–42: `isTauri()` check determines whether to invoke unauthenticated local IPC or dump/read from `localStorage`.
* **Findings:**
  - The application assumes a single desktop operator with physical control of the machine.
  - Multi-tenancy cannot be layered on top of the current schema without a complete data architecture overhaul.

---

### 3.2. Quotations & Lifecycle Management
* **Target PRD Requirements:** FR-19, FR-20, FR-21, FR-22, FR-23, FR-24, AC-02.
* **Current Implementation:** **100% Frontend Mock (localStorage only)**.
* **Code Evidence:**
  - `apps/desktop/src/views/Quotations.tsx` lines 45–120: Quotations are managed via React state initialized from `api.getQuotations()`.
  - `apps/desktop/src/lib/api.ts` lines 145–185:
    ```typescript
    getQuotations: async (): Promise<Quotation[]> => {
      const data = localStorage.getItem('invoiceflow_quotations');
      return data ? JSON.parse(data) : [];
    },
    saveQuotation: async (quotation: Quotation): Promise<Quotation> => {
      // Writes directly to localStorage
    }
    ```
  - `crates/flow-db/src/migrations.rs`: There is **no table** for quotations, quotation items, or quotation revisions in SQLite.
  - Quotation-to-Invoice conversion (`Quotations.tsx` line 210): Creates an invoice draft in `localStorage` or SQLite, then updates the local quotation status string to `'Converted'`. There is no backend transaction, no foreign key constraint, no revision snapshot, and no idempotency guard against concurrent conversion.

---

### 3.3. Invoicing, Numbering & Immutability
* **Target PRD Requirements:** FR-25, FR-26, FR-27, FR-28, FR-29, FR-30, AC-03, AC-04.
* **Current Implementation:** **Partial & Defective (Desktop SQLite)**.
* **Code Evidence:**
  - **Sequential Number Generator Flaw:** `crates/flow-invoice/src/number_generator.rs` lines 18–35:
    ```rust
    pub fn generate_number(prefix: &str, current_count: u32) -> String {
        let year = Utc::now().year();
        format!("{}-{}-{:05}", prefix, year, current_count + 1)
    }
    ```
    The invoice number is generated using `current_count + 1`. This is completely prone to race conditions, duplicates under concurrent requests, gaps when invoices are deleted, and reuse of numbers.
  - **Numbering Realities & Gaps:** Transactional sequence allocation with PostgreSQL advisory locks prevents concurrent duplicate collisions. However, advisory locks alone do not guarantee legally gapless numbering because aborted draft issuances or rolled-back transactions consume sequence numbers. Per PRD FR-27, gapless numbering is not promised by default.
  - **Snapshot Absence:** When an invoice is saved (`crates/flow-db/src/invoices.rs`), only mutable references are stored. If client details (name, tax ID, address) or company settings change later, re-rendering an existing invoice pulls the updated business details from the live profile! There is no immutable issued-document snapshot table.
  - **Database Repository Data Loss:** In `crates/flow-db/src/invoices.rs`, line items are parsed, but tax rate components and line discounts are flattened or ignored in query mapping, losing calculation granularity.
  - **Notes Column Abuse:** `apps/desktop/src/components/InvoiceEditor.tsx` serializes custom developer bank details and project metadata into a JSON string embedded inside the single `notes` text column of the invoice record.

---

### 3.4. Financial Calculations & Currency Arithmetic
* **Target PRD Requirements:** FR-14, FR-15, FR-16, FR-17, FR-18, AC-05, AC-08.
* **Current Implementation:** **Mixed (Rust Decimal vs. Frontend Float)**.
* **Code Evidence:**
  - **Backend:** `crates/flow-invoice/src/calculator.rs` uses `rust_decimal::Decimal`. It handles basic decimal rounding for unit rate * quantity - discount + tax.
  - **Frontend:** `apps/desktop/src/components/InvoiceEditor.tsx` and `apps/desktop/src/lib/currencies.ts` calculate previews and totals using native JavaScript floating-point numbers (`number`), introducing potential IEEE 754 precision errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
  - **Currency Scale Assumptions:** Both frontend and backend assume standard 2-decimal scaling. They fail to account for 0-decimal currencies (JPY) and 3-decimal currencies (KWD, BHD, OMR), violating ISO 4217 specifications.
  - **Static Hardcoded FX Rates:** `apps/desktop/src/lib/currencies.ts` lines 15–40 contains hardcoded static exchange rates against USD:
    ```typescript
    export const EXCHANGE_RATES: Record<string, number> = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      AED: 3.67,
      SAR: 3.75,
      INR: 83.12,
    };
    ```
  - `apps/desktop/src/lib/analyticsEngine.ts` automatically converts all historical invoices to a single selected currency using these static exchange rates, violating PRD FR-56 ("Show original-currency reports first. Never sum USD and INR as if they were one currency. Reporting conversion stores rate, source, effective date...").

---

### 3.5. PDF Engine & Templates
* **Target PRD Requirements:** FR-31, FR-32, FR-33, FR-34, FR-36, AC-13.
* **Current Implementation:** **Platform-Dependent Desktop Hack**.
* **Code Evidence:**
  - `crates/flow-pdf/src/lib.rs` lines 42–85:
    ```rust
    // Hardcoded Windows executable paths
    let possible_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    ];
    ```
    The engine spawns a local browser process via CLI flags (`--headless`, `--print-to-pdf`). This completely fails on Linux, Docker containers, serverless environments, or cloud VM hosts where Edge is absent.
  - `crates/flow-pdf/src/template.rs`: Contains a monolithic HTML string generator. It lacks support for RTL (Arabic, Hebrew) bidirectional layout text shaping, non-Latin font embedding (Malayalam, Devanagari), and page break controls for multi-page tables.
  - Dummy HTML Generator: `crates/flow-pdf/src/lib.rs` line 25 contains a stub `generate_invoice_pdf` that renders dummy mock HTML instead of connecting to `template.rs`.

---

### 3.6. QR Code Generation
* **Target PRD Requirements:** FR-34, AC-13.
* **Current Implementation:** **Fabricated / Decorative Mock (Violation of PRD FR-34)**.
* **Code Evidence:**
  - `apps/desktop/src/components/PaymentLinkModal.tsx` lines 112–148:
    ```typescript
    // Generates a fake pseudo-random SVG pattern based on string hash
    const generateFakeQR = (text: string) => {
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      // Renders decorative black and white rects
    };
    ```
  - The QR code displayed to users is **not a valid 2D barcode**. It cannot be scanned by banking apps (UPI, EPC-QR, Swiss QR, or mobile browsers). This directly violates PRD FR-34 ("Never display a decorative or fabricated payment QR").

---

### 3.7. Payment Collection, Gateways & Reconciliation
* **Target PRD Requirements:** FR-42 through FR-50, AC-06, AC-07.
* **Current Implementation:** **Pure Simulation / Mocks**.
* **Code Evidence:**
  - **Tabby BNPL:** `apps/desktop/src/lib/tabby.ts` and `apps/desktop/src/views/PaymentLinkView.tsx`:
    - Generates a dummy checkout ID prefixed with `tabby_mock_`.
    - Splits the invoice total into 4 installments purely on the client side.
  - **Instant Payment Simulator:** In `PaymentLinkView.tsx` lines 180–205:
    - Clicking the Tabby button or "Confirm Transfer" triggers a `setTimeout` for 1500ms.
    - Upon timeout, it calls `api.updateInvoiceStatus(invoice.id, 'Paid')`!
    - An unpaid invoice is marked `Paid` in the local database with **zero bank confirmation, zero webhook validation, and zero financial transaction record**.
  - **No Partial Payments or Allocations:** The database schema has no `payments`, `payment_allocations`, or `reversals` tables. An invoice status is simply an enum string (`Draft`, `Sent`, `Paid`, `Overdue`).

---

### 3.8. SaaS Subscriptions vs. Tenant Invoicing
* **Target PRD Requirements:** FR-42, FR-59, FR-60, FR-61, FR-62, FR-63, FR-64, AC-10.
* **Current Implementation:** **Client-Side Mock Store with Contradictory Tier Model**.
* **Code Evidence:**
  - `apps/desktop/src/stores/subscriptionStore.ts` lines 10–65:
    - Implements a client-side Zustand store with three hardcoded tiers:
      * Starter ($19/mo)
      * Pro ($49/mo)
      * Enterprise ($99/mo)
    - Directly violates PRD Section 16 & FR-59 ("The platform sells one subscription plan with monthly and yearly billing").
    - License validation: Checks if user-entered string starts with `IF-` and sets `status = 'active'`.
    - No server entitlement verification, no billing provider integration (Stripe Billing / LemonSqueezy / Paddle), and no quota tracking.

---

### 3.9. AI Assistant (Laya / Gemini)
* **Target PRD Requirements:** FR-65 through FR-72, AC-12.
* **Current Implementation:** **Asynchronous Sleep Stub & Hardcoded Strings**.
* **Code Evidence:**
  - `crates/flow-core/src/ai_service.rs` lines 22–50:
    ```rust
    pub async fn query_ai(prompt: &str) -> Result<String, FlowError> {
        tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;
        Ok(format!("Simulated AI response for: {}", prompt))
    }
    ```
  - `apps/desktop/src-tauri/src/commands/ai_commands.rs`: Exposes `ai_suggest_line_items` and `ai_parse_receipt` returning hardcoded JSON structs.
  - `apps/desktop/src/views/AIAssistantView.tsx`: Frontend chat interface talking to the simulated backend command.
  - **Unverified Status:** Neither quantized local Laya checkpoints nor Gemini live connections are deployed or benchmarked. Laya must remain an optional, advisory component with strict manual fallbacks and no autonomous write authority.

---

### 3.10. Analytics & Reporting
* **Target PRD Requirements:** FR-55, FR-56, FR-57, FR-58, AC-05, AC-08.
* **Current Implementation:** **Frontend In-Memory Approximation / Backend Stub**.
* **Code Evidence:**
  - `crates/flow-analytics/src/lib.rs`: Exposes `get_revenue_metrics` which returns `RevenueMetrics::default()` (all zeros). Mentions DuckDB in comments, but DuckDB is not linked or implemented.
  - `apps/desktop/src/lib/analyticsEngine.ts`: Pulls all invoices from `localStorage`/Tauri, sums numbers in memory, ignores payment allocations (since payments don't exist), and blurs invoiced accruals with cash collection.

---

## 4. Comprehensive Artifact & Code Evidence Matrix

| Module | PRD Requirements | Actual Code Implementation Status | Primary Files & Evidence | Architectural Risk Level |
|---|---|---|---|---|
| **Auth & Tenancy** | FR-01, FR-02, FR-03 | **Zero (0%)** | `crates/flow-db/src/migrations.rs:4-42`<br>`apps/desktop/src/lib/api.ts:27` | **CRITICAL** (Requires ground-up multi-tenant schema & verified session auth) |
| **Org Settings** | FR-04 - FR-08 | **Single-Tenant Local Only** | `crates/flow-db/src/business.rs`<br>`apps/desktop/src/views/SettingsView.tsx` | **HIGH** (Settings mutate globally; no historical snapshotting) |
| **Clients & Catalog** | FR-09 - FR-13 | **Partial (Single-tenant)** | `crates/flow-db/src/clients.rs`<br>`apps/desktop/src/components/ClientModal.tsx` | **MEDIUM** (Missing formula escaping in CSV, catalog lacks versioning) |
| **Calculations** | FR-14 - FR-18 | **Fragmented** | `crates/flow-invoice/src/calculator.rs`<br>`apps/desktop/src/lib/currencies.ts:15` | **HIGH** (Frontend float calculations diverge from backend Decimal; scale unaware) |
| **Quotations** | FR-19 - FR-24 | **100% Mock (localStorage)** | `apps/desktop/src/views/Quotations.tsx:45`<br>`apps/desktop/src/lib/api.ts:145-185` | **CRITICAL** (Completely absent from database & backend) |
| **Invoicing & Numbering** | FR-25 - FR-30 | **Defective Desktop** | `crates/flow-invoice/src/number_generator.rs:18`<br>`crates/flow-db/src/invoices.rs` | **CRITICAL** (Race-condition numbering, notes column abused, no snapshots) |
| **PDF & Templates** | FR-31 - FR-36 | **Windows Desktop Hack** | `crates/flow-pdf/src/lib.rs:42`<br>`crates/flow-pdf/src/template.rs` | **CRITICAL** (Hardcoded Edge CLI paths fail on cloud servers) |
| **QR Generation** | FR-34 | **Decorative Fake** | `apps/desktop/src/components/PaymentLinkModal.tsx:112` | **HIGH** (Direct violation of PRD FR-34; non-functional barcode) |
| **Bank Details** | FR-37 - FR-41 | **Partial / Insecure** | `apps/desktop/src/components/InvoiceEditor.tsx`<br>`crates/flow-db/src/business.rs` | **HIGH** (Bank details stored in settings or serialized in invoice notes) |
| **Payments & Allocations** | FR-42 - FR-50 | **Simulated (setTimeout)** | `apps/desktop/src/views/PaymentLinkView.tsx:180`<br>`apps/desktop/src/lib/tabby.ts` | **CRITICAL** (No ledger, no webhooks, simulated payment flippers) |
| **Reminders** | FR-51 - FR-54 | **Non-Existent (0%)** | `apps/desktop/src/views/InvoicesView.tsx` | **MEDIUM** (No queue, no SMTP/SendGrid integration) |
| **Analytics** | FR-55 - FR-58 | **Stub / Hardcoded Rates** | `crates/flow-analytics/src/lib.rs`<br>`apps/desktop/src/lib/analyticsEngine.ts` | **HIGH** (Combines multiple currencies using static FX rates) |
| **SaaS Subscriptions** | FR-59 - FR-64 | **Mock 3-Tier Store** | `apps/desktop/src/stores/subscriptionStore.ts:10` | **CRITICAL** (Contradicts single-plan PRD; purely client-side dummy) |
| **Laya / AI Assistant** | FR-65 - FR-72 | **Stub (sleep & mock)** | `crates/flow-core/src/ai_service.rs:22`<br>`apps/desktop/src-tauri/src/commands/ai_commands.rs` | **HIGH** (Unverified model, no safety verification gate, purely advisory) |

---

## 5. Architectural Verdict: Rebuild vs. Refactor Recommendation

### Modules to Rebuild from Scratch
1. **Multi-Tenant Identity & Authorization:** Must be built ground-up in PostgreSQL with Row-Level Security (RLS) and verified session authentication.
2. **Quotation System:** Full backend implementation with revisions, acceptance tokens, and atomic conversion.
3. **Numbering Engine:** Atomic sequence generator utilizing PostgreSQL advisory locks per organization and financial year.
4. **Payment & Reconciliation Ledger:** Complete double-entry style ledger supporting partial payments, allocations, reversals, and webhook idempotency.
5. **PDF Rendering Service:** Headless containerized Chromium / Puppeteer microservice for cloud execution.
6. **SaaS Subscription Billing:** Single-plan Stripe Billing integration completely isolated from client invoice payments.
7. **Laya Inference Adapter:** Private backend service with strict classification schema, bounded timeout, and human-in-the-loop review.

### Components Suitable for Reuse & Refactoring
1. **Frontend UI Components & Design System:** The React 19 + Tailwind CSS v4 components, layout structure, datepickers, modal flows, and Lucide icon integration in `apps/desktop/src/components/` and `views/` are well-structured, visually polished, and highly reusable.
2. **Core Domain Models (`flow-core`):** The Rust structs (`Invoice`, `Client`, `LineItem`, `TaxRate`) and Decimal calculation logic (`flow-invoice/calculator.rs`) provide solid domain modeling reference that will be ported to exact Decimal TypeScript classes with ISO 4217 currency scale awareness.
3. **Client & Catalog UI Forms:** Client creation, address formatting, and catalog selection modals can be reused with minimal modifications to point to authenticated REST endpoints.

---

## 6. Audit Conclusion & Immediate Directives

The existing codebase is a **functional proof-of-concept for a single-user Windows desktop app on React 19**, but contains **no multi-tenant SaaS infrastructure**. Key commercial features claimed in the UI are simulated or stored in browser `localStorage`. 

Transitioning to production SaaS requires:
1. Transitioning from local SQLite to cloud-native **PostgreSQL with RLS**, separating migration privileges from runtime app privileges.
2. Building an **authenticated server API gateway** on **Node.js 22 LTS** with verified session authorization.
3. Replacing browser `localStorage` mocks with **transaction-safe database tables and APIs**.
4. Implementing a **server-side containerized PDF engine** and **scan-tested QR code generator**.
5. Establishing a **real payment ledger and verified webhook ingestion pipeline**.
