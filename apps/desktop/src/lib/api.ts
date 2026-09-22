import { invoke } from "@tauri-apps/api/core";

// Check if running inside native Tauri environment
export const isTauri = (): boolean => {
    return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
};

// ─── Types ───────────────────────────────────────────────────

export interface ClientResponse {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    phone?: string | null;
    address?: {
        line1: string;
        line2?: string | null;
        city: string;
        state?: string | null;
        postal_code: string;
        country: string;
    };
    total_ltv?: string;
}

export interface CreateClientRequest {
    name: string;
    email: string | null;
    company: string | null;
}

export interface UpdateClientRequest {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
}

export interface InvoiceSummary {
    id: string;
    number: string;
    status: string;
    client_id: string;
    issue_date: string;
    due_date: string;
    currency: string;
    total: string;
    amount_due: string;
}

export interface InvoiceItemRequest {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    unit?: string;
    tax_rate?: number;
    amount?: number;
}

export interface InvoiceActivity {
    id: string;
    timestamp: string;
    action: string;
    details?: string;
}

export interface FullInvoice {
    id: string;
    number: string;
    status: string;
    client_id: string;
    business_profile_id?: string;
    deal_id?: string | null;
    issue_date: string;
    due_date: string;
    currency: string;
    items: {
        id: string;
        invoice_id: string;
        description: string;
        quantity: string | number;
        unit_price: string | number;
        amount: string | number;
        tax_rate_name?: string | null;
        sort_order: number;
    }[];
    subtotal: string;
    tax_total: string;
    discount_total: string;
    total: string;
    amount_paid: string;
    amount_due: string;
    payment_terms: string;
    notes: string | null;
    terms_and_conditions: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateInvoiceRequest {
    invoice_number: string | null;
    client_id: string;
    items: InvoiceItemRequest[];
    notes: string | null;
    status: string | null;
    issue_date: string | null;
    due_date: string | null;
}

export interface UpdateInvoiceRequest {
    id: string;
    client_id: string;
    items: InvoiceItemRequest[];
    notes: string | null;
    status: string | null;
    issue_date: string | null;
    due_date: string | null;
}

export interface RevenueMetrics {
    total_revenue: number;
    monthly_revenue: number;
    outstanding: number;
    overdue: number;
}

// ─── Local Mock Storage (Browser Fallback) ───────────────────
const MOCK_STORAGE_PREFIX = "invoiceflow_mock_";

function getMockStorage<T>(key: string, defaultVal: T): T {
    try {
        const item = localStorage.getItem(MOCK_STORAGE_PREFIX + key);
        return item ? JSON.parse(item) : defaultVal;
    } catch {
        return defaultVal;
    }
}

function setMockStorage<T>(key: string, val: T): void {
    try {
        localStorage.setItem(MOCK_STORAGE_PREFIX + key, JSON.stringify(val));
    } catch (e) {
        console.warn("Local storage write failed", e);
    }
}

const DEFAULT_MOCK_CLIENTS: ClientResponse[] = [
    { id: "c-001", name: "Acme Corp", email: "billing@acme.com", company: "Acme Industries", total_ltv: "14500" },
    { id: "c-002", name: "Starlight Digital", email: "finance@starlight.io", company: "Starlight Media", total_ltv: "8200" },
    { id: "c-003", name: "Nexus Labs", email: "accounts@nexuslabs.co", company: "Nexus Robotics", total_ltv: "23000" }
];

const DEFAULT_MOCK_INVOICES: InvoiceSummary[] = [
    { id: "inv-001", number: "INV-2026-001", status: "Paid", client_id: "c-001", issue_date: "2026-02-01", due_date: "2026-03-01", currency: "USD", total: "4500.00", amount_due: "0.00" },
    { id: "inv-002", number: "INV-2026-002", status: "Sent", client_id: "c-002", issue_date: "2026-03-01", due_date: "2026-03-31", currency: "USD", total: "2200.00", amount_due: "2200.00" },
    { id: "inv-003", number: "INV-2026-003", status: "Overdue", client_id: "c-003", issue_date: "2026-01-10", due_date: "2026-02-10", currency: "USD", total: "7800.00", amount_due: "7800.00" },
    { id: "inv-004", number: "INV-2026-004", status: "Draft", client_id: "c-001", issue_date: "2026-03-15", due_date: "2026-04-15", currency: "USD", total: "1500.00", amount_due: "1500.00" }
];

// ─── Client API ──────────────────────────────────────────────

export async function getClients(): Promise<ClientResponse[]> {
    if (isTauri()) {
        try {
            return await invoke<ClientResponse[]>("get_clients");
        } catch (e) {
            console.error("Tauri get_clients failed, falling back to local data:", e);
        }
    }
    return getMockStorage("clients", DEFAULT_MOCK_CLIENTS);
}

export async function createClient(request: CreateClientRequest): Promise<ClientResponse> {
    if (isTauri()) {
        return invoke<ClientResponse>("create_client", { request });
    }
    const clients = getMockStorage("clients", DEFAULT_MOCK_CLIENTS);
    const newClient: ClientResponse = {
        id: "c-" + Date.now(),
        name: request.name,
        email: request.email,
        company: request.company,
        total_ltv: "0"
    };
    clients.push(newClient);
    setMockStorage("clients", clients);
    return newClient;
}

export async function deleteClient(id: string): Promise<void> {
    if (isTauri()) {
        return invoke<void>("delete_client", { id });
    }
    const clients = getMockStorage("clients", DEFAULT_MOCK_CLIENTS);
    setMockStorage("clients", clients.filter(c => c.id !== id));
}

export async function updateClient(request: UpdateClientRequest): Promise<void> {
    if (isTauri()) {
        return invoke<void>("update_client", { request });
    }
    const clients = getMockStorage("clients", DEFAULT_MOCK_CLIENTS);
    const index = clients.findIndex(c => c.id === request.id);
    if (index !== -1) {
        clients[index] = { ...clients[index], name: request.name, email: request.email, company: request.company };
        setMockStorage("clients", clients);
    }
}

// ─── Invoice API ─────────────────────────────────────────────

export async function getInvoices(): Promise<InvoiceSummary[]> {
    if (isTauri()) {
        try {
            return await invoke<InvoiceSummary[]>("get_invoices");
        } catch (e) {
            console.error("Tauri get_invoices failed, falling back to local data:", e);
        }
    }
    return getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
}

export async function getInvoiceById(id: string): Promise<FullInvoice | null> {
    if (isTauri()) {
        try {
            const invoice = await invoke<FullInvoice | null>("get_invoice", { id });
            if (invoice) return invoice;
        } catch (e) {
            console.warn("Tauri get_invoice failed, falling back to local data:", e);
        }
    }

    const summaries = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    const summary = summaries.find(i => i.id === id || i.number.toLowerCase() === id.toLowerCase());
    if (!summary) return null;

    // Check if detailed data exists in mock storage
    const detailed = getMockStorage<FullInvoice | null>(`invoice_${summary.id}`, null);
    if (detailed) return detailed;

    // Construct a fallback FullInvoice from summary
    return {
        id: summary.id,
        number: summary.number,
        status: summary.status,
        client_id: summary.client_id,
        issue_date: summary.issue_date,
        due_date: summary.due_date,
        currency: summary.currency,
        items: [
            {
                id: "item-1",
                invoice_id: summary.id,
                description: "Professional Services & Engineering",
                quantity: "1",
                unit_price: summary.total,
                amount: summary.total,
                tax_rate_name: null,
                sort_order: 0
            }
        ],
        subtotal: summary.total,
        tax_total: "0.00",
        discount_total: "0.00",
        total: summary.total,
        amount_paid: summary.status === "Paid" ? summary.total : "0.00",
        amount_due: summary.amount_due,
        payment_terms: "Net30",
        notes: JSON.stringify({
            developer: "Mohammed Jabir",
            projectDetails: [{ id: 1, label: "Deliverable", value: "Custom SaaS Platform" }],
            bankDetails: { bankName: "HDFC Bank", accountHolder: "Mohammed Jabir", accountNumber: "501004589231", ifscCode: "HDFC0001234", upiId: "jabir@upi" },
            internalNotes: "Standard consulting agreement.",
            activityLog: [
                { id: "act-1", timestamp: new Date(summary.issue_date).toISOString(), action: "Invoice Created", details: `Initial total ${summary.total}` }
            ]
        }),
        terms_and_conditions: "Payment due according to stated terms. Please direct questions to support.",
        created_at: summary.issue_date,
        updated_at: summary.issue_date
    };
}

export async function createInvoice(request: CreateInvoiceRequest): Promise<string> {
    if (isTauri()) {
        try {
            return await invoke<string>("create_invoice", { request });
        } catch (e) {
            console.error("Tauri create_invoice failed:", e);
            throw e;
        }
    }

    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    const invoiceNumber = request.invoice_number || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;
    const newId = "inv-" + Date.now();
    const total = request.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2);

