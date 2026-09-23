import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Clock, AlertCircle, ArrowUpRight } from "lucide-react";
import type { InvoiceSummary } from "../../lib/api";
import { convertAmount, formatMoney } from "../../lib/currencies";

interface Props {
    invoices: InvoiceSummary[];
    currency?: string;
    onSelectFilter?: (status: string | null) => void;
    activeFilter?: string | null;
}

export function InvoiceMetricsCards({
    invoices,
    currency = "USD",
    onSelectFilter,
    activeFilter
}: Props) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatAmount = (val: number) => {
        return formatMoney(val, currency, currency, { maximumFractionDigits: 0 });
    };

    // Calculate metrics
    let totalInvoiced = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let totalOutstanding = 0;
    let outstandingCount = 0;
    let totalOverdue = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
        const rawAmt = parseFloat(inv.total || "0");
        const amt = convertAmount(rawAmt, inv.currency || "USD", currency);
        const status = inv.status.toLowerCase();

        if (status === "cancelled") return;

        totalInvoiced += amt;

        if (status === "paid") {
            totalPaid += amt;
            paidCount += 1;
        } else {
            const dueDate = new Date(inv.due_date);
            const isOverdue = !isNaN(dueDate.getTime()) && dueDate < today;

            if (isOverdue || status === "overdue") {
                totalOverdue += amt;
                overdueCount += 1;
            } else {
                totalOutstanding += amt;
                outstandingCount += 1;
            }
        }
    });

    const paidPercentage = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

    const cards = [
        {
            id: "all",
            title: "Total Invoiced",
            amount: totalInvoiced,
            count: invoices.length,
            subtitle: `${invoices.length} invoices issued`,
            icon: TrendingUp,
            color: "text-blue-400 daylight:text-blue-600",
            filter: null
        },
        {
            id: "paid",
            title: "Paid to Date",
            amount: totalPaid,
            count: paidCount,
            subtitle: `${paidPercentage}% settled`,
            icon: CheckCircle2,
            color: "text-emerald-400 daylight:text-emerald-600",
            filter: "paid"
        },
        {
            id: "pending",
            title: "Outstanding",
            amount: totalOutstanding,
            count: outstandingCount,
            subtitle: `${outstandingCount} in collection`,
            icon: Clock,
            color: "text-amber-400 daylight:text-amber-600",
            filter: "pending"
        },
        {
            id: "overdue",
            title: "Overdue",
            amount: totalOverdue,
            count: overdueCount,
            subtitle: overdueCount > 0 ? "Requires attention" : "All clear",
            icon: AlertCircle,
            color: "text-rose-400 daylight:text-rose-600",
            filter: "overdue",
            pulse: overdueCount > 0
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                const isSelected = activeFilter === card.filter;

                return (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectFilter && onSelectFilter(card.filter)}
                        className={`group relative p-[1px] rounded-xl cursor-pointer transition-all duration-200 ${
                            isSelected
                                ? "bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 shadow-[0_4px_20px_rgba(37,99,235,0.25)] ring-2 ring-blue-500/40 daylight:ring-blue-600/30"
                                : "bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] daylight:border-slate-200 shadow-sm hover:border-white/20"
                        }`}
                    >
                        <div className={`relative h-full w-full rounded-[calc(0.75rem-1px)] p-5 transition-colors duration-200 ${
                            isSelected
                                ? "bg-[#0C1322] daylight:bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]"
                                : "bg-[#0D0F15] daylight:bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]"
                        }`}>
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-[11px] font-bold tracking-[0.12em] uppercase transition-colors ${
                                        isSelected
                                            ? "text-blue-400 daylight:text-blue-700 font-extrabold"
                                            : "text-slate-400 daylight:text-slate-600"
                                    }`}>
                                        {card.title}
                                    </span>
                                    {isSelected && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 daylight:bg-blue-600 animate-pulse" />
                                    )}
                                </div>
                                <div className={`p-2 rounded-lg transition-colors ${
                                    isSelected
                                        ? "bg-blue-500/20 text-blue-400 daylight:bg-blue-600 daylight:text-white border border-blue-500/30 daylight:border-blue-600 shadow-sm"
                                        : `bg-white/[0.04] daylight:bg-slate-100 border border-white/5 daylight:border-slate-200 ${card.color}`
                                }`}>
                                    <Icon size={15} />
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="flex items-baseline gap-2 mb-1 min-w-0">
                                <span className={`text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-black tracking-tight font-mono truncate ${
                                    isSelected
                                        ? "text-white daylight:text-blue-950"
                                        : "text-[var(--foreground)] daylight:text-slate-900"
                                }`} title={formatAmount(card.amount)}>
                                    {formatAmount(card.amount)}
                                </span>
                            </div>

                            {/* Footer Subtitle */}
                            <div className={`flex items-center justify-between text-xs pt-2.5 border-t transition-colors mt-3 ${
                                isSelected
                                    ? "border-blue-500/20 daylight:border-blue-200/60"
                                    : "border-white/5 daylight:border-slate-100"
                            }`}>
                                <span className={`font-medium ${
                                    isSelected
                                        ? "text-blue-300 daylight:text-blue-700 font-semibold"
                                        : "text-slate-400 daylight:text-slate-600"
                                }`}>
                                    {card.subtitle}
                                </span>
                                <span className={`inline-flex items-center gap-1 font-mono font-bold ${
                                    isSelected
                                        ? "text-blue-400 daylight:text-blue-700"
                                        : "text-[var(--foreground)] daylight:text-slate-900"
                                }`}>
                                    {card.count}
                                    <ArrowUpRight size={12} className="opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </span>
                            </div>

                            {/* Overdue Diode */}
                            {card.pulse && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                                </span>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
