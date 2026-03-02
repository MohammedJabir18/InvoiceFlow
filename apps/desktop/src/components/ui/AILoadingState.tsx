import { motion } from 'framer-motion';
import { Sparkles, Activity } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to merge tailwind classes safely */
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export function AILoadingState({ className }: { className?: string }) {
    return (
        <div className={cn("relative w-full overflow-hidden rounded-2xl p-6 glass-panel", className)}>
            {/* Deep Space Animated Gradient Background */}
            <motion.div
                className="absolute inset-0 opacity-30 mix-blend-screen"
                animate={{
                    background: [
                        "radial-gradient(circle at 0% 0%, var(--color-electric-violet) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 100%, var(--color-cyan-glow) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 100%, var(--color-electric-violet) 0%, transparent 50%)",
                        "radial-gradient(circle at 100% 0%, var(--color-cyan-glow) 0%, transparent 50%)",
                        "radial-gradient(circle at 0% 0%, var(--color-electric-violet) 0%, transparent 50%)"
                    ]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4 h-full min-h-[160px]">
                {/* Glowing Orbit Ring around Icon */}
                <div className="relative flex items-center justify-center w-16 h-16">
                    <motion.div
                        className="absolute inset-0 rounded-full border border-electric-violet/30"
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-2 rounded-full border border-cyan-glow/20 border-dashed"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        animate={{ filter: ["drop-shadow(0 0 8px rgba(124, 58, 237, 0.4))", "drop-shadow(0 0 16px rgba(124, 58, 237, 0.8))", "drop-shadow(0 0 8px rgba(124, 58, 237, 0.4))"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles className="w-6 h-6 text-electric-violet" />
                    </motion.div>
                </div>

                {/* Text Details */}
                <div className="text-center space-y-1">
                    <h3 className="text-sm font-medium tracking-wide text-white flex items-center justify-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-glow animate-pulse-slow" />
                        Analyzing Data Layers
                    </h3>

                    <div className="flex items-center justify-center space-x-1">
                        <span className="text-xs text-secondary tracking-wider uppercase font-mono">Synthesizing insights</span>
                        <motion.span
                            className="text-xs text-electric-violet font-mono"
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", times: [0, 0.5, 1] }}
                        >
                            _
                        </motion.span>
                    </div>
                </div>

                {/* Minimal Progress Bar Simulator */}
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative mt-2">
                    <motion.div
                        className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-electric-violet to-cyan-glow rounded-full"
                        animate={{ x: ["-100%", "300%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
            </div>
        </div>
    );
}
