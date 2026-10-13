# InvoiceFlow — consolidated project memory

Last consolidated: 12 October 2026. Start here when restoring this conversation. This records confirmed requirements, engineering recommendations, completed work and open questions separately. Source code and fresh checks take precedence over older completion claims.

## Owner and development context
- Owner: Mohammed Jabir, based in India. Beginner without coding/industry experience; develops through Codex with agent assistance. Explain decisions and outcomes in Malayalam, with familiar technical English terms.
- Product is intended for paying businesses/freelancers, initially Indian customers and also GCC businesses. Merchant incorporation country and first GCC jurisdiction are still unconfirmed.
- Repository: https://github.com/MohammedJabir18/InvoiceFlow ; local folder: /home/jabir/Coding/My Projects/InvoiceFlow.
- This Codex conversation now works in the actual repository. Earlier chat setup files were under /home/jabir/Documents/Codex/2026-10-10/new-chat.
- Preserve existing user changes. Numerous tracked paths have pre-existing line-ending differences; do not reset or bulk-stage them.

## Confirmed product requirements
- Sell a production-quality multi-tenant web SaaS, retaining useful existing desktop code.
- Authentication/sign-in, business onboarding, dashboard, clients, quotations, invoices, templates, financial/client analytics and settings.
- Each subscribing business has its own workspace and data. The business paying the SaaS subscription and the customer receiving an invoice are distinct entities.
- One subscription plan with monthly/yearly billing. Existing desktop three-tier/offline licensing is legacy behavior and does not define the new SaaS plan.
- Company and bank/payment details configurable per business; payment automation and QR support desired.
- Country, currency, locale/document language and timezone configurable for international use.
- Dashboard should be minimal and easy to understand, with detail available on demand and daily/monthly/yearly filters.
- All sections must connect through actual underlying records: clients -> quotations -> invoices -> payments -> dashboard.
- INITIAL TEMPLATE SCOPE: use the existing two or three built-in invoice templates, with selection and editing/customization. User-created templates and a template builder are excluded from the first release. The exact editable fields still need definition.
- Optional AI integration specifically refers to https://github.com/nandhakishorm/laya.
- Security, maintainability, scaling and financial correctness are primary goals. Zero bugs cannot be promised; require evidence, monitoring and recoverability.

## Research recommendations (not automatically approved product design)
- Quote draft/sent/accepted/declined/expired; conversion links an invoice draft to the accepted quote revision and copies terms. Keep acceptance and conversion states separate. Allow direct invoices too.
- Initial one-quote/one-invoice conversion is a recommendation; deposits/progress billing remains undecided. Make conversion transactional and retry-safe, with duplicate guards.
- Issued invoices retain company/client/item/money/currency/template snapshots and reproducible PDFs. Later settings/template edits must not rewrite history. Define correction/credit workflows by jurisdiction.
- Calculate money server-side using exact decimals; define currency precision, rounding, discount/tax order and numbering. Never use one universal tax rate.
- Dashboard suggestions: net invoiced, received, outstanding, overdue. Define issue-date vs payment-date vs as-of semantics; quotes are not collected sales; separate currencies unless an explicit FX policy exists. Do not claim profit without corresponding expense/accounting data.
- SaaS subscription payments and customers' invoice payments are separate funds/workflows. Merchant onboarding and verified provider events are needed. QR display or a customer claim does not prove payment; signatures, idempotency and reconciliation matter.
- India, UAE, Saudi and other GCC states have distinct tax/e-invoicing rules. A PDF and payment QR do not themselves establish statutory e-invoice compliance. Country support must be verified individually.

## Laya findings and boundaries
- Laya is a non-autoregressive typed choice/score/yes-no decision engine, with routing across checkpoints. It is not a general chat/text-generation, OCR or arithmetic engine.
- Potential use: allowlisted intent selection, message triage, selecting a permitted dashboard filter/action. Extracting arbitrary dates/IDs/amounts needs separate validated logic.
- Backend enforces authentication, tenancy and permissions before data access; AI never decides access, payment truth, tax applicability or financial calculations.
- Changes require user action/confirmation and normal server validation; low confidence/timeouts have manual fallback. Core invoicing remains usable without AI.
- Proposed deployment: optional private authenticated Python HTTP service behind the API, pinned checkpoint/version, bounded timeouts and minimal inputs.
- Evaluate with real English/Malayalam/Arabic/code-mixed domain inputs and negation. Repository benchmark headlines are not product accuracy proof; model inference/quality evaluation was not run here.
- Sources/research: docs/planning/2026-10-10-connected-invoicing-research.md; earlier detailed report at /home/jabir/Documents/Codex/2026-10-10/new-chat/outputs/invoice-flow-laya-research.md.

