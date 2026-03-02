import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    className?: string;
    hoverEffect?: boolean;
}

export function GlassCard({ children, className, hoverEffect = true, ...props }: GlassCardProps) {
    return (
        <motion.div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/5",
                "bg-[var(--surface)]/60 backdrop-blur-2xl shadow-xl",
                "dark:bg-white/[0.02] dark:border-white/[0.05]",
                className
            )}
            whileHover={hoverEffect ? { scale: 1.01, y: -2 } : {}}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            {...props}
        >
            {/* Ambient internal light */}
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 dark:from-white/5" />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
