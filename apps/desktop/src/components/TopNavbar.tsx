import { useEffect, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelector } from "./CurrencySelector";

export function TopNavbar() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 20);
    });

    return (
        <motion.header
            className="hidden md:flex fixed top-0 left-0 right-0 z-40 h-20 items-center justify-end px-8 transition-all duration-500"
            initial={false}
            animate={{
                backgroundColor: scrolled ? "var(--surface)" : "transparent",
                backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
                borderBottom: scrolled ? "1px solid color-mix(in srgb, var(--foreground) 5%, transparent)" : "1px solid transparent",
            }}
            style={{
                background: scrolled ? 'color-mix(in srgb, var(--surface) 60%, transparent)' : 'transparent',
            }}
        >
            <div className="flex items-center gap-3">
                <CurrencySelector />
                <ThemeToggle />
            </div>
        </motion.header>
    );
}
