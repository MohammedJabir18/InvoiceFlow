import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertCircle, FileText } from "lucide-react";
import type { InvoiceSummary, ClientResponse } from "../../lib/api";

interface Props {
    invoices: InvoiceSummary[];
    clients: ClientResponse[];
}

export function LiveFeed({ invoices, clients }: Props) {
    const clientName = (id: string) => clients.find((c) => c.id === id)?.name || "Unknown";

    const formatCurrency = (total: string) => {
        const num = parseFloat(total);
        return isNaN(num) ? total : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
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
                        icon: CheckCircle,
                        color: "text-emerald-400",
                    };
                case "overdue":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} is overdue`,
                        time: inv.due_date,
                        icon: AlertCircle,
                        color: "text-rose-400",
                    };
                case "sent":
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} sent to ${clientName(inv.client_id)}`,
                        time: inv.issue_date,
                        icon: Clock,
                        color: "text-amber-400",
                    };
                default:
                    return {
                        id: inv.id,
                        message: `Invoice ${inv.number} created as ${status}`,
                        time: inv.issue_date,
                        icon: FileText,
                        color: "text-blue-400",
                    };
            }
        });

    return (
        <div className="h-full flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[var(--secondary)] text-xs font-bold uppercase tracking-widest">Live Feed</h3>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>

            <div className="flex-1 overflow-hidden relative mask-linear-fade">
                <div className="space-y-4 absolute w-full">
                    {events.length === 0 ? (
                        <p style={{ textAlign: "center", opacity: 0.4, fontSize: 13, paddingTop: 20 }}>
                            No activity yet. Create your first invoice!
                        </p>
                    ) : (
                        events.map((event, i) => (
                            <motion.div
                                key={`${event.id}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-3 p-3 rounded-lg bg-white/2 hover:bg-white/5 transition-colors border border-white/5"
                            >
                                <div className={`${event.color} mt-0.5`}>
                                    <event.icon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--foreground)] truncate">{event.message}</p>
                                    <p className="text-xs text-[var(--foreground)] opacity-50 mt-0.5">{event.time}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
