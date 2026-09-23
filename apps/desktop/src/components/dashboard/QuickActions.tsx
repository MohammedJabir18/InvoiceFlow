import { FilePlus, FileCheck2, UserPlus, Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const actions = [
    {
        icon: FilePlus,
        label: "Issue Invoice",
        desc: "Instant multi-currency billing link",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        glow: "hover:border-blue-500/30",
        badge: "Direct",
        path: "/invoices"
    },
    {
        icon: FileCheck2,
        label: "Draft Quotation",
        desc: "Commercial estimate convertible to invoice",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "hover:border-emerald-500/30",
        badge: "Estimate",
        path: "/quotations"
    },
    {
        icon: Sparkles,
        label: "Pipeline & Deals",
        desc: "Track closing probabilities & pipeline value",
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20",
        glow: "hover:border-amber-400/30",
        badge: "Pipeline",
        path: "/deals"
    },
    {
        icon: UserPlus,
        label: "Add Client Entity",
        desc: "Register company, tax & credit terms",
        color: "text-slate-300",
        bg: "bg-white/[0.05]",
        border: "border-white/10",
        glow: "hover:border-white/20",
        badge: "CRM",
        path: "/clients"
    },
];

export function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="flex h-full flex-col relative w-full">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                        High-Velocity Actions
                    </h3>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-lg bg-white/[0.04] daylight:bg-slate-100 border border-white/10 daylight:border-slate-200 text-slate-400">
                    4 Triggers
                </span>
            </div>

            <div className="flex flex-col gap-2.5 flex-1 justify-center z-10 w-full">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center justify-between p-3.5 rounded-xl border border-white/5 daylight:border-slate-200 bg-white/[0.02] daylight:bg-white hover:bg-white/[0.05] daylight:hover:bg-slate-50 text-left transition-all duration-200 cursor-pointer shadow-sm ${action.glow}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 450, damping: 25 }}
                        onClick={() => navigate(action.path)}
                    >
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className={`p-2.5 rounded-xl ${action.bg} ${action.color} border ${action.border} transition-transform duration-200 group-hover:scale-105 shrink-0`}>
                                <action.icon size={17} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[var(--foreground)] tracking-tight">
                                        {action.label}
                                    </span>
                                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] daylight:bg-slate-100 text-slate-400 daylight:text-slate-600">
                                        {action.badge}
                                    </span>
                                </div>
                                <span className="mt-0.5 block truncate text-xs text-slate-400">
                                    {action.desc}
                                </span>
                            </div>
                        </div>

                        {/* Tactile Nested Arrow Button */}
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] daylight:bg-slate-100 border border-white/10 daylight:border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all duration-200 shrink-0 ml-2 shadow-sm">
                            <ArrowUpRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
