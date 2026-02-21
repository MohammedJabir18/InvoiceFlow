import { useState } from "react";

export function HeroBlock() {
    const [title, setTitle] = useState("INVOICE");
    const [subtitle, setSubtitle] = useState("# INV-2026-001");

    return (
        <div className="flex justify-between items-start py-8 px-8">
            <div className="flex flex-col gap-4">
                {/* Logo Placeholder */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-electric-teal)] to-[var(--color-cyber-violet)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-teal-500/20 cursor-pointer hover:scale-105 transition-transform">
                    IF
                </div>

                <div className="space-y-1">
                    <h3 className="font-bold text-lg text-[var(--foreground)]">InvoiceFlow Inc.</h3>
                    <p className="text-sm text-[var(--foreground)] opacity-60">101 Cyber Boulevard</p>
                    <p className="text-sm text-[var(--foreground)] opacity-60">Neo Tokyo, NT 2049</p>
                </div>
            </div>

            <div className="text-right space-y-2">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-4xl font-bold text-[var(--foreground)] bg-transparent text-right outline-none w-full tracking-wider opacity-90 focus:opacity-100 placeholder-white/20"
                />
                <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="text-lg font-mono text-[var(--primary)] bg-transparent text-right outline-none w-full opacity-80 focus:opacity-100"
                />
            </div>
        </div>
    );
}
