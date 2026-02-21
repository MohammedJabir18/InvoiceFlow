import { FilePlus, UserPlus, FileText, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const actions = [
    { icon: FilePlus, label: "Generate Invoice", desc: "Draft a new billable item", color: "text-[#60a5fa]", bg: "bg-[#60a5fa]/10", border: "border-[#60a5fa]/20", path: "/invoices" },
    { icon: UserPlus, label: "Add Client", desc: "Register a new connection", color: "text-[#c084fc]", bg: "bg-[#c084fc]/10", border: "border-[#c084fc]/20", path: "/clients" },
    { icon: FileText, label: "Financials", desc: "View all your invoices", color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", path: "/invoices" },
    { icon: Settings, label: "Preferences", desc: "Configure app settings", color: "text-[#f472b6]", bg: "bg-[#f472b6]/10", border: "border-[#f472b6]/20", path: "/settings" },
];

export function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden border border-white/5">
            <h3 className="text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-widest mb-4 z-10 relative">Quick Actions</h3>

            <div className="flex flex-col gap-3 flex-1 justify-center z-10 relative">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.02, x: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 transition-all group w-full text-left"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(action.path)}
                    >
                        <div className={`p-3 rounded-lg ${action.bg} ${action.color} border ${action.border} group-hover:shadow-[0_0_15px_currentColor] transition-shadow duration-300`}>
                            <action.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="block font-semibold text-[var(--foreground)] opacity-90 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                                {action.label}
                            </span>
                            <span className="block text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                                {action.desc}
                            </span>
                        </div>
                    </motion.button>
                ))}
            </div>

            <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary)] opacity-[0.05] blur-[60px] pointer-events-none" />
        </div>
    );
}
