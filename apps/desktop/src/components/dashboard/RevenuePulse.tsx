import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { InvoiceSummary } from "../../lib/api";
import { useSettingsStore } from "../../store/settingsStore";
import { convertAmount, formatMoney, getCurrencyInfo } from "../../lib/currencies";

interface Props {
    totalRevenue: number;
    invoices: InvoiceSummary[];
}

export function RevenuePulse({ totalRevenue, invoices }: Props) {
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";
    const currencyInfo = getCurrencyInfo(currency);

    const formatCurrency = (num: number) => {
        return formatMoney(num, currency);
    };

    // Build monthly revenue data from real invoices
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    monthNames.forEach((m) => (monthlyMap[m] = 0));

    invoices.forEach((inv) => {
        try {
            const date = new Date(inv.issue_date);
            const month = monthNames[date.getMonth()];
            if (month && inv.status.toLowerCase() === 'paid') {
                monthlyMap[month] += convertAmount(parseFloat(inv.total || "0"), inv.currency || "USD", currency);
            }
        } catch { /* skip bad dates */ }
    });

    const data = monthNames.map((month) => ({
        month,
        revenue: Math.round(monthlyMap[month] * 100) / 100,
    }));

    // Calculate "growth" from previous month
    const currentMonth = new Date().getMonth();
    const thisMonth = data[currentMonth]?.revenue || 0;
    const lastMonth = data[currentMonth - 1]?.revenue || 0;
    const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    return (
        <div className="group relative flex h-full w-full flex-col p-6">
            <div className="z-10 mb-8 flex items-start justify-between">
                <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        Revenue Lifecycle
                    </h3>
                    <div className="flex items-baseline gap-3">
                        <span className="font-mono text-5xl font-bold tracking-tighter text-[var(--foreground)] drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {formatCurrency(totalRevenue)}
                        </span>
                        {growth !== 0 && (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-widest ${growth >= 0 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.2)]"}`}
                            >
                                <TrendingUp size={14} className={growth < 0 ? "rotate-180" : ""} /> {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                            </motion.span>
                        )}
                    </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] ring-1 ring-[var(--primary)]/30 shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
                    <span className="font-mono font-black text-sm tracking-tight select-none">
                        {currencyInfo.symbol || currencyInfo.code}
                    </span>
                </div>
            </div>

            <div className="mx-[-10px] flex-1 min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "color-mix(in srgb, var(--surface) 95%, transparent)",
                                border: "1px solid color-mix(in srgb, var(--foreground) 10%, transparent)",
                                borderRadius: "16px",
                                padding: "12px 20px",
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(20px)"
                            }}
                            itemStyle={{ color: "var(--foreground)", fontWeight: 700, fontSize: '1.25rem', fontFamily: 'var(--font-mono)' }}
                            formatter={(value: number) => [formatCurrency(value), "Settled"]}
                            labelStyle={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={2000}
                            animationEasing="ease-in-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Ambient Glow Effect */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 bg-[var(--primary)] opacity-[0.05] blur-[100px] transition-opacity duration-1000 group-hover:opacity-10" />
        </div>
    );
}
