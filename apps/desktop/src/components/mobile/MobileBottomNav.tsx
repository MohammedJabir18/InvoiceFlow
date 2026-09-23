import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, FileCheck2, BarChart3, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface MobileBottomNavProps {
    onOpenMenu?: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const items = [
        { label: "Home", path: "/dashboard", icon: LayoutDashboard },
        { label: "Invoices", path: "/invoices", icon: FileText },
        { label: "Quotes", path: "/quotations", icon: FileCheck2 },
        { label: "Analytics", path: "/reports", icon: BarChart3 },
        { label: "More", action: onOpenMenu || (() => navigate("/settings")), icon: Layers, isAction: true },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c1322]/90 daylight:bg-white/95 backdrop-blur-xl border-t border-white/10 daylight:border-slate-200 px-3 py-2 safe-area-pb transition-colors shadow-[0_-10px_25px_rgba(0,0,0,0.2)] daylight:shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <nav className="flex items-center justify-around">
                {items.map((item) => {
                    const isActive = !item.isAction && (
                        location.pathname === item.path ||
                        (item.path === "/invoices" && location.pathname.startsWith("/editor"))
                    );
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            onClick={() => {
                                if (item.isAction && item.action) {
                                    item.action();
                                } else if (item.path) {
                                    navigate(item.path);
                                }
                            }}
                            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                                isActive ? "text-blue-400 daylight:text-indigo-600 font-semibold" : "text-gray-400 daylight:text-slate-500 hover:text-gray-200 daylight:hover:text-slate-800"
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-indicator"
                                    className="absolute -top-1.5 w-6 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                                />
                            )}
                            <Icon size={20} className={isActive ? "stroke-[2.5]" : "stroke-[1.8]"} />
                            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
