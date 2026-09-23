import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
    FileSpreadsheet,
    Printer,
    Download,
    Percent,
    Building2,
    ShieldCheck,
    Search,
    CheckCircle2
} from "lucide-react";
import { ComprehensiveAnalytics } from "../../lib/analyticsEngine";
import { formatMoney } from "../../lib/currencies";
import { InvoiceSummary, ClientResponse } from "../../lib/api";

interface TaxAccountingDashboardProps {
    data: ComprehensiveAnalytics;
    invoices: InvoiceSummary[];
    clients: ClientResponse[];
    currency: string;
    taxRate: number;
    onTaxRateChange: (rate: number) => void;
    onPrint: () => void;
    onExportCsv: () => void;
    profileName?: string;
}

export function TaxAccountingDashboard({
    data,
    invoices,
    clients,
    currency,
    taxRate,
    onTaxRateChange,
    onPrint,
    onExportCsv,
    profileName
}: TaxAccountingDashboardProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const TAX_PRESETS = [
        { label: "0% Export / Exempt", rate: 0 },
        { label: "5% GCC VAT (UAE/Oman)", rate: 5 },
        { label: "15% KSA VAT (Saudi Arabia)", rate: 15 },
        { label: "18% Standard VAT/GST", rate: 18 },
        { label: "20% UK / EU Standard", rate: 20 },
    ];

    const statutoryTax = data.totalBilled * (taxRate / 100);
    const netTaxableBase = Math.max(0, data.totalBilled - statutoryTax);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const client = clients.find(c => c.id === inv.client_id);
            const clientName = client?.name || "";
            return (
                inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inv.status.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [invoices, clients, searchQuery]);

    return (
        <div className="space-y-8">
            {/* Tax Configuration & Reconciled Provision Bar */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-emerald-500/20">
                <div className="p-6 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 daylight:text-purple-700 flex items-center gap-1.5 mb-1">
                                <Percent size={14} />
                                Statutory Tax & VAT Provision Calculator
                            </span>
                            <h2 className="text-xl font-black text-white daylight:text-[#090D16]">
                                Filing Provisions & Compliance Rate
                            </h2>
                        </div>

                        {/* Interactive Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {TAX_PRESETS.map(p => (
                                <button
                                    key={p.rate}
                                    onClick={() => onTaxRateChange(p.rate)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        taxRate === p.rate
                                            ? "bg-purple-600 text-white shadow-sm"
                                            : "bg-white/5 daylight:bg-slate-100 text-slate-400 daylight:text-slate-600 hover:text-white daylight:hover:text-slate-900 border border-white/5 daylight:border-slate-200"
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tax Breakdown Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 daylight:border-slate-200">
                        <div>
                            <span className="text-xs text-slate-400 daylight:text-slate-600 font-medium">Gross Billed Total</span>
                            <div className="text-2xl font-black text-white daylight:text-[#090D16] font-mono mt-1">
                                {formatMoney(data.totalBilled, currency, currency)}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-purple-400 daylight:text-purple-700 font-semibold">
                                Estimated Tax Provision ({taxRate}%)
                            </span>
                            <div className="text-2xl font-black text-purple-400 daylight:text-purple-700 font-mono mt-1">
                                {formatMoney(statutoryTax, currency, currency)}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-emerald-400 daylight:text-emerald-700 font-semibold">Net Retained Operating Base</span>
                            <div className="text-2xl font-black text-emerald-400 daylight:text-emerald-700 font-mono mt-1">
                                {formatMoney(netTaxableBase, currency, currency)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Formal Printable Audit Statement Sheet */}
            <div id="monthly-statement-area" className="p-6 md:p-8 rounded-2xl bg-[#0C1322] daylight:bg-white border border-white/10 daylight:border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0">
                {/* Print Title Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 daylight:border-slate-200 pb-6 mb-6 gap-4">
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 daylight:text-blue-700 block mb-1">
                            OFFICIAL AUDIT & TAX RECONCILIATION DOSSIER
                        </span>
                        <h2 className="text-2xl font-black text-white daylight:text-gray-950">
                            Reconciled General Ledger
                        </h2>
                        <p className="text-xs text-slate-400 daylight:text-gray-600 mt-1">
                            Generated by {profileName || "InvoiceFlow Labs"} • Financial Reporting & Tax Engine
                        </p>
                    </div>

                    <div className="text-left sm:text-right text-xs text-slate-400 daylight:text-gray-600 space-y-1">
                        <p>Entity: <strong className="text-white daylight:text-gray-900">{profileName || "InvoiceFlow Labs"}</strong></p>
                        <p>Audit Date: <span className="font-mono text-white daylight:text-gray-900">{new Date().toISOString().split("T")[0]}</span></p>
                        <p>Status: <span className="font-semibold text-emerald-400 daylight:text-emerald-700">AUDITED & RECONCILED</span></p>
                    </div>
                </div>

                {/* Ledger Controls (Screen Only) */}
                <div className="flex items-center justify-between gap-4 mb-4 print:hidden">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search ledger..."
                            className="pl-8 pr-3 py-1.5 rounded-xl bg-black/20 daylight:bg-slate-50 border border-white/10 daylight:border-slate-200 text-xs text-white daylight:text-slate-900 outline-none w-56 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onExportCsv}
                            className="px-3 py-1.5 rounded-lg bg-white/5 daylight:bg-slate-100 hover:bg-white/10 text-xs font-semibold text-slate-300 daylight:text-slate-700 border border-white/10 daylight:border-slate-200 flex items-center gap-1.5"
                        >
                            <FileSpreadsheet size={13} />
                            <span>Export CSV</span>
                        </button>
                        <button
                            onClick={onPrint}
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-sm"
                        >
                            <Printer size={13} />
                            <span>Print Statement</span>
                        </button>
                    </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto rounded-xl border border-white/10 daylight:border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 daylight:border-slate-200 bg-[#080D1A] daylight:bg-slate-100 text-slate-400 daylight:text-slate-700 uppercase text-[10px] font-bold">
                                <th className="py-2.5 px-3">Invoice #</th>
                                <th className="py-2.5 px-3">Client Entity</th>
                                <th className="py-2.5 px-3">Issue Date</th>
                                <th className="py-2.5 px-3">Due Date</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-right">Tax ({taxRate}%)</th>
                                <th className="py-2.5 px-3 text-right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 daylight:divide-slate-200 text-slate-300 daylight:text-slate-800">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                                        No invoices recorded for this period.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map(inv => {
                                    const client = clients.find(c => c.id === inv.client_id);
                                    const rawTot = parseFloat(inv.total || "0");
                                    const invTax = rawTot * (taxRate / 100);

                                    return (
                                        <tr key={inv.id} className="hover:bg-white/[0.02] daylight:hover:bg-slate-50/70">
                                            <td className="py-2.5 px-3 font-mono font-bold text-blue-400 daylight:text-blue-700">
                                                {inv.number}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium text-white daylight:text-slate-900">
                                                {client?.name || "Client"}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-400 daylight:text-slate-600">
                                                {inv.issue_date}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-400 daylight:text-slate-600">
                                                {inv.due_date}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    inv.status === "Paid"
                                                        ? "bg-emerald-500/15 text-emerald-400 daylight:bg-emerald-100 daylight:text-emerald-800"
                                                        : inv.status === "Overdue"
                                                        ? "bg-rose-500/15 text-rose-400 daylight:bg-rose-100 daylight:text-rose-800"
                                                        : "bg-blue-500/15 text-blue-400 daylight:bg-blue-100 daylight:text-blue-800"
                                                }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-purple-400 daylight:text-purple-700">
                                                {formatMoney(invTax, currency, inv.currency || "USD")}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-white daylight:text-[#090D16]">
                                                {formatMoney(inv.total || "0", currency, inv.currency || "USD")}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Formal Sign-off footer (Printed) */}
                <div className="hidden print:flex justify-between items-end border-t border-gray-400 pt-8 mt-12 text-xs text-gray-600">
                    <div>
                        <p className="font-bold text-gray-900 mb-8">Prepared & Verified By:</p>
                        <p className="font-semibold">{profileName || "Chief Financial Officer"}</p>
                        <p className="text-[10px]">Head of Finance & Treasury Management</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-gray-400">
                        InvoiceFlow Official Audit Copy • Internal Reconciliation
                    </div>
                </div>
            </div>
        </div>
    );
}
