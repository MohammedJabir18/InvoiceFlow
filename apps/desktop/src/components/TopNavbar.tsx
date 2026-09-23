import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Search, Radio } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelector } from "./CurrencySelector";

export function TopNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    const triggerCommandPalette = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }));
    };

    return (
        <motion.header
            className="hidden md:flex fixed top-6 right-8 z-40 items-center justify-end transition-all duration-500"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
        >
            {/* Detached Floating Island Precision Capsule */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0D0F15]/90 daylight:bg-white/95 border border-white/[0.08] daylight:border-slate-200 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6)] daylight:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.06)] backdrop-blur-2xl">
                {/* Live Node Signal Pill */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] daylight:bg-slate-100 border border-white/[0.06] daylight:border-slate-200 text-xs font-semibold text-slate-300 daylight:text-slate-700">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                    </span>
                    <span className="tracking-tight text-[11px] font-mono text-slate-400 daylight:text-slate-600">ENGINE ACTIVE</span>
                </div>

                {/* Quick Search Trigger */}
                <motion.button
                    onClick={triggerCommandPalette}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] daylight:bg-slate-100/90 hover:bg-white/[0.08] daylight:hover:bg-slate-200 border border-white/5 daylight:border-slate-200 text-xs font-medium text-slate-300 daylight:text-slate-700 hover:text-white transition-all cursor-pointer"
                >
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden xl:inline text-[11px] font-mono tracking-tight text-slate-400">⌘K Quick Command</span>
                </motion.button>

                <div className="h-4 w-px bg-white/10 daylight:bg-slate-300" />

                {/* Global Currency Pill */}
                <CurrencySelector />

                {/* Theme Mode Dial */}
                <ThemeToggle />
            </div>
        </motion.header>
    );
}