## Completed foundation work
- Local commit 4b33153: reproducible development foundation and isolated verification. No push made during this conversation.
- Persistent Node 24.21.0 LTS installed under ~/.local/share/invoiceflow-toolchains; Bun 1.4.3 confirmed; Rust/Cargo 1.99.0 installed in standard user directories. Bash PATH appended. scripts/dev-env.sh selects tools for repository commands.
- .nvmrc and root Node engine constraint added. Root npm lockfile repaired to include platform optional packages; separate desktop Bun frozen installation repaired Windows/Linux native mismatch.
- Vitest pinned to 4.1.11; root npm audit reported zero advisories after update.
- init.sh builds SaaS shared-types/db/API/web in order before type-checking, then desktop build and locked Rust workspace check. --saas supports SaaS-only build verification.
- npm test invokes scripts/test-api-local.sh: new disposable local PostgreSQL 18 cluster, restricted runtime role, explicit test settings, migrations and cleanup. Test mode skips .env loading; no hosted/prod database used.
- Missing rust_decimal workspace dependency added to flow-pdf; Cargo.lock retained for version control.
- Focused review identified and fixed clean-checkout build-order issue; final review found no remaining important findings in foundation scope.
- Verification recorded 12 October: full init PASS; clean copy npm ci + SaaS build/type-check PASS; 47 API tests across 3 files PASS; root npm audit 0. These are development-foundation results, not complete product/browser/production validation.
- Instructions: docs/development-setup.md. Evidence: ignored artifacts/foundation/ logs.
- Git identity configured locally using the supplied email and matching existing author Mohammed Jabir; no global identity configuration.

## Tooling history (historical status, verify availability before relying on it)
- MCP migration from Antigravity excluded Meta Ads. Listed additions: github, playwright, stitch, supabase, vercel, scrapling, graphify, chrome-devtools.
- Graphify uses /home/jabir/.venvs/graphify/bin/python -m graphify.serve. Playwright browser access succeeded after user installed browser support. GitHub/Stitch/Supabase/Vercel/Scrapling had basic successful calls earlier.
- Chrome DevTools previously had runtime/browser prerequisite problems. A historical stdio Auth Unsupported status means OAuth is not supported by that transport, not necessarily a broken server.
- Earlier Codex CLI was absent from shell PATH; desktop binary location was /usr/lib/chatgpt/resources/codex. Verify current setup when troubleshooting.
- User requested global skills from superpowers, loop-engineering, andrej-karpathy-skills, i-have-adhd, claude-octopus, learn-harness-engineering and archify; earlier setup reported global installation plus Claude Octopus plugin. Use only relevant skills.
- User's Antigravity MCP config path: /home/jabir/.gemini/config/mcp_config.json. Do not copy credential contents into brain notes.

## Remaining work / next session
1. Read this summary, sessions.md, architecture.md and feature_list.json, then run ./init.sh.
2. Completed Milestone: First customer journey (sign-in -> business workspace -> settings -> client management -> reload persistence -> sign out) fully implemented and verified via automated Playwright tests (scripts/test-e2e.sh) and API suite (66 tests).
3. Next recommended product milestone: Cloud Quotations and Invoices domain models & linking (feat-011).
4. Cloud invoices/quotations/payment endpoints and full domains need implementation; registered API route groups cover health, auth, organizations, members, clients.
5. Add CI/lint coverage, hosted auth/payment verification, monitoring/backups/restore, and launch gates.
6. Resolve gateway/merchant incorporation and initial country support, exact template edit fields, deposit/progress billing policy, plan price/quotas.
7. Laya integration/evaluation remains future work.
8. Refresh Graphify carefully: last update was interrupted; retained graph is old, analysis metadata stale.
9. Existing large-bundle and unused-code warnings are non-blocking but remain visible.

## Memory links
- [[sessions]] — chronological history; older blockers are superseded by latest foundation results.
- [[architecture]] — source-aligned current architecture and boundaries.
- [[architecture-history-2026-10-12]] — preserved earlier architecture notes with known stale/future assertions.
- ../docs/planning/2026-10-10-connected-invoicing-research.md — research sources and recommendations.
- ../docs/development-setup.md — reproducible commands.
