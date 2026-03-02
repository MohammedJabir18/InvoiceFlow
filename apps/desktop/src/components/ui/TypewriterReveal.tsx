import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge tailwind classes safely */
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function TypewriterReveal({
    text,
    className,
    delay = 0
}: {
    text: string;
    className?: string;
    delay?: number
}) {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setRevealed(true);
        }, delay * 1000);
        return () => clearTimeout(timer);
    }, [delay]);

    // Break text into words or characters. Here we do characters for a true typewriter feel.
    const characters = text.split("");

    return (
        <div className={cn("inline-block whitespace-pre-wrap relaitve", className)}>
            {revealed && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: { transition: { staggerChildren: 0.02 } }, // Fast, organic staggered reveal
                        hidden: {}
                    }}
                    className="relative"
                >
                    {characters.map((char, index) => (
                        <motion.span
                            key={index}
                            variants={{
                                hidden: { opacity: 0, scale: 0.8, filter: "blur(4px)" },
                                visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
                            }}
                            transition={{ type: "spring", damping: 12, stiffness: 200 }}
                            className={cn(
                                "inline-block",
                                // Highlight numbers or percentages slightly
                                /[0-9%]/.test(char) ? "text-cyan-glow" : ""
                            )}
                        >
                            {char}
                        </motion.span>
                    ))}

                    <motion.span
                        className="inline-block ml-1 w-2 h-4 bg-electric-violet"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    />
                </motion.div>
            )}
        </div>
    );
}
