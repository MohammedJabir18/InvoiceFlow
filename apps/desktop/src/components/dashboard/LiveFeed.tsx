import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertCircle, FilePlus2, ArrowRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { InvoiceSummary, ClientResponse } from "../../lib/api";
import { useSettingsStore } from "../../store/settingsStore";
import { formatMoney, getCurrencyInfo } from "../../lib/currencies";

interface Props {
    invoices: InvoiceSummary[];
    clients: ClientResponse[];
}

export function LiveFeed({ invoices, clients }: Props) {
    const navigate = useNavigate();
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";
    const clientName = (id: string) => clients.find((c) => c.id === id)?.name || "Client Connection";

    const formatCurrency = (total: string, fromCurrency?: string) => {
        const num = parseFloat(total);
        if (isNaN(num)) return total;
        return formatMoney(num, currency, fromCurrency || "USD");
    };

    // Generate events from real invoice data
    const events = invoices
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 8)
        .map((inv) => {
            const status = inv.status.toLowerCase();
            const currInfo = getCurrencyInfo(inv.currency || "USD");

            switch (status) {
                case "paid":
                    return {
                        id: inv.id,
                        number: inv.number,
                        flag: currInfo.flag,
                        client: clientName(inv.client_id),
                        amount: formatCurrency(inv.total, inv.currency),
                        statusText: "Settled",
                        time: inv.issue_date,
                        icon: CheckCircle2,
                        color: "text-emerald-400",
                        bg: "bg-emerald-500/10",
                        border: "border-emerald-500/20",
                        badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                    };
                case "overdue":
                    return {
                        id: inv.id,
                        number: inv.number,
                        flag: currInfo.flag,
                        client: clientName(inv.client_id),
                        amount: formatCurrency(inv.total, inv.currency),
                        statusText: "Overdue",
                        time: inv.due_date,
                        icon: AlertCircle,
                        color: "text-rose-400",
                        bg: "bg-rose-500/10",
                        border: "border-rose-500/20",
                        badgeBg: "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                    };
                case "sent":
                    return {
                        id: inv.id,
                        number: inv.number,
                        flag: currInfo.flag,
                        client: clientName(inv.client_id),
                        amount: formatCurrency(inv.total, inv.currency),
                        statusText: "Dispatched",
                        time: inv.issue_date,
                        icon: ArrowRight,
                        color: "text-blue-400",
                        bg: "bg-blue-500/10",
                        border: "border-blue-500/20",
                        badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                    };
                case "pending":
                    return {
                        id: inv.id,
                        number: inv.number,
                        flag: currInfo.flag,
                        client: clientName(inv.client_id),
                        amount: formatCurrency(inv.total, inv.currency),
                        statusText: "Pending",
                        time: inv.issue_date,
                        icon: Clock,
                        color: "text-amber-400",
                        bg: "bg-amber-500/10",
                        border: "border-amber-500/20",
                        badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                    };
                default:
                    return {
                        id: inv.id,
                        number: inv.number,
                        flag: currInfo.flag,
                        client: clientName(inv.client_id),
                        amount: formatCurrency(inv.total, inv.currency),
                        statusText: "Draft",
                        time: inv.issue_date,
                        icon: FilePlus2,
                        color: "text-slate-400",
                        bg: "bg-white/[0.04]",
                        border: "border-white/10",
                        badgeBg: "bg-white/[0.06] text-slate-400 border border-white/10"
                    };
            }
        });

    return (
        <div className="flex h-full flex-col relative w-full">
            <div className="mb-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                        Live Settlement Stream
                    </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-white/[0.04] daylight:bg-slate-100 border border-white/10 daylight:border-slate-200 text-emerald-400 daylight:text-emerald-600">
                    Real-Time Ledger
                </span>
            </div>

            <div className="relative flex-1 overflow-hidden min-h-[300px]">
                {/* Bottom fade mask */}
                <div className="pointer-events-none absolute bottom-0 inset-x-0 z-10 h-12 bg-gradient-to-t from-[#0B0F19] daylight:from-white to-transparent" />

                <div className="custom-scrollbar absolute inset-0 w-full overflow-y-auto pb-12 pr-1 space-y-2.5">
                    {events.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                            <Clock size={36} className="mb-3 text-[var(--text-muted)] opacity-40 animate-pulse" />
                            <p className="text-sm font-semibold text-[var(--foreground)]">No settlement events yet</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Create your first invoice to initialize real-time ledger streaming.</p>
                        </div>
                    ) : (
                        events.map((event, i) => (
                            <motion.div
                                key={`${event.id}-${i}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04, type: "spring", stiffness: 450, damping: 25 }}
                                className="group/item flex items-center justify-between p-3 rounded-xl border border-white/5 daylight:border-slate-200 bg-white/[0.02] daylight:bg-white hover:bg-white/[0.05] daylight:hover:bg-slate-50 transition-all duration-200"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                     <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border ${event.border} ${event.bg} ${event.color}`}>
                                         <event.icon size={15} />
                                     </div>
                                     <div className="min-w-0">
                                         <div className="flex items-center gap-2">
                                             <span className="text-xs">{event.flag}</span>
                                             <span className="font-bold text-sm text-[var(--foreground)] truncate tracking-tight">
                                                 {event.client}
                                             </span>
                                             <span className="font-mono text-[10px] text-slate-400">
                                                 #{event.number}
                                             </span>
                                         </div>
                                         <div className="flex items-center gap-2 mt-0.5">
                                             <span className="font-mono text-xs font-black text-[var(--foreground)]">
                                                 {event.amount}
                                             </span>
                                             <span className="text-[10px] font-mono text-slate-400">
                                                 • {event.time}
                                             </span>
                                         </div>
                                     </div>
                                 </div>

                                 <div className="flex items-center gap-2 shrink-0">
                                     <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider ${event.badgeBg}`}>
                                         {event.statusText}
                                     </span>
                                     <button
                                         onClick={() => navigate('/invoices')}
                                         className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                                         title="View Details"
                                     >
                                         <ExternalLink size={13} />
                                     </button>
                                 </div>
                             </motion.div>
                         ))
                    )}
                </div>
            </div>
        </div>
    );
}
