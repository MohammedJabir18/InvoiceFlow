import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
    X,
    LayoutDashboard,
    FileText,
    FileCheck2,
    BarChart3,
    Users,
    Sparkles,
    CreditCard,
    Settings,
    Info,
    ChevronRight,
    Zap
} from "lucide-react";
import { useSubscriptionStore } from "../../store/subscriptionStore";

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenuDrawer({ isOpen, onClose }: MobileMenuDrawerProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPlan = useSubscriptionStore(state => state.currentPlan);

    const links = [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Invoices", path: "/invoices", icon: FileText },
        { label: "Quotations & Estimates", path: "/quotations", icon: FileCheck2 },
        { label: "Monthly Reports", path: "/reports", icon: BarChart3 },
        { label: "Clients Directory", path: "/clients", icon: Users },
        { label: "Deals & CRM (AI)", path: "/deals", icon: Sparkles },
        { label: "Subscription & Plans", path: "/subscription", icon: CreditCard, highlight: true },
        { label: "Settings", path: "/settings", icon: Settings },
        { label: "About InvoiceFlow", path: "/about", icon: Info },
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 280 }}
                        className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#0f172a] border-t border-white/10 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden text-white"
                    >
                        {/* Drag Pill */}
                        <div className="pt-3 pb-1 flex justify-center">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/20">
                                    IF
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">InvoiceFlow Mobile</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        <span className="text-[11px] text-gray-400 font-mono">Plan: {currentPlan.name}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Links List */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                            {links.map((link) => {
                                const isActive = location.pathname === link.path;
                                const Icon = link.icon;

                                return (
                                    <button
                                        key={link.path}
                                        onClick={() => handleNavigate(link.path)}
                                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all ${
                                            isActive
                                                ? "bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30"
                                                : link.highlight
                                                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/15"
                                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl ${
                                                isActive ? "bg-blue-500/20 text-blue-400" : link.highlight ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-400"
                                            }`}>
                                                <Icon size={18} />
                                            </div>
                                            <span className="text-sm">{link.label}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-500" />
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer CTA */}
                        <div className="p-4 border-t border-white/10 bg-[#0c1322]">
                            <button
                                onClick={() => handleNavigate("/subscription")}
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Zap size={14} className="fill-current text-amber-300" />
                                <span>Manage Subscription Tier</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
