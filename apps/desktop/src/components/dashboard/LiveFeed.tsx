import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, FilePlus2, ArrowRight } from "lucide-react";
import type { InvoiceSummary, ClientResponse } from "../../lib/api";
import { useSettingsStore } from "../../store/settingsStore";

interface Props {
    invoices: InvoiceSummary[];
    clients: ClientResponse[];
}

export function LiveFeed({ invoices, clients }: Props) {
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";
    const clientName = (id: string) => clients.find((c) => c.id === id)?.name || "Unknown";

    const formatCurrency = (total: string) => {
        const num = parseFloat(total);
        if (isNaN(num)) return total;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    // Generate events from real invoice data
    const events = invoices
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 6)
        .map((inv) => {
            const status = inv.status.toLowerCase();
            switch (status) {
                case "paid":
                    return {
                        id: inv.id,
                        message: `Payment received: ${formatCurrency(inv.total)} from ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: CheckCircle2,
                        color: "text-[#34d399]",
                        bg: "bg-[#34d399]/10",
                    };
                case "overdue":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} is overdue`,
                        time: inv.due_date,
                        icon: AlertCircle,
                        color: "text-[#f87171]",
                        bg: "bg-[#f87171]/10",
                    };
                case "sent":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} sent to ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: ArrowRight,
                        color: "text-[#60a5fa]",
                        bg: "bg-[#60a5fa]/10",
                    };
                case "pending":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} is pending payment`,
                        time: inv.issue_date,
                        icon: Clock,
                        color: "text-[#fbbf24]",
                        bg: "bg-[#fbbf24]/10",
                    };
                default:
                    return {
                        id: inv.id,
                        message: `Draft created for ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: FilePlus2,
                        color: "text-[#9ca3af]",
                        bg: "bg-[#9ca3af]/10",
                    };
            }
        });

    return (
        <div className="h-full flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-widest">Activity Feed</h3>
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {/* Scroll mask for fading out bottom elements */}
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[var(--surface)] to-transparent z-10 pointer-events-none" />

                <div className="space-y-3 absolute w-full inset-0 overflow-y-auto pr-2 pb-12 custom-scrollbar">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <Clock size={32} className="text-[var(--text-tertiary)] mb-3 opacity-50" />
                            <p className="text-[var(--text-secondary)] text-sm font-medium">No recent activity.</p>
                            <p className="text-[var(--text-tertiary)] text-xs mt-1">Generate invoices to see them here.</p>
                        </div>
                    ) : (
                        events.map((event, i) => (
                            <motion.div
                                key={`${event.id}-${i}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                                className="flex items-start gap-4 p-3.5 rounded-xl bg-black/20 hover:bg-black/40 transition-colors border border-white/5 group"
                            >
                                <div className={`p-2 rounded-lg ${event.bg} ${event.color} shrink-0 shadow-inner block`}>
                                    <event.icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <p className="text-sm font-medium text-[var(--foreground)] truncate group-hover:text-white transition-colors">{event.message}</p>
                                    <p className="text-[11px] text-[var(--text-tertiary)] font-mono mt-1 opacity-80">{event.time}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
