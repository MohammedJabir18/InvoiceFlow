import { invoke } from "@tauri-apps/api/core";

// ─── Types ───────────────────────────────────────────────────

export interface ClientResponse {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
}

export interface CreateClientRequest {
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
    description: string;
    quantity: number;
    unit_price: number;
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

export interface RevenueMetrics {
    total_revenue: number;
    monthly_revenue: number;
    outstanding: number;
    overdue: number;
}

// ─── Client API ──────────────────────────────────────────────

export async function getClients(): Promise<ClientResponse[]> {
    return invoke<ClientResponse[]>("get_clients");
}

export async function createClient(request: CreateClientRequest): Promise<ClientResponse> {
    return invoke<ClientResponse>("create_client", { request });
}

export async function deleteClient(id: string): Promise<void> {
    return invoke<void>("delete_client", { id });
}

export interface UpdateClientRequest {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
}

export async function updateClient(request: UpdateClientRequest): Promise<void> {
    return invoke<void>("update_client", { request });
}

// ─── Invoice API ─────────────────────────────────────────────

export async function getInvoices(): Promise<InvoiceSummary[]> {
    return invoke<InvoiceSummary[]>("get_invoices");
}

export async function createInvoice(request: CreateInvoiceRequest): Promise<string> {
    return invoke<string>("create_invoice", { request });
}

export async function deleteInvoice(id: string): Promise<void> {
    return invoke<void>("delete_invoice", { id });
}

export async function updateInvoiceStatus(id: string, status: string): Promise<void> {
    return invoke<void>("update_invoice_status", { id, status });
}

// ─── Analytics API ───────────────────────────────────────────

export async function getAnalytics(): Promise<RevenueMetrics> {
    return invoke<RevenueMetrics>("get_analytics");
}

// ─── PDF API ─────────────────────────────────────────────────

export async function generatePdf(id: string): Promise<string> {
    return invoke<string>("generate_pdf", { invoiceId: id });
}

export async function openPdf(path: string): Promise<void> {
    return invoke<void>("open_pdf", { path });
}

// ─── System & Data API ───────────────────────────────────────

export async function resetDatabase(): Promise<void> {
    return invoke<void>("reset_database");
}

export async function exportData(path: string): Promise<void> {
    return invoke<void>("export_data", { path });
}