    const newSummary: InvoiceSummary = {
        id: newId,
        number: invoiceNumber,
        status: request.status || "Draft",
        client_id: request.client_id,
        issue_date: request.issue_date || new Date().toISOString().split("T")[0],
        due_date: request.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        currency: "USD",
        total,
        amount_due: request.status === "Paid" ? "0.00" : total
    };

    invoices.unshift(newSummary);
    setMockStorage("invoices", invoices);

    // Also store full details
    const full: FullInvoice = {
        ...newSummary,
        items: request.items.map((it, idx) => ({
            id: `item-${idx + 1}`,
            invoice_id: newId,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            amount: (it.quantity * it.unit_price).toFixed(2),
            sort_order: idx
        })),
        subtotal: total,
        tax_total: "0.00",
        discount_total: "0.00",
        amount_paid: request.status === "Paid" ? total : "0.00",
        payment_terms: "Net30",
        notes: request.notes,
        terms_and_conditions: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    setMockStorage(`invoice_${newId}`, full);

    return invoiceNumber;
}

export async function updateInvoice(request: UpdateInvoiceRequest): Promise<void> {
    if (isTauri()) {
        return invoke<void>("update_invoice", { request });
    }

    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    const index = invoices.findIndex(i => i.id === request.id);
    const total = request.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2);

