import { useState, useEffect, useMemo } from "react";
import {
    BarChart3,
    Calendar,
    Printer,
    Download,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    FileSpreadsheet,
    Building,
    Percent
} from "lucide-react";
import { getInvoices, getClients, type InvoiceSummary, type ClientResponse } from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import { exportInvoicesToCsv } from "../lib/api";

export function MonthlyReport() {
    const profile = useSettingsStore(state => state.profile);
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Selected Month & Year
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed

    const months = [
        { num: 1, name: "January" },
        { num: 2, name: "February" },
        { num: 3, name: "March" },
        { num: 4, name: "April" },
        { num: 5, name: "May" },
        { num: 6, name: "June" },
        { num: 7, name: "July" },
        { num: 8, name: "August" },
        { num: 9, name: "September" },
        { num: 10, name: "October" },
        { num: 11, name: "November" },
        { num: 12, name: "December" }
    ];

    useEffect(() => {
        Promise.all([getInvoices(), getClients()])
            .then(([invs, cls]) => {
                setInvoices(invs);
                setClients(cls);
            })
            .finally(() => setLoading(false));
    }, []);

    // Filter invoices belonging to selected month/year
    const monthlyInvoices = useMemo(() => {
        const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        return invoices.filter(inv => {
            const issueMonth = inv.issue_date?.substring(0, 7);
            const dueMonth = inv.due_date?.substring(0, 7);
            return issueMonth === monthPrefix || dueMonth === monthPrefix;
        });
    }, [invoices, selectedYear, selectedMonth]);

    // Financial KPIs for the month
    const stats = useMemo(() => {
        let totalBilled = 0;
        let cashCollected = 0;
        let outstanding = 0;
        let paidCount = 0;

        monthlyInvoices.forEach(inv => {
            const tot = parseFloat(inv.total || "0");
            totalBilled += tot;
            if (inv.status === "Paid") {
                cashCollected += tot;
                paidCount++;
            } else {
                outstanding += parseFloat(inv.amount_due || inv.total || "0");
            }
        });

        const collectionRate = totalBilled > 0 ? Math.round((cashCollected / totalBilled) * 100) : 0;
        const estimatedTax = totalBilled * 0.18; // 18% standard VAT / GST calculation

        return {
            totalBilled,
            cashCollected,
            outstanding,
            collectionRate,
            paidCount,
            estimatedTax
        };
    }, [monthlyInvoices]);

    // Client Breakdown
    const clientBreakdown = useMemo(() => {
        const map: Record<string, { name: string; company?: string; total: number; count: number }> = {};

        monthlyInvoices.forEach(inv => {
            const client = clients.find(c => c.id === inv.client_id);
            const name = client?.name || "Other";
            const company = client?.company || undefined;
            const amount = parseFloat(inv.total || "0");

            if (!map[inv.client_id]) {
                map[inv.client_id] = { name, company, total: 0, count: 0 };
            }
            map[inv.client_id].total += amount;
            map[inv.client_id].count++;
        });

        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [monthlyInvoices, clients]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportCsv = () => {
        exportInvoicesToCsv(monthlyInvoices, clients);
    };

    const monthName = months.find(m => m.num === selectedMonth)?.name || "Month";

    return (
        <div className="space-y-8 max-w-6xl mx-auto text-white pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                        <BarChart3 className="text-blue-400" size={28} />
                        <span>Monthly Financial Statement</span>
                    </h1>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">
                        Executive financial overview, tax estimates, and client revenue distribution.
                    </p>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Month Picker */}
                    <div className="flex items-center gap-2 bg-[#111927] border border-white/10 p-1.5 rounded-xl">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer px-2"
                        >
                            {months.map(m => (
                                <option key={m.num} value={m.num} className="bg-[#111927]">
                                    {m.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-xs font-mono font-bold text-gray-300 outline-none cursor-pointer px-2 border-l border-white/10"
                        >
                            <option value={2026} className="bg-[#111927]">2026</option>
                            <option value={2025} className="bg-[#111927]">2025</option>
                        </select>
                    </div>

                    <button
                        onClick={handleExportCsv}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                    >
                        <FileSpreadsheet size={15} />
                        <span>Export CSV</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/25"
                    >
                        <Printer size={15} />
                        <span>Print Statement</span>
                    </button>
                </div>
            </div>

            {/* Printable Report Document Container */}
            <div id="monthly-statement-area" className="bg-[#111927] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl print:bg-white print:text-gray-900 print:p-0 print:border-none print:shadow-none">
                {/* Print Title (Visible on Print and Screen) */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-white/10 print:border-gray-900 pb-6 mb-8 gap-4">
                    <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 print:text-blue-700 block mb-1">
                            MONTHLY REVENUE & TAX STATEMENT
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black print:text-gray-950">
                            {monthName} {selectedYear}
                        </h2>
                        <p className="text-xs text-gray-400 print:text-gray-600 mt-1">
                            Generated by {profile?.name || "InvoiceFlow Corp"} • Financial Reporting Engine
                        </p>
                    </div>

                    <div className="text-left sm:text-right text-xs text-gray-400 print:text-gray-600 space-y-1">
                        <p>Issued By: <span className="text-white print:text-gray-900 font-semibold">{profile?.name || "InvoiceFlow"}</span></p>
                        <p>Date of Report: <span className="font-mono text-white print:text-gray-900">{new Date().toISOString().split("T")[0]}</span></p>
                        <p>Status: <span className="font-semibold text-emerald-400 print:text-emerald-700">AUDITED & RECONCILED</span></p>
                    </div>
                </div>

                {/* 4 Financial KPIs Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 rounded-xl bg-[#0b0f19] print:bg-gray-50 border border-white/5 print:border-gray-200">
                        <div className="text-xs text-gray-400 print:text-gray-600 font-medium mb-1">Total Invoiced (Gross)</div>
                        <div className="text-xl sm:text-2xl font-black text-white print:text-gray-950 font-mono">
                            ${stats.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 block">{monthlyInvoices.length} invoices issued</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0b0f19] print:bg-gray-50 border border-white/5 print:border-gray-200">
                        <div className="text-xs text-emerald-400 print:text-emerald-700 font-medium mb-1">Cash Collected</div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 print:text-emerald-700 font-mono">
                            ${stats.cashCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-emerald-400/80 mt-1 block">{stats.collectionRate}% collected</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0b0f19] print:bg-gray-50 border border-white/5 print:border-gray-200">
                        <div className="text-xs text-amber-400 print:text-amber-700 font-medium mb-1">Outstanding Balance</div>
                        <div className="text-xl sm:text-2xl font-black text-amber-400 print:text-amber-700 font-mono">
                            ${stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 block">Pending settlements</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0b0f19] print:bg-gray-50 border border-white/5 print:border-gray-200">
                        <div className="text-xs text-purple-400 print:text-purple-700 font-medium mb-1">Est. Statutory Tax / VAT</div>
                        <div className="text-xl sm:text-2xl font-black text-purple-400 print:text-purple-700 font-mono">
                            ${stats.estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 block">Standard 18% filing provision</span>
                    </div>
                </div>

                {/* Client Distribution Section */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-white print:text-gray-900 uppercase tracking-wider mb-3">
                        Client Revenue Contribution ({monthName})
                    </h3>
                    <div className="space-y-3">
                        {clientBreakdown.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No revenue recorded for this period.</p>
                        ) : (
                            clientBreakdown.map((item, idx) => {
                                const pct = stats.totalBilled > 0 ? Math.round((item.total / stats.totalBilled) * 100) : 0;
                                return (
                                    <div key={idx} className="p-3 bg-[#0b0f19] print:bg-gray-50 border border-white/5 print:border-gray-200 rounded-xl">
                                        <div className="flex justify-between items-center text-xs mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white print:text-gray-950">{item.name}</span>
                                                {item.company && (
                                                    <span className="text-gray-400 print:text-gray-500 text-[11px]">({item.company})</span>
                                                )}
                                            </div>
                                            <div className="font-mono font-bold text-white print:text-gray-900">
                                                ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pct}%)
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 rounded-full bg-white/10 print:bg-gray-200 overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Itemized Transaction Ledger */}
                <div>
                    <h3 className="text-sm font-bold text-white print:text-gray-900 uppercase tracking-wider mb-3">
                        Itemized Transaction Ledger
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-white/10 print:border-gray-300">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 print:border-gray-400 bg-[#0c1322] print:bg-gray-100 text-gray-400 print:text-gray-700 uppercase text-[10px] font-bold">
                                    <th className="py-2.5 px-3">Invoice #</th>
                                    <th className="py-2.5 px-3">Client</th>
                                    <th className="py-2.5 px-3">Issue Date</th>
                                    <th className="py-2.5 px-3">Due Date</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                                    <th className="py-2.5 px-3 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 print:divide-gray-200 text-gray-300 print:text-gray-800">
                                {monthlyInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-6 text-center text-gray-500 italic">
                                            No invoice records found for {monthName} {selectedYear}.
                                        </td>
                                    </tr>
                                ) : (
                                    monthlyInvoices.map(inv => {
                                        const client = clients.find(c => c.id === inv.client_id);
                                        return (
                                            <tr key={inv.id} className="hover:bg-white/[0.02] print:hover:bg-transparent">
                                                <td className="py-2.5 px-3 font-mono font-bold text-blue-400 print:text-blue-700">
                                                    {inv.number}
                                                </td>
                                                <td className="py-2.5 px-3 font-medium">
                                                    {client?.name || "Client"}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-gray-400 print:text-gray-600">
                                                    {inv.issue_date}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-gray-400 print:text-gray-600">
                                                    {inv.due_date}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        inv.status === "Paid"
                                                            ? "bg-emerald-500/15 text-emerald-400 print:bg-emerald-100 print:text-emerald-800"
                                                            : inv.status === "Overdue"
                                                            ? "bg-rose-500/15 text-rose-400 print:bg-rose-100 print:text-rose-800"
                                                            : "bg-blue-500/15 text-blue-400 print:bg-blue-100 print:text-blue-800"
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono text-gray-400 print:text-gray-600">
                                                    ${parseFloat(inv.amount_due || "0").toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-3 text-right font-mono font-bold text-white print:text-gray-950">
                                                    ${parseFloat(inv.total || "0").toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Formal Sign-off footer (Printed) */}
                <div className="hidden print:flex justify-between items-end border-t border-gray-400 pt-8 mt-12 text-xs text-gray-600">
                    <div>
                        <p className="font-bold text-gray-900 mb-8">Prepared & Verified By:</p>
                        <p className="font-semibold">{profile?.name || "Mohammed Jabir"}</p>
                        <p className="text-[10px]">Head of Finance / Chief Operations Officer</p>
                    </div>
                    <div className="text-right font-mono text-[10px] text-gray-400">
                        InvoiceFlow Official Audit Copy • Internal Reconciliation
                    </div>
                </div>
            </div>
        </div>
    );
}
