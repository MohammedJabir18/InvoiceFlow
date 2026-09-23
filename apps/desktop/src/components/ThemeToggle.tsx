import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../store/settingsStore";
import { getEffectiveTheme, commitThemePreference, THEME_CHANGE_EVENT, EffectiveTheme } from "../lib/theme";

export function ThemeToggle() {
    const profile = useSettingsStore(state => state.profile);
    const updateSettings = useSettingsStore(state => state.updateSettings);

    const [theme, setTheme] = useState<EffectiveTheme>(() => {
        return getEffectiveTheme(profile?.theme_preference);
    });

    useEffect(() => {
        const syncCurrentTheme = () => {
            setTheme(getEffectiveTheme(profile?.theme_preference));
        };
        syncCurrentTheme();

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", syncCurrentTheme);
        window.addEventListener(THEME_CHANGE_EVENT, syncCurrentTheme);
        window.addEventListener("storage", syncCurrentTheme);

        return () => {
            mediaQuery.removeEventListener("change", syncCurrentTheme);
            window.removeEventListener(THEME_CHANGE_EVENT, syncCurrentTheme);
            window.removeEventListener("storage", syncCurrentTheme);
        };
    }, [profile?.theme_preference]);

    const toggleTheme = () => {
        const nextMode = theme === "midnight" ? "light" : "dark";
        const applied = commitThemePreference(nextMode);
        setTheme(applied);
        if (profile) {
            updateSettings({ ...profile, theme_preference: nextMode });
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="group relative flex h-9 w-16 cursor-pointer items-center rounded-full border border-white/5 bg-black/20 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-300 hover:bg-black/40 overflow-hidden"
            aria-label="Toggle theme"
        >
            {/* Ambient inner glow tracking toggle state */}
            <motion.div
                className="absolute inset-0 z-0 opacity-50"
                initial={false}
                animate={{
                    background: theme === "midnight"
                        ? "radial-gradient(circle at left, var(--color-cyber-violet) 0%, transparent 60%)"
                        : "radial-gradient(circle at right, var(--color-electric-teal) 0%, transparent 60%)"
                }}
                transition={{ duration: 0.5 }}
            />

            <motion.div
                layout
                transition={{ type: "spring", stiffness: 500, damping: 25, mass: 0.8 }}
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${theme === "midnight"
                        ? "bg-gradient-to-br from-gray-800 to-black border border-white/10 ml-0 text-white"
                        : "bg-gradient-to-br from-white to-gray-200 border border-black/10 translate-x-[28px] text-black"
                    }`}
            >
                {theme === "midnight" ? (
                    <Moon className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                    <Sun className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
            </motion.div>
        </button>
    );
}
