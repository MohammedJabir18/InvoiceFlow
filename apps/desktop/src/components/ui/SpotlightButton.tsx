import { useRef, useState } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface SpotlightButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "danger" | "ghost";
    className?: string;
}

export function SpotlightButton({ children, variant = "primary", className, ...props }: SpotlightButtonProps) {
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
        primary: "bg-[var(--primary)] text-[var(--background)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary-rgb),0.5)] border-transparent",
        secondary: "bg-[var(--foreground)]/5 text-[var(--foreground)] border border-[var(--foreground)]/10 hover:bg-[var(--foreground)]/10 hover:border-[var(--foreground)]/20",
        danger: "bg-[var(--color-soft-coral)]/10 text-[var(--color-soft-coral)] border border-[var(--color-soft-coral)]/20 hover:bg-[var(--color-soft-coral)]/20 hover:border-[var(--color-soft-coral)]/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]",
        ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
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
            className={cn(
                "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 font-medium transition-all duration-300",
                variants[variant],
                className
            )}
            {...props}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(120px circle at ${position.x}px ${position.y}px, var(--primary), transparent 40%)`,
                    mixBlendMode: "screen",
                }}
            />
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
}
