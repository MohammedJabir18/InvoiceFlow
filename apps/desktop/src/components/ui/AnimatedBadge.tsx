import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AnimatedBadgeProps extends HTMLMotionProps<"span"> {
    children: React.ReactNode;
    status?: "success" | "warning" | "danger" | "info" | "neutral";
    pulse?: boolean;
    className?: string;
}

export function AnimatedBadge({ children, status = "neutral", pulse = true, className, ...props }: AnimatedBadgeProps) {
    const statusConfig = {
        success: {
            bg: "bg-emerald-500/10 dark:bg-emerald-400/10",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-500/20",
            dot: "bg-emerald-500 dark:bg-emerald-400",
            glow: "shadow-[0_0_10px_rgba(16,185,129,0.2)]"
        },
        warning: {
            bg: "bg-amber-500/10 dark:bg-amber-400/10",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-500/20",
            dot: "bg-amber-500 dark:bg-amber-400",
            glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]"
        },
        danger: {
            bg: "bg-rose-500/10 dark:bg-rose-400/10",
            text: "text-rose-600 dark:text-rose-400",
            border: "border-rose-500/20",
            dot: "bg-rose-500 dark:bg-rose-400",
            glow: "shadow-[0_0_10px_rgba(244,63,94,0.2)]"
        },
        info: {
            bg: "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20",
            text: "text-[var(--primary)]",
            border: "border-[var(--primary)]/20",
            dot: "bg-[var(--primary)]",
            glow: "shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_20%,transparent)]"
        },
        neutral: {
            bg: "bg-gray-500/10 dark:bg-gray-400/10",
            text: "text-gray-600 dark:text-gray-400",
            border: "border-gray-500/20",
            dot: "bg-gray-500 dark:bg-gray-400",
            glow: ""
        }
    };

    const config = statusConfig[status];

    return (
        <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
                config.bg,
                config.text,
                config.border,
                config.glow,
                className
            )}
            {...props}
        >
            {pulse && (
                <span className="relative flex h-2 w-2">
                    <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", config.dot)} />
                    <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dot)} />
                </span>
            )}
            {!pulse && <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />}
            {children}
        </motion.span>
    );
}
