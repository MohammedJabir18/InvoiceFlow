import { FilePlus, UserPlus, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const actions = [
    { icon: FilePlus, label: "Generate Invoice", desc: "Draft a new billable item", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", glow: "hover:shadow-[0_0_15px_rgba(96,165,250,0.3)]", path: "/invoices" },
    { icon: UserPlus, label: "Add Client", desc: "Register a new connection", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", glow: "hover:shadow-[0_0_15px_rgba(192,132,252,0.3)]", path: "/clients" },
    { icon: FileText, label: "Financials", desc: "View all your invoices", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "hover:shadow-[0_0_15px_rgba(52,211,153,0.3)]", path: "/invoices" },
    { icon: Settings, label: "Preferences", desc: "Configure app settings", color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20", glow: "hover:shadow-[0_0_15px_rgba(244,114,182,0.3)]", path: "/settings" },
];

export function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="flex h-full flex-col relative w-full p-6">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Quick Commands</h3>

            <div className="flex flex-col gap-3 flex-1 justify-center z-10 w-full">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center gap-4 rounded-xl border border-transparent bg-white/5 p-3 text-left transition-all hover:bg-white/10 ${action.glow}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(action.path)}
                    >
                        <div className={`p-3 rounded-lg ${action.bg} ${action.color} border ${action.border} transition-colors duration-300 group-hover:bg-opacity-20`}>
                            <action.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block font-semibold text-[var(--foreground)] opacity-90 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                {action.label}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--text-tertiary)]">
                                {action.desc}
                            </span>
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-[var(--primary)] opacity-[0.03] blur-[60px]" />
        </div>
    );
}
