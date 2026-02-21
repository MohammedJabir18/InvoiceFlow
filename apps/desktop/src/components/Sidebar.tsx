import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    TrendingUp,
    Bell,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
    {
        label: "Overview", items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
            { icon: TrendingUp, label: "Analytics", path: "/dashboard", badge: "Soon" },
        ]
    },
    {
        label: "Manage", items: [
            { icon: FileText, label: "Invoices", path: "/invoices" },
            { icon: Users, label: "Clients", path: "/clients" },
        ]
    },
    {
        label: "System", items: [
            { icon: Settings, label: "Settings", path: "/settings" },
        ]
    },
];

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <motion.aside
            className="sidebar glass-panel h-screen w-64 flex flex-col fixed left-0 top-0 border-r border-white/5 z-50"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-electric-teal)] to-[var(--color-cyber-violet)] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-teal-500/20">
                        IF
                    </div>
                    <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
                        InvoiceFlow
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
                {navItems.map((section) => (
                    <div key={section.label}>
                        <div className="px-3 mb-2 text-xs font-semibold text-[var(--secondary)] uppercase tracking-wider opacity-80">
                            {section.label}
                        </div>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div
                                        key={item.label}
                                        className={`relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive
                                                ? "bg-[var(--primary)] text-white shadow-lg shadow-blue-900/20"
                                                : "text-[var(--foreground)] hover:bg-white/5 text-opacity-70 hover:text-opacity-100"
                                            }`}
                                        onClick={() => navigate(item.path)}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <item.icon size={18} className={isActive ? "text-[var(--color-electric-teal)]" : "opacity-70"} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-cyber-violet)] text-white/90">
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute left-0 w-1 h-6 bg-[var(--color-electric-teal)] rounded-r-full"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.2 }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
                        <Bell size={14} />
                        <span>v0.1.0</span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </motion.aside>
    );
}
