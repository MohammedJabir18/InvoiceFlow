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
            color: "text-blue-400",
            bgGlow: "rgba(59, 130, 246, 0.08)",
            border: "rgba(59, 130, 246, 0.2)",
            filter: null
        },
        {
            id: "paid",
            title: "Paid to Date",
            amount: totalPaid,
            count: paidCount,
            subtitle: `${paidPercentage}% collected`,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bgGlow: "rgba(16, 185, 129, 0.08)",
            border: "rgba(16, 185, 129, 0.2)",
            filter: "paid"
        },
        {
            id: "pending",
            title: "Outstanding",
            amount: totalOutstanding,
            count: outstandingCount,
            subtitle: `${outstandingCount} awaiting payment`,
            icon: Clock,
            color: "text-amber-400",
            bgGlow: "rgba(245, 158, 11, 0.08)",
            border: "rgba(245, 158, 11, 0.2)",
            filter: "pending"
        },
        {
            id: "overdue",
            title: "Overdue",
            amount: totalOverdue,
            count: overdueCount,
            subtitle: overdueCount > 0 ? "Requires attention" : "All clear",
            icon: AlertCircle,
            color: "text-rose-400",
            bgGlow: overdueCount > 0 ? "rgba(244, 63, 94, 0.12)" : "rgba(244, 63, 94, 0.06)",
            border: overdueCount > 0 ? "rgba(244, 63, 94, 0.35)" : "rgba(244, 63, 94, 0.15)",
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
                        transition={{ duration: 0.3, delay: idx * 0.06 }}
                        onClick={() => onSelectFilter && onSelectFilter(card.filter)}
                        className={`metric-card relative rounded-2xl p-5 cursor-pointer transition-all duration-300 backdrop-blur-xl border ${
                            isSelected
                                ? "ring-2 ring-blue-400/50 scale-[1.02]"
                                : "hover:scale-[1.01] hover:border-white/20"
                        }`}
                        style={{
                            background: `linear-gradient(135deg, ${card.bgGlow} 0%, rgba(15, 23, 42, 0.6) 100%)`,
                            borderColor: card.border
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                {card.title}
                            </span>
                            <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${card.color}`}>
                                <Icon size={16} />
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-baseline gap-2 mb-1 min-w-0">
                            <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl font-bold tracking-tight text-white font-mono truncate" title={formatAmount(card.amount)}>
                                {formatAmount(card.amount)}
                            </span>
                        </div>

                        {/* Footer Subtitle */}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5 mt-3">
                            <span>{card.subtitle}</span>
                            <span className="inline-flex items-center gap-1 font-medium text-gray-300">
                                {card.count} inv
                                <ArrowUpRight size={12} className="opacity-60" />
                            </span>
                        </div>

                        {/* Overdue Glow Pulse */}
                        {card.pulse && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                            </span>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}
