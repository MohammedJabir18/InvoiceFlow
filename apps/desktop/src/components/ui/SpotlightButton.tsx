import { useRef, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface SpotlightButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: "primary" | "white" | "emerald" | "secondary" | "danger" | "ghost" | "cyber";
    size?: "sm" | "md" | "lg";
    className?: string;
    icon?: React.ReactNode;
    nestedIcon?: boolean;
}

/**
 * Swiss Haute Fintech Tactile Button
 * - High-conversion physical feel with 1px top specular bevel
 * - Mass-spring press feedback (`whileTap: scale(0.98)`)
 * - Radial pointer-following micro specular highlight
 * - Nested tactile icon badge
 */
export function SpotlightButton({
    children,
    variant = "primary",
    size = "md",
    className,
    icon,
    nestedIcon = false,
    ...props
}: SpotlightButtonProps) {
    const divRef = useRef<HTMLButtonElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!divRef.current || isFocused) return;

        const div = divRef.current;
        const rect = div.getBoundingClientRect();

        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] border border-blue-500/50 hover:shadow-[0_4px_16px_rgba(37,99,235,0.35)]",
        white: "bg-white hover:bg-slate-100 text-slate-950 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,1)] border border-white/60 hover:shadow-[0_6px_20px_rgba(255,255,255,0.25)]",
        emerald: "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] border border-emerald-500/50 hover:shadow-[0_4px_16px_rgba(16,185,129,0.35)]",
        secondary: "bg-white/[0.05] hover:bg-white/[0.08] text-white/90 border border-white/10 hover:border-white/20 shadow-sm daylight:bg-slate-100 daylight:border-slate-200 daylight:text-slate-800 daylight:hover:bg-slate-200",
        danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30",
        ghost: "bg-transparent text-[var(--text-muted)] hover:text-white hover:bg-white/[0.05] daylight:text-slate-600 daylight:hover:text-slate-900 daylight:hover:bg-slate-100",
        cyber: "bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] border border-blue-500/50"
    };

    const sizes = {
        sm: "px-3.5 py-1.5 text-xs gap-2 rounded-lg",
        md: "px-5 py-2.5 text-sm gap-2.5 rounded-xl",
        lg: "px-7 py-3 text-base gap-3 rounded-xl",
    };

    return (
        <motion.button
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
                "group relative inline-flex items-center justify-center overflow-hidden font-medium tracking-tight transition-all duration-200",
                sizes[size],
                variants[variant],
                className
            )}
            {...props}
        >
            {/* Dynamic Cursor Micro-Spotlight Overlay */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.18), transparent 65%)`,
                }}
            />

            {/* Label and Content */}
            <span className="relative z-10 flex items-center gap-2">
                {children}
            </span>

            {/* Tactile Nested Icon Bubble */}
            {icon && (
                <span className={cn(
                    "relative z-10 flex items-center justify-center shrink-0 w-5 h-5 rounded-lg",
                    variant === "primary" || variant === "emerald" || variant === "cyber" ? "bg-white/20 text-white" :
                    variant === "white" ? "bg-slate-900/10 text-slate-950" :
                    "bg-white/10 text-[var(--foreground)]",
                    "transition-transform duration-200 ease-out",
                    "group-hover:translate-x-0.5 group-hover:scale-105"
                )}>
                    {icon}
                </span>
            )}
        </motion.button>
    );
}
