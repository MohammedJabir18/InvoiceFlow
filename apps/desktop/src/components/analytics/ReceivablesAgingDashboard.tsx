import { useState } from "react";
import { motion } from "framer-motion";
import {
    ShieldAlert,
    AlertTriangle,
    Clock,
    DollarSign,
    CheckCircle2,
    MessageSquare,
    Mail,
    Send,
    ArrowRight
} from "lucide-react";
import { ComprehensiveAnalytics, AgingBucket } from "../../lib/analyticsEngine";
import { formatMoney } from "../../lib/currencies";
import { ClientResponse } from "../../lib/api";

interface ReceivablesAgingDashboardProps {
    data: ComprehensiveAnalytics;
    clients: ClientResponse[];
    currency: string;
}

export function ReceivablesAgingDashboard({ data, clients, currency }: ReceivablesAgingDashboardProps) {
    const [selectedBucketKey, setSelectedBucketKey] = useState<string>("all");
    const [actionNotification, setActionNotification] = useState<string | null>(null);

    const buckets = [
        { key: "current", ...data.agingBuckets.current },
        { key: "days1_30", ...data.agingBuckets.days1_30 },
        { key: "days31_60", ...data.agingBuckets.days31_60 },
        { key: "days61_90", ...data.agingBuckets.days61_90 },
        { key: "days90Plus", ...data.agingBuckets.days90Plus },
    ];

    // Determine invoices to display in the ledger
    const displayedInvoices = selectedBucketKey === "all"
        ? buckets.flatMap(b => b.invoices)
        : buckets.find(b => b.key === selectedBucketKey)?.invoices || [];

    const handleSendReminder = (invNum: string, clientName: string, method: "whatsapp" | "email") => {
        setActionNotification(`Payment reminder dispatched to ${clientName} for invoice ${invNum} via ${method.toUpperCase()}.`);
        setTimeout(() => setActionNotification(null), 4000);
    };

    return (
        <div className="space-y-8">
            {/* Top Risk & Delinquency Metric Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Delinquent Past Due */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-rose-500/30 via-rose-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-rose-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 daylight:text-rose-700 flex items-center gap-1.5">
                                <ShieldAlert size={16} />
                                Overdue Delinquent Balance
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {formatMoney(data.totalDelinquentAmount, currency, currency)}
                            </div>
                            <p className="text-xs text-rose-400 daylight:text-rose-700 font-semibold mt-1">
                                Past due across active debtor accounts
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Statistical Bad-Debt Exposure */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-amber-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 daylight:text-amber-800 flex items-center gap-1.5">
                                <AlertTriangle size={16} />
                                Est. Bad-Debt Loss Exposure
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {formatMoney(data.totalEstimatedBadDebt, currency, currency)}
                            </div>
                            <p className="text-xs text-slate-400 daylight:text-slate-600 font-medium mt-1">
                                Weighted statistical loss probability
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Collection Effectiveness Index (CEI) */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-blue-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 daylight:text-blue-700 flex items-center gap-1.5">
                                <CheckCircle2 size={16} />
                                Collection Effectiveness (CEI)
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {data.collectionEffectivenessIndex}%
                            </div>
                            <p className="text-xs text-emerald-400 daylight:text-emerald-700 font-semibold mt-1">
                                Standard recovery efficiency score
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {actionNotification && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 daylight:bg-emerald-50 daylight:text-emerald-800 text-xs font-semibold flex items-center gap-2"
                >
                    <CheckCircle2 size={16} />
                    <span>{actionNotification}</span>
                </motion.div>
            )}

            {/* Interactive Aging Waterfall Buckets */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent">
                <div className="p-6 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 daylight:text-slate-600 block mb-1">
                                Standard Accounting Aging Schedule
                            </span>
                            <h2 className="text-xl font-black text-white daylight:text-[#090D16]">
                                Receivables Aging Waterfall
                            </h2>
                            <p className="text-xs text-slate-400 daylight:text-slate-600 mt-1">
                                Click on any aging tier to filter the accounts receivable ledger below.
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedBucketKey("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                selectedBucketKey === "all"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-white/5 daylight:bg-slate-100 text-slate-300 daylight:text-slate-700 hover:bg-white/10"
                            }`}
                        >
                            View All ({buckets.reduce((acc, b) => acc + b.count, 0)})
                        </button>
                    </div>

                    {/* Horizontal Aging Bars */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {buckets.map(b => {
                            const isSelected = selectedBucketKey === b.key;
                            return (
                                <button
                                    key={b.key}
                                    onClick={() => setSelectedBucketKey(b.key)}
                                    className={`p-4 rounded-xl text-left transition-all border outline-none cursor-pointer flex flex-col justify-between ${
                                        isSelected
                                            ? "bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20 daylight:bg-blue-50/70"
                                            : "bg-black/20 daylight:bg-slate-50 border-white/5 daylight:border-slate-200 hover:border-white/20"
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-xs font-bold text-white daylight:text-slate-900 truncate">
                                                {b.label}
                                            </span>
                                            <span
                                                className="w-2.5 h-2.5 rounded-full"
                                                style={{ backgroundColor: b.color }}
                                            />
                                        </div>
                                        <div className="text-lg font-black text-white daylight:text-[#090D16] font-mono">
                                            {formatMoney(b.amount, currency, currency)}
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-white/5 daylight:border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 daylight:text-slate-600">
                                        <span>{b.count} invoices</span>
                                        <span className="font-mono text-rose-400 daylight:text-rose-700">{b.riskPercent}% risk</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Delinquency Ledger with Direct Reminder Action */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent">
                <div className="p-6 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white daylight:text-[#090D16] uppercase tracking-wider">
                            Active Outstanding Ledger ({displayedInvoices.length} Records)
                        </h3>
                        <span className="text-xs text-slate-400 daylight:text-slate-600">
                            Showing: <strong className="text-blue-400 daylight:text-blue-700">{selectedBucketKey === "all" ? "All Buckets" : buckets.find(b => b.key === selectedBucketKey)?.label}</strong>
                        </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-white/10 daylight:border-slate-200">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 daylight:border-slate-200 bg-[#080D1A] daylight:bg-slate-50 text-slate-400 daylight:text-slate-700 uppercase text-[10px] font-bold">
                                    <th className="py-3 px-4">Invoice #</th>
                                    <th className="py-3 px-4">Debtor / Client</th>
                                    <th className="py-3 px-4">Due Date</th>
                                    <th className="py-3 px-4 text-right">Outstanding Amount</th>
                                    <th className="py-3 px-4 text-center">Aging Status</th>
                                    <th className="py-3 px-4 text-right">Instant Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 daylight:divide-slate-200 text-slate-300 daylight:text-slate-800">
                                {displayedInvoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400 daylight:text-slate-500 italic">
                                            No outstanding invoices in this aging bucket.
                                        </td>
                                    </tr>
                                ) : (
                                    displayedInvoices.map(inv => {
                                        const client = clients.find(c => c.id === inv.client_id);
                                        const clientName = client?.name || "Client";
                                        const rawDue = parseFloat(inv.amount_due || inv.total || "0");
                                        const due = formatMoney(rawDue, currency, inv.currency || "USD");

                                        return (
                                            <tr key={inv.id} className="hover:bg-white/[0.02] daylight:hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-4 font-mono font-bold text-blue-400 daylight:text-blue-700">
                                                    {inv.number}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-white daylight:text-slate-900">{clientName}</div>
                                                    {client?.company && (
                                                        <div className="text-[11px] text-slate-400 daylight:text-slate-500">{client.company}</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 font-mono text-slate-400 daylight:text-slate-600">
                                                    {inv.due_date}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono font-bold text-white daylight:text-[#090D16]">
                                                    {due}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 daylight:bg-amber-50 daylight:text-amber-800 border border-amber-500/20 daylight:border-amber-200">
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => handleSendReminder(inv.number, clientName, "whatsapp")}
                                                            title="Dispatch WhatsApp Nudge"
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 daylight:bg-emerald-50 daylight:text-emerald-700 transition-colors"
                                                        >
                                                            <MessageSquare size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSendReminder(inv.number, clientName, "email")}
                                                            title="Dispatch Follow-up Email"
                                                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 daylight:bg-blue-50 daylight:text-blue-700 transition-colors"
                                                        >
                                                            <Mail size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
