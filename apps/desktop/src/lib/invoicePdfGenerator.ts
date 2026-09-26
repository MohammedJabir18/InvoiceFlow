import { type FullInvoice, type ClientResponse, type InvoiceSummary } from "./api";
import { type BusinessProfile } from "../store/settingsStore";
import { formatMoney } from "./currencies";

export type PrintableInvoice = Partial<FullInvoice> & {
    subtotal?: string;
    tax_total?: string;
    discount_total?: string;
    notes?: string | null;
    payment_terms?: string;
};

function escapeHtml(text?: string | null): string {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function buildInvoiceHtml(
    invoice: PrintableInvoice,
    client?: ClientResponse | null,
    profile?: BusinessProfile | null
): string {
    const invNumber = invoice.number || "INV-PREVIEW";
    const issueDate = invoice.issue_date || new Date().toISOString().split("T")[0];
    const dueDate = invoice.due_date || "Upon Receipt";
    const currency = invoice.currency || profile?.default_currency || "INR";
    const status = invoice.status || "Draft";

    // 1. Parse Notes for Deep Metadata
    let parsedNotes: any = null;
    try {
        if (invoice.notes) {
            parsedNotes = typeof invoice.notes === "string" ? JSON.parse(invoice.notes) : invoice.notes;
        }
    } catch {
        parsedNotes = { internalNotes: invoice.notes };
    }

    // 2. Business Profile Details
    const businessName = profile?.name || parsedNotes?.developer || "InvoiceFlow Technologies";
    const businessTaxId = profile?.tax_id || parsedNotes?.taxId || "";
    const businessEmail = profile?.email || "billing@invoiceflow.io";
    const businessPhone = profile?.phone || "";
    const businessWebsite = profile?.website || "";
    const bAddr = profile?.address;
    const businessAddressStr = [bAddr?.line1, bAddr?.line2, bAddr?.city, bAddr?.state, bAddr?.postal_code, bAddr?.country]
        .filter(Boolean)
        .join(", ");
    const logoUrl = profile?.logo_url || parsedNotes?.logoPath || null;

    // 3. Client Details
    const clientName = client?.name || "Valued Client";
    const clientCompany = client?.company || "";
    const clientEmail = client?.email || "";
    const clientPhone = client?.phone || "";
    const clientTaxId = client?.tax_id || "";
    const cAddr = client?.address;
    const clientAddressStr = cAddr
        ? [cAddr.line1, cAddr.line2, cAddr.city, cAddr.state, cAddr.postal_code, cAddr.country].filter(Boolean).join(", ")
        : "";

    // 4. Line Items
    const rawItems = (invoice as FullInvoice).items || [
        {
            id: "item-1",
            invoice_id: invoice.id || "test",
            description: "Enterprise Cloud Infrastructure & Consultation",
            quantity: 1,
            unit_price: invoice.total || "1000.00",
            amount: invoice.total || "1000.00",
            sort_order: 0
        }
    ];

    const items = rawItems.map(item => ({
        description: item.description || "Services Rendered",
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        amount: Number(item.amount) || ((Number(item.quantity) || 1) * (Number(item.unit_price) || 0))
    }));

    // 5. Calculations
    const calculatedSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const subtotal = invoice.subtotal ? Number(invoice.subtotal) : calculatedSubtotal;

    let discountTotal = Number(invoice.discount_total || 0);
    let discountDesc = "";
    if (parsedNotes?.includeDiscount && discountTotal === 0) {
        const dVal = Number(parsedNotes.discountValue || 0);
        if (parsedNotes.discountType === "percentage") {
            discountTotal = (subtotal * dVal) / 100;
            discountDesc = `${dVal}%`;
        } else {
            discountTotal = dVal;
            discountDesc = "Fixed";
        }
    } else if (discountTotal > 0) {
        discountDesc = parsedNotes?.discountType === "percentage" ? `${parsedNotes.discountValue}%` : "Discount";
    }

    const taxableBase = Math.max(0, subtotal - discountTotal);

    let taxTotal = Number(invoice.tax_total || 0);
    let taxDesc = "";
    if (parsedNotes?.includeTax && taxTotal === 0) {
        const tRate = Number(parsedNotes.taxRate || 0);
        taxTotal = (taxableBase * tRate) / 100;
        taxDesc = `${tRate}%`;
    } else if (taxTotal > 0) {
        taxDesc = parsedNotes?.taxRate ? `${parsedNotes.taxRate}%` : "Statutory Tax";
    }

    const total = invoice.total ? Number(invoice.total) : (taxableBase + taxTotal);
    const isPaid = status.toLowerCase() === "paid";
    const amountPaid = isPaid ? total : Number(invoice.amount_paid || 0);
    const balanceDue = isPaid ? 0 : Math.max(0, total - amountPaid);

    // 6. Bank Details Fallback
    const bank = parsedNotes?.bankDetails || (profile?.bank_details ? {
        bankName: profile.bank_details.bank_name,
        accountHolder: profile.bank_details.account_holder,
        accountNumber: profile.bank_details.account_number,
        ifscCode: profile.bank_details.routing_number,
        branch: profile.bank_details.branch,
        upiId: profile.bank_details.upi_id
    } : null);

    // 7. QR Code URL or Dynamic Generation
    let qrUrl = parsedNotes?.qrCodeUrl || null;
    if (!qrUrl && bank?.upiId) {
        const upiString = `upi://pay?pa=${encodeURIComponent(bank.upiId)}&pn=${encodeURIComponent(businessName)}&am=${total.toFixed(2)}&cu=${currency}`;
        qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiString)}`;
    }

    // 8. Project Details Array
    const projectDetails = Array.isArray(parsedNotes?.projectDetails)
        ? parsedNotes.projectDetails.filter((p: any) => p && p.label && p.value)
        : [];

    // 9. Payment Terms Note & Terms
    const paymentTerms = invoice.payment_terms || parsedNotes?.paymentTermsNote || "Due on Receipt";
    const termsAndConditions = invoice.terms_and_conditions || parsedNotes?.termsAndConditions ||
        "1. Please include the invoice number on your payment transfer reference.\n2. Payment is due as per the terms specified above.\n3. Thank you for your valued partnership and business!";
    const internalNotes = parsedNotes?.internalNotes || (typeof invoice.notes === "string" && !invoice.notes.startsWith("{") ? invoice.notes : null);

    const docType = isPaid ? "PAYMENT RECEIPT &amp; TAX INVOICE" : "TAX INVOICE";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docType} #${escapeHtml(invNumber)} - ${escapeHtml(businessName)}</title>
    <style>
        :root {
            --primary: #1e40af;
            --primary-accent: #2563eb;
            --emerald: #059669;
            --text-main: #0f172a;
            --text-muted: #475569;
            --text-light: #64748b;
            --border-color: #e2e8f0;
            --bg-subtle: #f8fafc;
            --bg-highlight: #eff6ff;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: var(--text-main);
            background: #e2e8f0;
            padding: 24px 16px;
            font-size: 13px;
            line-height: 1.5;
        }
        .action-bar {
            max-width: 850px;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .action-bar .brand-badge {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
        }
        .action-bar .brand-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 10px #10b981;
        }
        .action-bar button {
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.15s ease;
        }
        .action-bar button:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
        }
        .invoice-card {
            max-width: 850px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 14px;
            box-shadow: 0 15px 35px -5px rgba(0,0,0,0.08);
            padding: 44px 48px;
            border: 1px solid var(--border-color);
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 28px;
            margin-bottom: 28px;
        }
        .logo-wrap {
            max-width: 220px;
            max-height: 60px;
            margin-bottom: 12px;
        }
        .logo-wrap img {
            max-width: 100%;
            max-height: 60px;
            object-fit: contain;
        }
        .company-name {
            font-size: 22px;
            font-weight: 800;
            color: var(--text-main);
            letter-spacing: -0.02em;
        }
        .meta-line {
            color: var(--text-muted);
            font-size: 12px;
            margin-top: 3px;
            line-height: 1.4;
        }
        .meta-line strong {
            color: var(--text-main);
        }
        .inv-title-col {
            text-align: right;
        }
        .inv-main-title {
            font-size: 26px;
            font-weight: 900;
            color: var(--primary);
            letter-spacing: -0.03em;
            text-transform: uppercase;
        }
        .status-seal {
            display: inline-block;
            margin-top: 6px;
            margin-bottom: 10px;
            padding: 4px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .status-seal.paid {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .status-seal.pending {
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fcd34d;
        }
        .status-seal.overdue {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }
        .status-seal.draft {
            background: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
        }

        .inv-meta-table {
            margin-left: auto;
            border-collapse: collapse;
            font-size: 12px;
            margin-top: 8px;
        }
        .inv-meta-table td {
            padding: 2px 6px;
            text-align: right;
        }
        .inv-meta-table td.label {
            color: var(--text-light);
            font-weight: 500;
        }
        .inv-meta-table td.val {
            font-weight: 700;
            color: var(--text-main);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        /* 2-Column Addresses */
        .two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin-bottom: 28px;
        }
        .section-box {
            background: var(--bg-subtle);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 16px 18px;
        }
        .section-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-light);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .section-box .client-name {
            font-size: 15px;
            font-weight: 800;
            color: var(--text-main);
        }
        .section-box p {
            color: var(--text-muted);
            font-size: 12px;
            margin-top: 2px;
            line-height: 1.45;
        }

        /* Project / Specification Strip */
        .project-strip {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            background: var(--bg-highlight);
            border: 1px solid #bfdbfe;
            border-radius: 10px;
            padding: 12px 18px;
            margin-bottom: 24px;
        }
        .project-item strong {
            display: block;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--primary);
        }
        .project-item span {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-main);
        }

        /* Items Table */
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        table.items-table thead th {
            background: #1e293b;
            color: #f8fafc;
            padding: 10px 14px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border: none;
        }
        table.items-table thead th:first-child {
            border-top-left-radius: 8px;
        }
        table.items-table thead th:last-child {
            border-top-right-radius: 8px;
        }
        table.items-table td {
            padding: 12px 14px;
            border-bottom: 1px solid var(--border-color);
            font-size: 12.5px;
            vertical-align: top;
        }
        table.items-table tr:nth-child(even) td {
            background-color: #fafbfc;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

        /* Totals */
        .bottom-grid {
            display: grid;
            grid-template-columns: 1fr 340px;
            gap: 28px;
            margin-bottom: 28px;
        }
        .totals-card {
            background: var(--bg-subtle);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 16px 20px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 12.5px;
            color: var(--text-muted);
        }
        .totals-row strong {
            color: var(--text-main);
        }
        .totals-row.discount {
            color: var(--emerald);
            font-weight: 600;
        }
        .totals-row.tax {
            color: var(--text-main);
        }
        .totals-row.grand-total {
            border-top: 2px solid var(--text-main);
            margin-top: 8px;
            padding-top: 10px;
            font-size: 18px;
            font-weight: 900;
            color: var(--primary);
        }
        .totals-row.balance-due {
            border-top: 1px dashed var(--border-color);
            margin-top: 6px;
            padding-top: 6px;
            font-size: 14px;
            font-weight: 800;
            color: ${isPaid ? "var(--emerald)" : "var(--primary)"};
        }

        /* Payment & Bank Details */
        .bank-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 28px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
        }
        .bank-info h4 {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #166534;
            margin-bottom: 8px;
        }
        .bank-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            gap: 10px 16px;
            font-size: 11.5px;
        }
        .bank-grid div strong {
            display: block;
            font-size: 9.5px;
            text-transform: uppercase;
            color: #15803d;
            letter-spacing: 0.04em;
        }
        .bank-grid div span {
            font-weight: 700;
            color: #0f172a;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .qr-section {
            text-align: center;
            flex-shrink: 0;
        }
        .qr-section img {
            width: 90px;
            height: 90px;
            border-radius: 8px;
            border: 1px solid #bbf7d0;
            background: #ffffff;
            padding: 4px;
        }
        .qr-section span {
            display: block;
            font-size: 9.5px;
            color: #166534;
            font-weight: 700;
            margin-top: 4px;
            text-transform: uppercase;
        }

        /* Terms & Notes */
        .terms-notes-box {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
            margin-bottom: 24px;
        }
        .terms-notes-box h5 {
            font-size: 10.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-light);
            margin-bottom: 6px;
        }
        .terms-notes-box p {
            font-size: 11.5px;
            color: var(--text-muted);
            line-height: 1.5;
            white-space: pre-line;
        }

        /* Signatory */
        .signatory-row {
            display: flex;
            justify-content: flex-end;
            padding-top: 16px;
            margin-bottom: 20px;
        }
        .signatory-box {
            width: 240px;
            text-align: center;
            border-top: 1px solid var(--text-main);
            padding-top: 8px;
        }
        .signatory-box .title {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-main);
        }
        .signatory-box .comp {
            font-size: 10px;
            color: var(--text-light);
        }

        /* Footer */
        .doc-footer {
            border-top: 1px solid var(--border-color);
            padding-top: 16px;
            text-align: center;
            font-size: 11px;
            color: var(--text-light);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        /* Print Media Styles */
        @media print {
            body {
                background: #ffffff !important;
                padding: 0 !important;
            }
            .action-bar, .no-print {
                display: none !important;
            }
            .invoice-card {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
                border-radius: 0 !important;
            }
            @page {
                size: A4 portrait;
                margin: 12mm 15mm;
            }
        }
    </style>
</head>
<body>
    <div class="action-bar no-print">
        <div class="brand-badge">
            <span class="brand-dot"></span>
            <strong>InvoiceFlow</strong>
            <span style="opacity: 0.7;">Official Tax Document Engine</span>
        </div>
        <button onclick="window.print()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save as PDF
        </button>
    </div>

    <div class="invoice-card">
        <!-- Header -->
        <div class="header">
            <div>
                ${logoUrl ? `
                <div class="logo-wrap">
                    <img src="${logoUrl}" alt="${escapeHtml(businessName)} Logo" />
                </div>
                ` : ""}
                <div class="company-name">${escapeHtml(businessName)}</div>
                ${businessTaxId ? `<p class="meta-line"><strong>Tax ID / GSTIN:</strong> ${escapeHtml(businessTaxId)}</p>` : ""}
                ${businessAddressStr ? `<p class="meta-line">${escapeHtml(businessAddressStr)}</p>` : ""}
                ${businessEmail ? `<p class="meta-line">Email: <strong>${escapeHtml(businessEmail)}</strong> ${businessPhone ? "• Tel: <strong>" + escapeHtml(businessPhone) + "</strong>" : ""}</p>` : ""}
                ${businessWebsite ? `<p class="meta-line">Web: ${escapeHtml(businessWebsite)}</p>` : ""}
            </div>

            <div class="inv-title-col">
                <div class="inv-main-title">${docType}</div>
                <div>
                    <span class="status-seal ${status.toLowerCase()}">
                        ${isPaid ? "✓ PAID &amp; SETTLED" : status.toLowerCase() === "overdue" ? "⚠ OVERDUE" : status.toLowerCase() === "draft" ? "DRAFT" : "PAYMENT DUE"}
                    </span>
                </div>
                <table class="inv-meta-table">
                    <tr>
                        <td class="label">Invoice No:</td>
                        <td class="val">#${escapeHtml(invNumber)}</td>
                    </tr>
                    <tr>
                        <td class="label">Issue Date:</td>
                        <td class="val">${escapeHtml(issueDate)}</td>
                    </tr>
                    <tr>
                        <td class="label">Due Date:</td>
                        <td class="val">${escapeHtml(dueDate)}</td>
                    </tr>
                    <tr>
                        <td class="label">Payment Terms:</td>
                        <td class="val">${escapeHtml(paymentTerms)}</td>
                    </tr>
                    <tr>
                        <td class="label">Currency:</td>
                        <td class="val">${escapeHtml(currency)}</td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- 2-Columns: Billed To and Payment Summary -->
        <div class="two-cols">
            <div class="section-box">
                <div class="section-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Billed To (Client)
                </div>
                <div class="client-name">${escapeHtml(clientName)}</div>
                ${clientCompany ? `<p><strong>${escapeHtml(clientCompany)}</strong></p>` : ""}
                ${clientAddressStr ? `<p>${escapeHtml(clientAddressStr)}</p>` : ""}
                ${clientTaxId ? `<p style="margin-top: 4px;"><strong>Tax ID / VAT:</strong> ${escapeHtml(clientTaxId)}</p>` : ""}
                ${clientEmail ? `<p>Email: ${escapeHtml(clientEmail)} ${clientPhone ? "• Tel: " + escapeHtml(clientPhone) : ""}</p>` : ""}
            </div>

            <div class="section-box">
                <div class="section-title">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                    Settlement Status
                </div>
                <p>Payment Method: <strong>Wire Transfer / Instant UPI</strong></p>
                <p>Status: <strong style="color: ${isPaid ? 'var(--emerald)' : 'var(--primary)'};">${escapeHtml(status)}</strong></p>
                <p>Terms: <strong>${escapeHtml(paymentTerms)}</strong></p>
                ${isPaid ? `<p style="color: var(--emerald); font-weight: 700; margin-top: 4px;">✓ Settled in Full</p>` : `<p style="color: #b45309; font-weight: 600; margin-top: 4px;">Due by ${escapeHtml(dueDate)}</p>`}
            </div>
        </div>

        ${projectDetails.length > 0 ? `
        <div class="project-strip">
            ${projectDetails.map((p: any) => `
            <div class="project-item">
                <strong>${escapeHtml(p.label)}</strong>
                <span>${escapeHtml(p.value)}</span>
            </div>
            `).join("")}
        </div>
        ` : ""}

        <!-- Line Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;" class="text-center">#</th>
                    <th style="width: 55%;">Description</th>
                    <th style="width: 12%;" class="text-center">Qty</th>
                    <th style="width: 14%;" class="text-right">Unit Price</th>
                    <th style="width: 14%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map((item, idx) => `
                <tr>
                    <td class="text-center font-mono" style="color: var(--text-light);">${idx + 1}</td>
                    <td>
                        <strong style="color: var(--text-main);">${escapeHtml(item.description)}</strong>
                    </td>
                    <td class="text-center font-mono">${item.quantity}</td>
                    <td class="text-right font-mono">${formatMoney(item.unit_price, currency, currency, { convert: false })}</td>
                    <td class="text-right font-mono" style="font-weight: 700; color: var(--text-main);">${formatMoney(item.amount, currency, currency, { convert: false })}</td>
                </tr>
                `).join("")}
            </tbody>
        </table>

        <!-- Bottom Grid: Left Notes & Right Financials -->
        <div class="bottom-grid">
            <div>
                ${internalNotes ? `
                <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px 14px; margin-bottom: 12px;">
                    <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-light); margin-bottom: 4px;">Special Instructions &amp; Notes</div>
                    <p style="font-size: 11.5px; color: var(--text-muted); line-height: 1.45;">${escapeHtml(internalNotes)}</p>
                </div>
                ` : ""}
            </div>

            <div class="totals-card">
                <div class="totals-row">
                    <span>Subtotal</span>
                    <span class="font-mono"><strong>${formatMoney(subtotal, currency, currency, { convert: false })}</strong></span>
                </div>

                ${discountTotal > 0 ? `
                <div class="totals-row discount">
                    <span>Discount ${discountDesc ? `(${escapeHtml(discountDesc)})` : ""}</span>
                    <span class="font-mono">-${formatMoney(discountTotal, currency, currency, { convert: false })}</span>
                </div>
                <div class="totals-row">
                    <span>Net Taxable Base</span>
                    <span class="font-mono">${formatMoney(taxableBase, currency, currency, { convert: false })}</span>
                </div>
                ` : ""}

                ${taxTotal > 0 ? `
                <div class="totals-row tax">
                    <span>Tax / VAT / GST ${taxDesc ? `(${escapeHtml(taxDesc)})` : ""}</span>
                    <span class="font-mono">+${formatMoney(taxTotal, currency, currency, { convert: false })}</span>
                </div>
                ` : ""}

                <div class="totals-row grand-total">
                    <span>Total Amount</span>
                    <span class="font-mono">${formatMoney(total, currency, currency, { convert: false })}</span>
                </div>

                ${amountPaid > 0 ? `
                <div class="totals-row" style="color: var(--emerald); font-weight: 600; padding-top: 6px;">
                    <span>Amount Settled / Paid</span>
                    <span class="font-mono">${formatMoney(amountPaid, currency, currency, { convert: false })}</span>
                </div>
                ` : ""}

                <div class="totals-row balance-due">
                    <span>Balance Due</span>
                    <span class="font-mono">${formatMoney(balanceDue, currency, currency, { convert: false })}</span>
                </div>
            </div>
        </div>

        <!-- Bank & Payment Transfer Instructions -->
        ${bank ? `
        <div class="bank-box">
            <div class="bank-info">
                <h4>Payment Instructions &amp; Bank Details</h4>
                <div class="bank-grid">
                    ${bank.bankName ? `<div><strong>Bank Name</strong><span>${escapeHtml(bank.bankName)}</span></div>` : ""}
                    ${bank.branch ? `<div><strong>Branch</strong><span>${escapeHtml(bank.branch)}</span></div>` : ""}
                    ${bank.accountHolder ? `<div><strong>Account Holder</strong><span>${escapeHtml(bank.accountHolder)}</span></div>` : ""}
                    ${bank.accountNumber ? `<div><strong>Account / IBAN</strong><span>${escapeHtml(bank.accountNumber)}</span></div>` : ""}
                    ${bank.ifscCode ? `<div><strong>Routing / IFSC</strong><span>${escapeHtml(bank.ifscCode)}</span></div>` : ""}
                    ${bank.upiId ? `<div><strong>UPI ID / VPA</strong><span>${escapeHtml(bank.upiId)}</span></div>` : ""}
                </div>
            </div>
            ${qrUrl ? `
            <div class="qr-section">
                <img src="${qrUrl}" alt="Payment QR Code" />
                <span>Scan to Pay</span>
            </div>
            ` : ""}
        </div>
        ` : ""}

        <!-- Terms and Conditions -->
        <div class="terms-notes-box">
            <div>
                <h5>Terms &amp; Conditions</h5>
                <p>${escapeHtml(termsAndConditions)}</p>
            </div>
            <div>
                <h5>Support &amp; Inquiries</h5>
                <p>If you have any questions concerning this invoice, please reach out to our accounts team at <strong>${escapeHtml(businessEmail)}</strong>.</p>
            </div>
        </div>

        <!-- Signatory Line -->
        <div class="signatory-row">
            <div class="signatory-box">
                <div class="title">Authorized Signatory</div>
                <div class="comp">${escapeHtml(businessName)}</div>
                <div style="font-size: 9px; color: var(--text-light); margin-top: 2px;">Digitally verified &amp; generated on ${escapeHtml(issueDate)}</div>
            </div>
        </div>

        <!-- Document Footer -->
        <div class="doc-footer">
            <span>Generated with InvoiceFlow • Professional Billing &amp; Compliance System</span>
            <span>Document ID: ${escapeHtml(invNumber)} • Page 1 of 1</span>
        </div>
    </div>
</body>
</html>`;
}

export function triggerBrowserDownload(htmlContent: string, fileName: string): string {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
    }, 1000);

    return blobUrl;
}

export function triggerSampleDeviceExport(profile?: BusinessProfile | null): string {
    const sampleInvoice: Partial<InvoiceSummary> = {
        id: "sample-device-test",
        number: "INV-DEMO-001",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        currency: profile?.default_currency || "INR",
        status: "Pending",
        total: "125000.00",
        amount_due: "125000.00"
    };

    const sampleClient: ClientResponse = {
        id: "client-sample",
        name: "Acme Enterprises",
        email: "finance@acmecorp.com",
        company: "Acme Group International",
        phone: "+91 98200 12345",
        tax_id: "GSTIN: 27AABCA1234F1Z1",
        address: {
            line1: "450 Corporate Boulevard",
            line2: "Sector 18",
            city: "Gurugram",
            state: "Haryana",
            postal_code: "122002",
            country: "India"
        }
    };

    const html = buildInvoiceHtml(sampleInvoice, sampleClient, profile);
    const fileName = `InvoiceFlow_Sample_${sampleInvoice.number}.html`;
    return triggerBrowserDownload(html, fileName);
}
