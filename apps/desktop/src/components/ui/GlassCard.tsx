import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    innerClassName?: string;
    hoverEffect?: boolean;
    glowColor?: "primary" | "secondary" | "emerald" | "none";
}

/**
 * Awwwards-Tier Double-Bezel (Doppelrand) Hardware Card
 * Outer chassis provides machined bezel and ambient shadow.
 * Inner core provides concentric radius, backdrop blur, and specular top highlight.
 */
export function GlassCard({
    children,
    className,
    innerClassName,
    hoverEffect = true,
    glowColor = "none",
    ...props
}: GlassCardProps) {
    const glowClasses = {
        primary: "hover:border-blue-500/40 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.2)]",
        secondary: "hover:border-slate-400/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)]",
        emerald: "hover:border-emerald-500/40 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.2)]",
        none: ""
    };

    return (
        <motion.div
            className={cn(
                "group/card relative p-[1px] rounded-2xl",
                "bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent",
                "border border-white/[0.08]",
                "shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]",
                "daylight:from-slate-200/90 daylight:via-slate-100/60 daylight:to-slate-200/50",
                "daylight:border-slate-200 daylight:shadow-[0_10px_25px_-5px_rgba(15,23,42,0.05)]",
                "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                glowClasses[glowColor],
                className
            )}
            whileHover={hoverEffect ? { y: -2, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } : undefined}
            {...props}
        >
            {/* Precision Machined Inner Core */}
            <div
                className={cn(
                    "relative w-full h-full rounded-[calc(1rem-1px)] overflow-hidden flex flex-col",
                    "bg-[#0D0F15]/95 backdrop-blur-2xl",
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                    "daylight:bg-white daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_2px_rgba(0,0,0,0.03)]",
                    "p-6 transition-colors duration-300",
                    innerClassName
                )}
            >
                {/* Subtle Specular Sheen on Hover */}
                <div className="pointer-events-none absolute -inset-full z-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 transform -rotate-45 translate-x-0 group-hover/card:translate-x-full" />
                
                <div className="relative z-10 flex flex-col flex-1 h-full w-full">{children}</div>
            </div>
        </motion.div>
    );
}
