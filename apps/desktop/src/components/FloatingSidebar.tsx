import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    TrendingUp,
    User
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: FileText, label: "Invoices", path: "/invoices" },
    { icon: Users, label: "Clients", path: "/clients" },
    { icon: TrendingUp, label: "Deals (AI)", path: "/deals" },
];

const systemItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: User, label: "About", path: "/about" },
];

export function FloatingSidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <motion.aside
            className="fixed left-6 top-6 bottom-6 z-50 flex w-20 flex-col items-center justify-between rounded-3xl border border-white/10 bg-[var(--surface)]/50 py-8 shadow-2xl backdrop-blur-3xl dark:border-white/5 dark:bg-white/[0.02] sm:w-24 transition-colors duration-500"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Logo area */}
            <div
                className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_40%,transparent)] transition-transform duration-300 hover:scale-110"
                onClick={() => navigate('/dashboard')}
            >
                <span className="font-extrabold text-white text-lg tracking-tight">IF</span>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
            </div>

            {/* Main Navigation */}
            <nav className="flex flex-col items-center gap-4">
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
            <div className="flex flex-col items-center gap-4">
                <div className="h-px w-8 bg-black/10 dark:bg-white/10" />
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
        </motion.aside>
    );
}

function NavItem({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive: boolean, onClick: () => void }) {
    return (
        <motion.button
            className="group relative flex h-12 w-12 items-center justify-center rounded-xl transition-colors outline-none"
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title={label}
        >
            {/* Active Background Pill */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-xl bg-[var(--primary)]/15 dark:bg-[var(--primary)]/20"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    />
                )}
            </AnimatePresence>

            <Icon
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                    "relative z-10 h-5 w-5 transition-colors duration-300",
                    isActive
                        ? "text-[var(--primary)] drop-shadow-[0_0_8px_color-mix(in_srgb,var(--primary)_50%,transparent)]"
                        : "text-[var(--foreground)]/60 group-hover:text-[var(--foreground)]"
                )}
            />

            {/* Hover tooltip - optional for awwwards-tier polish */}
            <div className="pointer-events-none absolute left-full ml-4 flex origin-left items-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 z-50">
                <div className="rounded-lg bg-[var(--surface)]/90 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] shadow-xl ring-1 ring-white/10 dark:ring-white/5 uppercase tracking-wide">
                    {label}
                </div>
            </div>
        </motion.button>
    );
}
