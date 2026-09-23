import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    FileCheck2,
    BarChart3,
    Users,
    Settings,
    TrendingUp,
    User,
    CreditCard
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Invoices", path: "/invoices" },
    { icon: FileCheck2, label: "Quotations", path: "/quotations" },
    { icon: BarChart3, label: "Analytics", path: "/reports" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: TrendingUp, label: "Deals", path: "/deals" },
];

const systemItems = [
    { icon: CreditCard, label: "Subscription", path: "/subscription" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "About", path: "/about" },
];

export function FloatingSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <motion.aside
            className="hidden md:flex fixed left-6 top-6 bottom-6 z-50 w-20 flex-col items-center justify-between p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-2xl daylight:from-slate-200 daylight:via-slate-100 daylight:to-slate-200 daylight:border-slate-300 daylight:shadow-[0_16px_35px_-8px_rgba(15,23,42,0.06)] sm:w-22 transition-all duration-300"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
        >
            <div className="relative w-full h-full flex flex-col items-center justify-between py-5 rounded-[calc(1rem-1px)] bg-[#0D0F15]/95 daylight:bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)] transition-colors duration-300">
                {/* Precision Monogram Badge */}
                <motion.div
                    className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 shadow-[0_2px_10px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] border border-blue-400/30 transition-all duration-200"
                    onClick={() => navigate('/dashboard')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <span className="font-extrabold text-white text-lg tracking-tight select-none">IF</span>
                </motion.div>

                {/* Primary Navigation */}
                <nav className="flex flex-col items-center gap-2.5 my-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                isActive={isActive}
                                onClick={() => navigate(item.path)}
                            />
                        );
                    })}
                </nav>

                {/* System Navigation */}
                <div className="flex flex-col items-center gap-2.5">
                    <div className="h-px w-8 bg-white/[0.08] daylight:bg-slate-200" />
                    {systemItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <NavItem
                                key={item.label}
                                icon={item.icon}
                                label={item.label}
                                isActive={isActive}
                                onClick={() => navigate(item.path)}
                            />
                        );
                    })}
                </div>
            </div>
        </motion.aside>
    );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <motion.button
            className="group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 outline-none cursor-pointer"
            onClick={onClick}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            title={label}
        >
            {/* Active Precision Capsule */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-xl bg-blue-600/15 border border-blue-500/30 daylight:bg-blue-50 daylight:border-blue-200 shadow-[0_2px_8px_rgba(37,99,235,0.15)]"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                )}
            </AnimatePresence>

            <Icon
                strokeWidth={isActive ? 2.2 : 1.75}
                className={cn(
                    "relative z-10 h-5 w-5 transition-all duration-200",
                    isActive
                        ? "text-blue-500 daylight:text-blue-600"
                        : "text-slate-400 group-hover:text-white daylight:text-slate-500 daylight:group-hover:text-slate-900"
                )}
            />

            {/* Swiss Precision Tooltip */}
            <div className="pointer-events-none absolute left-full ml-3.5 flex origin-left items-center opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-1 z-50">
                <div className="rounded-lg bg-[#13161F] daylight:bg-white px-3 py-1.5 text-xs font-semibold text-slate-200 daylight:text-slate-800 shadow-xl border border-white/10 daylight:border-slate-200 tracking-tight whitespace-nowrap">
                    {label}
                </div>
            </div>
        </motion.button>
    );
}
