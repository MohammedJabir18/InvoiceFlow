import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp } from "lucide-react";
import type { InvoiceSummary } from "../../lib/api";

interface Props {
    totalRevenue: number;
    invoices: InvoiceSummary[];
}

export function RevenuePulse({ totalRevenue, invoices }: Props) {
    // Build monthly revenue data from real invoices
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyMap: Record<string, number> = {};
    monthNames.forEach((m) => (monthlyMap[m] = 0));

    invoices.forEach((inv) => {
        try {
            const date = new Date(inv.issue_date);
            const month = monthNames[date.getMonth()];
            if (month) {
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
        <div className="h-full flex flex-col p-6 rounded-2xl glass-panel relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6 z-10">
                <div>
                    <h3 className="text-[var(--secondary)] text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-mono font-bold text-[var(--foreground)]">
                            ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                        {growth !== 0 && (
                            <span className={`text-sm font-medium flex items-center gap-1 ${growth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                <TrendingUp size={14} /> {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]">
                    <DollarSign size={20} />
                </div>
            </div>

            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-electric-teal)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-electric-teal)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "rgba(15, 23, 42, 0.9)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "8px 12px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                            labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-electric-teal)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Ambient Glow Effect */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[var(--color-electric-teal)] opacity-5 blur-[100px] pointer-events-none group-hover:opacity-10 transition-opacity duration-500" />
        </div>
    );
}
