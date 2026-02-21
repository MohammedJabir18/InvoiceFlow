import { FilePlus, UserPlus, FileText, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const actions = [
    { icon: FilePlus, label: "Create Invoice", color: "text-blue-400", bg: "bg-blue-400/10", path: "/editor" },
    { icon: UserPlus, label: "Add Client", color: "text-purple-400", bg: "bg-purple-400/10", path: "/clients" },
    { icon: FileText, label: "View Invoices", color: "text-emerald-400", bg: "bg-emerald-400/10", path: "/invoices" },
    { icon: BarChart3, label: "Settings", color: "text-pink-400", bg: "bg-pink-400/10", path: "/settings" },
];

export function QuickActions() {
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden">
            <h3 className="text-[var(--secondary)] text-xs font-bold uppercase tracking-widest mb-4">Quick Actions</h3>

            <div className="flex flex-col gap-3 flex-1 justify-center">
                {actions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group w-full text-left"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(action.path)}
                    >
                        <div className={`p-2.5 rounded-lg ${action.bg} ${action.color} group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-shadow`}>
                            <action.icon size={20} />
                        </div>
                        <span className="font-medium text-[var(--foreground)] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                            {action.label}
                        </span>
                    </motion.button>
                ))}
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyber-violet)] opacity-5 blur-[60px] pointer-events-none" />
        </div>
    );
}
