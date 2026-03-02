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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };

    // Generate events from real invoice data
    const events = invoices
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 8)
        .map((inv) => {
            const status = inv.status.toLowerCase();
            switch (status) {
                case "paid":
                    return {
                        id: inv.id,
                        message: `Payment received: ${formatCurrency(inv.total)} from ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: CheckCircle2,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                    };
                case "overdue":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} is overdue`,
                        time: inv.due_date,
                        icon: AlertCircle,
                        color: "text-rose-500",
                        bg: "bg-rose-500/10",
                    };
                case "sent":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} sent to ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: ArrowRight,
                        color: "text-[var(--primary)]",
                        bg: "bg-[var(--primary)]/10",
                    };
                case "pending":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} is pending payment`,
                        time: inv.issue_date,
                        icon: Clock,
                        color: "text-amber-500",
                        bg: "bg-amber-500/10",
                    };
                default:
                    return {
                        id: inv.id,
                        message: `Draft created for ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: FilePlus2,
                        color: "text-gray-400",
                        bg: "bg-gray-500/10",
                    };
            }
        });

    return (
        <div className="flex h-full flex-col relative w-full p-6">
            <div className="mb-6 flex items-center justify-between z-10">
                <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Activity Feed</h3>
                <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                </span>
            </div>

            <div className="relative flex-1 overflow-hidden">
                {/* Scroll mask for fading out bottom elements */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 z-10 h-16 bg-gradient-to-t from-[var(--surface)] to-transparent" />

                <div className="custom-scrollbar absolute inset-0 w-full overflow-y-auto pb-16 pr-2">
                    {events.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                            <Clock size={32} className="mb-3 text-[var(--text-tertiary)] opacity-50" />
                            <p className="text-sm font-medium text-[var(--foreground)]">No recent activity.</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Generate invoices to see them here.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {events.map((event, i) => (
                                <motion.div
                                    key={`${event.id}-${i}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05, type: "spring", stiffness: 100, damping: 15 }}
                                    className="group flex items-start gap-4 rounded-xl border border-transparent bg-white/5 p-3.5 transition-colors hover:bg-white/10"
                                >
                                    <div className={`shrink-0 block rounded-lg p-2 shadow-inner transition-colors duration-300 group-hover:bg-opacity-20 ${event.bg} ${event.color}`}>
                                        <event.icon size={16} />
                                    </div>
                                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                                        <p className="truncate text-sm font-medium text-[var(--foreground)] opacity-90 transition-opacity group-hover:opacity-100">{event.message}</p>
                                        <p className="mt-1 font-mono text-[11px] font-semibold tracking-wider text-[var(--text-tertiary)] opacity-80 uppercase">{event.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
