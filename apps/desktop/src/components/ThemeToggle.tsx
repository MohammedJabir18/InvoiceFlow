import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"midnight" | "daylight">("midnight");

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === "daylight") {
            root.classList.add("daylight");
        } else {
            root.classList.remove("daylight");
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "midnight" ? "daylight" : "midnight"));
    };

    return (
        <button
            onClick={toggleTheme}
            className="relative flex h-8 w-14 items-center rounded-full bg-white/5 p-1 shadow-inner backdrop-blur-md transition-colors hover:bg-white/10"
        >
            <motion.div
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className={`flex h-6 w-6 items-center justify-center rounded-full shadow-md ${theme === "midnight" ? "bg-[var(--color-electric-teal)]" : "bg-[var(--color-deep-ocean)] translate-x-6"
                    }`}
            >
                {theme === "midnight" ? (
                    <Moon className="h-3 w-3 text-black" />
                ) : (
                    <Sun className="h-3 w-3 text-white" />
                )}
            </motion.div>
        </button>
    );
}
