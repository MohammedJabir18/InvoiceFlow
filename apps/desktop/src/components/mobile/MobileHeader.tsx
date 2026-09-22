import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Menu, FileText, FileCheck2, Zap } from "lucide-react";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { ThemeToggle } from "../ThemeToggle";

interface MobileHeaderProps {
    onOpenMenu: () => void;
}

export function MobileHeader({ onOpenMenu }: MobileHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPlan = useSubscriptionStore(state => state.currentPlan);
    const [showQuickCreate, setShowQuickCreate] = useState(false);

    // Get current title from path
    const getTitle = () => {
        const path = location.pathname;
        if (path.includes("/invoices")) return "Invoices";
        if (path.includes("/quotations")) return "Quotations";
        if (path.includes("/reports")) return "Monthly Report";
        if (path.includes("/clients")) return "Clients";
        if (path.includes("/deals")) return "Deals";
        if (path.includes("/settings")) return "Settings";
        if (path.includes("/subscription")) return "Subscription";
        if (path.includes("/about")) return "About";
        return "Dashboard";
    };

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#0c1322]/90 backdrop-blur-xl border-b border-white/10 px-4 flex items-center justify-between">
            {/* Left: Brand / Title */}
            <div className="flex items-center gap-2.5">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/20"
                >
                    IF
                </button>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                        {getTitle()}
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-mono font-medium border border-blue-500/30">
                            {currentPlan.tier.toUpperCase()}
                        </span>
                    </span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Quick New Button */}
                <div className="relative">
                    <button
                        onClick={() => setShowQuickCreate(!showQuickCreate)}
                        className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 active:scale-95 transition-all"
                        title="Quick Create"
                    >
                        <Plus size={16} />
                    </button>

                    {showQuickCreate && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowQuickCreate(false)}
                            />
                            <div className="absolute right-0 top-10 w-48 bg-[#161f30] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-white">
                                <button
                                    onClick={() => {
                                        setShowQuickCreate(false);
                                        navigate("/editor");
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-600/20 text-gray-200 hover:text-white transition-all text-left"
                                >
                                    <FileText size={15} className="text-blue-400" />
                                    <span>New Invoice</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowQuickCreate(false);
                                        navigate("/quotations?create=true");
                                    }}
                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-amber-600/20 text-gray-200 hover:text-white transition-all text-left"
                                >
                                    <FileCheck2 size={15} className="text-amber-400" />
                                    <span>New Quotation</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Menu Toggle */}
                <button
                    onClick={onOpenMenu}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                    title="Menu"
                >
                    <Menu size={18} />
                </button>
            </div>
        </header>
    );
}