    if (index !== -1) {
        invoices[index] = {
            ...invoices[index],
            client_id: request.client_id,
            status: request.status || invoices[index].status,
            issue_date: request.issue_date || invoices[index].issue_date,
            due_date: request.due_date || invoices[index].due_date,
            total,
            amount_due: request.status === "Paid" ? "0.00" : total
        };
        setMockStorage("invoices", invoices);

        // Update full details
        const full = getMockStorage<FullInvoice | null>(`invoice_${request.id}`, null);
        if (full) {
            full.client_id = request.client_id;
            full.status = request.status || full.status;
            full.issue_date = request.issue_date || full.issue_date;
            full.due_date = request.due_date || full.due_date;
            full.items = request.items.map((it, idx) => ({
                id: it.id || `item-${idx + 1}`,
                invoice_id: request.id,
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
                amount: (it.quantity * it.unit_price).toFixed(2),
                sort_order: idx
            }));
            full.subtotal = total;
            full.total = total;
            full.amount_due = request.status === "Paid" ? "0.00" : total;
            full.notes = request.notes;
            full.updated_at = new Date().toISOString();
            setMockStorage(`invoice_${request.id}`, full);
        }
    }
}

export async function duplicateInvoice(id: string): Promise<string> {
    if (isTauri()) {
        return invoke<string>("duplicate_invoice", { id });
    }

    const source = await getInvoiceById(id);
    if (!source) throw new Error("Invoice not found");

    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    const nextNum = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;
    const newId = "inv-" + Date.now();

    const newSummary: InvoiceSummary = {
        id: newId,
        number: nextNum,
        status: "Draft",
        client_id: source.client_id,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        currency: source.currency,
        total: source.total,
        amount_due: source.total
    };

    invoices.unshift(newSummary);
    setMockStorage("invoices", invoices);

    const fullClone: FullInvoice = {
        ...source,
        id: newId,
        number: nextNum,
        status: "Draft",
        issue_date: newSummary.issue_date,
        due_date: newSummary.due_date,
        amount_paid: "0.00",
        amount_due: source.total,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    setMockStorage(`invoice_${newId}`, fullClone);

    return newId;
}

export async function deleteInvoice(id: string): Promise<void> {
    if (isTauri()) {
        return invoke<void>("delete_invoice", { id });
    }
    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    setMockStorage("invoices", invoices.filter(i => i.id !== id));
    localStorage.removeItem(MOCK_STORAGE_PREFIX + `invoice_${id}`);
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
    if (isTauri()) {
        return invoke<void>("update_invoice_status", { id, status });
    }
    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    const index = invoices.findIndex(i => i.id === id || i.number.toLowerCase() === id.toLowerCase());
    if (index !== -1) {
        invoices[index].status = status;
        if (status === "Paid") {
            invoices[index].amount_due = "0.00";
        }
        setMockStorage("invoices", invoices);
    }
}

// ─── Analytics API ───────────────────────────────────────────

export async function getAnalytics(): Promise<RevenueMetrics> {
    if (isTauri()) {
        try {
            return await invoke<RevenueMetrics>("get_analytics");
        } catch (e) {
            console.error("Tauri get_analytics failed:", e);
        }
    }
    const invoices = getMockStorage("invoices", DEFAULT_MOCK_INVOICES);
    let total_revenue = 0;
    let outstanding = 0;
    let overdue = 0;
    const now = new Date();

    for (const inv of invoices) {
        const amt = parseFloat(inv.total) || 0;
        if (inv.status === "Paid") {
            total_revenue += amt;
        } else if (inv.status !== "Cancelled") {
            outstanding += amt;
            const due = new Date(inv.due_date);
            if (!isNaN(due.getTime()) && due < now) {
                overdue += amt;
            }
        }
    }

    return {
        total_revenue,
        monthly_revenue: total_revenue * 0.35,
        outstanding,
        overdue
    };
}

// ─── PDF & Receipt API ───────────────────────────────────────

export async function generatePdf(id: string): Promise<string> {
    if (isTauri()) {
        return invoke<string>("generate_pdf", { invoiceId: id });
    }
    return `/mock-exports/Invoice_${id}.pdf`;
}

export async function openPdf(path: string): Promise<void> {
    if (isTauri()) {
        return invoke<void>("open_pdf", { path });
    }
    window.open(path, "_blank");
}

// ─── Midday Data Export Tools ────────────────────────────────

export function exportInvoicesToCsv(invoices: InvoiceSummary[], clients: ClientResponse[]): void {
    const getClientName = (id: string) => {
        const client = clients.find(c => c.id === id);
        return client ? `"${client.name.replace(/"/g, '""')}"` : '"Unknown"';
    };

    const headers = ["Invoice Number", "Status", "Client", "Issue Date", "Due Date", "Currency", "Total Amount", "Amount Due"];
    const rows = invoices.map(inv => [
        `"${inv.number}"`,
        `"${inv.status}"`,
        getClientName(inv.client_id),
        `"${inv.issue_date}"`,
        `"${inv.due_date}"`,
        `"${inv.currency}"`,
        inv.total,
        inv.amount_due
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `InvoiceFlow_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function exportInvoicesToJson(invoices: InvoiceSummary[]): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `InvoiceFlow_Invoices_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ─── CRM API ─────────────────────────────────────────────────

export interface Deal {
    id: string;
    client_id: string;
    title: string;
    value: string;
    status: string;
    ai_lead_score: number | null;
    next_suggested_action: string | null;
    created_at: string;
    updated_at: string;
}

export interface DealInsights {
    ai_lead_score: number;
    next_suggested_action: string;
}

export async function getDealsByClient(client_id: string): Promise<Deal[]> {
    if (isTauri()) {
        return invoke<Deal[]>("get_deals_by_client", { clientId: client_id });
    }
    return [];
}

export async function generateDealInsights(deal_id: string): Promise<DealInsights> {
    if (isTauri()) {
        return invoke<DealInsights>("generate_deal_insights", { dealId: deal_id });
    }
    return { ai_lead_score: 85, next_suggested_action: "Schedule follow-up demo next Monday." };
}

// ─── System & Data API ───────────────────────────────────────

export async function resetDatabase(): Promise<void> {
    if (isTauri()) {
        return invoke<void>("reset_database");
    }
    localStorage.clear();
}

export async function exportData(path: string): Promise<void> {
    if (isTauri()) {
        return invoke<void>("export_data", { path });
    }
}

// ─── Quotations / Estimates API ──────────────────────────────

export interface QuotationSummary {
    id: string;
    number: string;
    status: "Draft" | "Sent" | "Accepted" | "Declined" | "Expired" | "Converted";
    client_id: string;
    issue_date: string;
    valid_until: string;
    currency: string;
    total: string;
}

export interface FullQuotation extends QuotationSummary {
    items: {
        id: string;
        description: string;
        quantity: number | string;
        unit?: string;
        unit_price: number | string;
        amount: number | string;
    }[];
    notes: string | null;
    terms: string | null;
    created_at: string;
    converted_invoice_id?: string | null;
}

export interface CreateQuotationRequest {
    number?: string | null;
    client_id: string;
    items: InvoiceItemRequest[];
    notes?: string | null;
    terms?: string | null;
    status?: string;
    issue_date?: string | null;
    valid_until?: string | null;
}

export interface UpdateQuotationRequest {
    id: string;
    client_id: string;
    items: InvoiceItemRequest[];
    notes?: string | null;
    terms?: string | null;
    status?: string;
    issue_date?: string | null;
    valid_until?: string | null;
}

const DEFAULT_MOCK_QUOTATIONS: QuotationSummary[] = [
    {
        id: "quo-001",
        number: "QUO-2026-001",
        status: "Accepted",
        client_id: "c-001",
        issue_date: "2026-03-01",
        valid_until: "2026-04-15",
        currency: "USD",
        total: "5400.00"
    },
    {
        id: "quo-002",
        number: "QUO-2026-002",
        status: "Sent",
        client_id: "c-002",
        issue_date: "2026-03-10",
        valid_until: "2026-04-30",
        currency: "USD",
        total: "3200.00"
    },
    {
        id: "quo-003",
        number: "QUO-2026-003",
        status: "Draft",
        client_id: "c-003",
        issue_date: "2026-03-18",
        valid_until: "2026-05-01",
        currency: "USD",
        total: "9800.00"
    }
];

export async function getQuotations(): Promise<QuotationSummary[]> {
    return getMockStorage("quotations", DEFAULT_MOCK_QUOTATIONS);
}

export async function getQuotationById(id: string): Promise<FullQuotation | null> {
    const list = getMockStorage<QuotationSummary[]>("quotations", DEFAULT_MOCK_QUOTATIONS);
    const summary = list.find(q => q.id === id);
    if (!summary) return null;

    const detailed = getMockStorage<FullQuotation | null>(`quotation_${id}`, null);
    if (detailed) return detailed;

    return {
        ...summary,
        items: [
            {
                id: "qitem-1",
                description: "Initial Discovery & Architecture Scoping",
                quantity: "1",
                unit: "project",
                unit_price: (parseFloat(summary.total) * 0.4).toFixed(2),
                amount: (parseFloat(summary.total) * 0.4).toFixed(2)
            },
            {
                id: "qitem-2",
                description: "Core Implementation & Production Deployment",
                quantity: "1",
                unit: "project",
                unit_price: (parseFloat(summary.total) * 0.6).toFixed(2),
                amount: (parseFloat(summary.total) * 0.6).toFixed(2)
            }
        ],
        notes: JSON.stringify({
            scope: "Full-stack implementation with ongoing monthly SLA support.",
            deliveryTimeline: "3-4 Weeks from acceptance",
            depositRequired: "50% upfront, 50% upon final acceptance"
        }),
        terms: "This quotation is valid for 30 days from the date of issuance. Prices are exclusive of applicable statutory taxes.",
        created_at: summary.issue_date
    };
}

export async function createQuotation(request: CreateQuotationRequest): Promise<string> {
    const list = getMockStorage<QuotationSummary[]>("quotations", DEFAULT_MOCK_QUOTATIONS);
    const num = request.number || `QUO-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, "0")}`;
    const newId = "quo-" + Date.now();
    const total = request.items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0).toFixed(2);

    const newSummary: QuotationSummary = {
        id: newId,
        number: num,
        status: (request.status as any) || "Draft",
        client_id: request.client_id,
        issue_date: request.issue_date || new Date().toISOString().split("T")[0],
        valid_until: request.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        currency: "USD",
        total
    };

    list.unshift(newSummary);
    setMockStorage("quotations", list);

    const full: FullQuotation = {
        ...newSummary,
        items: request.items.map((it, idx) => ({
            id: it.id || `item-${idx + 1}`,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit || "unit",
            unit_price: it.unit_price,
            amount: (it.quantity * it.unit_price).toFixed(2)
        })),
        notes: request.notes || null,
        terms: request.terms || "Standard proposal terms apply. Valid for 30 calendar days.",
        created_at: new Date().toISOString()
    };
    setMockStorage(`quotation_${newId}`, full);

    return newId;
}

export async function updateQuotation(request: UpdateQuotationRequest): Promise<void> {
    const list = getMockStorage<QuotationSummary[]>("quotations", DEFAULT_MOCK_QUOTATIONS);
    const idx = list.findIndex(q => q.id === request.id);
    const total = request.items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0).toFixed(2);

    if (idx !== -1) {
        list[idx] = {
            ...list[idx],
            client_id: request.client_id,
            status: (request.status as any) || list[idx].status,
            issue_date: request.issue_date || list[idx].issue_date,
            valid_until: request.valid_until || list[idx].valid_until,
            total
        };
        setMockStorage("quotations", list);

        const full = getMockStorage<FullQuotation | null>(`quotation_${request.id}`, null);
        if (full) {
            full.client_id = request.client_id;
            full.status = (request.status as any) || full.status;
            full.issue_date = request.issue_date || full.issue_date;
            full.valid_until = request.valid_until || full.valid_until;
            full.total = total;
            full.notes = request.notes || full.notes;
            full.terms = request.terms || full.terms;
            full.items = request.items.map((it, i) => ({
                id: it.id || `item-${i + 1}`,
                description: it.description,
                quantity: it.quantity,
                unit: it.unit || "unit",
                unit_price: it.unit_price,
                amount: (it.quantity * it.unit_price).toFixed(2)
            }));
            setMockStorage(`quotation_${request.id}`, full);
        }
    }
}

export async function deleteQuotation(id: string): Promise<void> {
    const list = getMockStorage<QuotationSummary[]>("quotations", DEFAULT_MOCK_QUOTATIONS);
    setMockStorage("quotations", list.filter(q => q.id !== id));
    localStorage.removeItem(MOCK_STORAGE_PREFIX + `quotation_${id}`);
}

export async function convertQuotationToInvoice(quotationId: string): Promise<string> {
    const quote = await getQuotationById(quotationId);
    if (!quote) throw new Error("Quotation not found");

    // 1. Create an invoice from the quotation
    const invoiceNumber = await createInvoice({
        invoice_number: null, // will auto generate INV-YYYY-XXX
        client_id: quote.client_id,
        items: quote.items.map(it => ({
            description: it.description,
            quantity: typeof it.quantity === "string" ? parseFloat(it.quantity) || 1 : it.quantity,
            unit_price: typeof it.unit_price === "string" ? parseFloat(it.unit_price) || 0 : it.unit_price,
            unit: it.unit || "unit"
        })),
        notes: JSON.stringify({
            convertedFromQuotation: quote.number,
            originalTerms: quote.terms
        }),
        status: "Draft",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
    });

    // 2. Mark the quotation as Converted
    const list = getMockStorage<QuotationSummary[]>("quotations", DEFAULT_MOCK_QUOTATIONS);
    const qIdx = list.findIndex(q => q.id === quotationId);
    if (qIdx !== -1) {
        list[qIdx].status = "Converted";
        setMockStorage("quotations", list);

        const full = getMockStorage<FullQuotation | null>(`quotation_${quotationId}`, null);
        if (full) {
            full.status = "Converted";
            full.converted_invoice_id = invoiceNumber;
            setMockStorage(`quotation_${quotationId}`, full);
        }
    }

    return invoiceNumber;
}
