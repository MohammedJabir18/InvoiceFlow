import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    TrendingUp,
    Bell,
    CheckCircle
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
            className="sidebar glass-panel h-screen w-64 flex flex-col fixed left-0 top-0 z-50 border-r border-white/5 bg-[var(--surface)]/40 backdrop-blur-2xl"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}
        >
            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-white/5 relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10 w-full cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/dashboard')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                        IF
                    </div>
                    <span className="font-extrabold text-xl tracking-tight text-gradient">
                        InvoiceFlow
                    </span>
                </div>
                {/* Logo ambient glow */}
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-[var(--primary)] opacity-20 blur-[40px] rounded-full pointer-events-none" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-8 custom-scrollbar">
                {navItems.map((section) => (
                    <div key={section.label}>
                        <div className="px-2 mb-3 text-[11px] font-bold text-[var(--foreground)] uppercase tracking-[0.2em] opacity-60 pl-3">
                            {section.label}
                        </div>
                        <div className="space-y-1.5">
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <motion.div
                                        key={item.label}
                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-300 group overflow-hidden ${isActive
                                            ? "bg-[var(--foreground)]/10 shadow-lg border border-[var(--foreground)]/10"
                                            : "text-[var(--foreground)] hover:bg-[var(--foreground)]/5 border border-transparent opacity-80 hover:opacity-100"
                                            }`}
                                        onClick={() => navigate(item.path)}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        {/* Hover gradient background */}
                                        {!isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-[var(--foreground)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        )}

                                        <div className={`relative z-10 p-1.5 rounded-lg transition-colors ${isActive ? 'bg-[var(--primary)] text-[var(--background)] shadow-[0_0_15px_rgba(45,212,191,0.4)]' : 'text-[var(--foreground)] opacity-70 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/10 group-hover:opacity-100'}`}>
                                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                        </div>

                                        <span className={`relative z-10 text-sm font-semibold transition-colors ${isActive ? 'text-[var(--foreground)]' : 'text-[var(--foreground)]'}`}>
                                            {item.label}
                                        </span>

                                        {item.badge && (
                                            <span className="relative z-10 ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--secondary)] text-white shadow-[0_0_10px_rgba(124,58,237,0.3)]">
                                                {item.badge}
                                            </span>
                                        )}

                                        {/* Active glow indicator */}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabGlow"
                                                className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-10 bg-[var(--primary)] rounded-full blur-[4px]"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 0.8 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        )}
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--foreground)] rounded-r-full"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
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
            <div className="p-4 border-t border-[var(--foreground)]/5 bg-[var(--surface)]/40 backdrop-blur-3xl relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent" />
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 text-[11px] text-[var(--foreground)] opacity-70 font-mono font-medium px-2 py-1.5 rounded-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/5">
                        <CheckCircle size={14} className="text-emerald-400" />
                        <span>System Online</span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </motion.aside>
    );
}
