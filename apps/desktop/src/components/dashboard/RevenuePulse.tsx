import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";
import type { InvoiceSummary } from "../../lib/api";
import { useSettingsStore } from "../../store/settingsStore";

interface Props {
    totalRevenue: number;
    invoices: InvoiceSummary[];
}

export function RevenuePulse({ totalRevenue, invoices }: Props) {
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
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
                monthlyMap[month] += parseFloat(inv.total || "0");
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
        <div className="h-full flex flex-col p-8 rounded-2xl glass-panel relative overflow-hidden group border border-white/5">
            <div className="flex justify-between items-start mb-8 z-10">
                <div>
                    <h3 className="text-[var(--text-tertiary)] text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                        Total Collected Revenue
                    </h3>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-mono font-bold text-[var(--foreground)] tracking-tight">
                            {formatCurrency(totalRevenue)}
                        </span>
                        {growth !== 0 && (
                            <span className={`text-sm font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full ${growth >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                                <TrendingUp size={14} /> {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                    <DollarSign size={24} />
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]" style={{ marginLeft: '-15px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                padding: "12px 16px",
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                                backdropFilter: "blur(10px)"
                            }}
                            itemStyle={{ color: "#fff", fontWeight: 600, fontSize: '1.1rem' }}
                            formatter={(value: number) => [formatCurrency(value), "Collected"]}
                            labelStyle={{ color: "var(--text-tertiary)", marginBottom: "4px", fontSize: '0.85rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Ambient Glow Effect */}
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[var(--primary)] opacity-[0.07] blur-[100px] pointer-events-none group-hover:opacity-15 transition-opacity duration-700" />
        </div>
    );
}
