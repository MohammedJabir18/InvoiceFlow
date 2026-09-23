import { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Clock,
    DollarSign,
    Zap,
    TrendingUp,
    ShieldCheck,
    HelpCircle
} from "lucide-react";
import { ComprehensiveAnalytics } from "../../lib/analyticsEngine";
import { formatMoney } from "../../lib/currencies";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from "recharts";

interface CashFlowDashboardProps {
    data: ComprehensiveAnalytics;
    currency: string;
}

export function CashFlowDashboard({ data, currency }: CashFlowDashboardProps) {
    const [acceleratorActive, setAcceleratorActive] = useState(false);

    // Simulated impact if user accelerates collections
    const acceleratedCash = acceleratorActive
        ? data.totalCashCollected + data.totalOutstanding * 0.75
        : data.totalCashCollected;
    const acceleratedDSO = acceleratorActive ? Math.max(12, Math.round(data.dsoDays * 0.4)) : data.dsoDays;

    return (
        <div className="space-y-8">
            {/* Top 4 Metric Hardware Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Realized Cash Collected */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-emerald-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 daylight:text-emerald-700">
                                Realized Bank Cash
                            </span>
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 daylight:text-emerald-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono tracking-tight">
                                {formatMoney(acceleratedCash, currency, currency)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400 daylight:text-emerald-700">
                                <TrendingUp size={14} />
                                <span>{data.collectionVelocityRate}% of billed volume</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Days Sales Outstanding (DSO) */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-blue-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 daylight:text-blue-700 flex items-center gap-1">
                                Days Sales Out (DSO)
                            </span>
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 daylight:text-blue-700">
                                <Clock size={16} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono tracking-tight">
                                    {acceleratedDSO}
                                </span>
                                <span className="text-xs text-slate-400 daylight:text-slate-600 font-bold uppercase">Days</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-slate-400 daylight:text-slate-600">
                                <span className={`inline-block w-2 h-2 rounded-full ${acceleratedDSO <= 35 ? "bg-emerald-400" : acceleratedDSO <= 50 ? "bg-amber-400" : "bg-rose-400"}`} />
                                <span>{acceleratedDSO <= 35 ? "Optimal (<35d)" : acceleratedDSO <= 50 ? "Moderate (35–50d)" : "Lagging (>50d)"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Outstanding Liquidity */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/30 via-amber-500/10 to-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-amber-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 daylight:text-amber-800">
                                Uncollected Receivables
                            </span>
                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 daylight:text-amber-800">
                                <Activity size={16} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono tracking-tight">
                                {formatMoney(data.totalOutstanding, currency, currency)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-400 daylight:text-amber-800">
                                <span>Across active customer accounts</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Forward 30-Day Expected Inflow */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-indigo-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 daylight:text-indigo-700">
                                30-Day Forward Forecast
                            </span>
                            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 daylight:text-indigo-700">
                                <Calendar size={16} />
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono tracking-tight">
                                {formatMoney(data.forward30DayForecast, currency, currency)}
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-indigo-400 daylight:text-indigo-700">
                                <span>{data.forward30DayCount} invoices due in 30 days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Scenario Simulator Capsule */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20">
                <div className="p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 daylight:text-blue-600">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white daylight:text-[#090D16] flex items-center gap-2">
                                <span>Interactive Liquidity Accelerator Simulation</span>
                                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 daylight:bg-blue-50 daylight:text-blue-700">
                                    What-If Model
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 daylight:text-slate-600 mt-0.5">
                                Simulate the impact of settling 75% of outstanding balances with Tabby BNPL / automated payment links.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="text-xs font-medium text-slate-400 daylight:text-slate-600">
                            {acceleratorActive ? "Simulation Active (+75% Settled)" : "Standard Realized Baseline"}
                        </span>
                        <button
                            onClick={() => setAcceleratorActive(!acceleratorActive)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                acceleratorActive
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                                    : "bg-white/5 daylight:bg-slate-100 text-slate-300 daylight:text-slate-700 hover:bg-white/10 daylight:hover:bg-slate-200 border border-white/10 daylight:border-slate-200"
                            }`}
                        >
                            {acceleratorActive ? "Reset Model" : "Run Simulation"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Cash Flow Pacing Chart: Realized Cash vs Billed Accrual */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent">
                <div className="p-6 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 daylight:text-slate-600">
                                    Velocity Pacing Timeline
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-white daylight:text-[#090D16]">
                                Cash Collected vs. Billed Accrual
                            </h2>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-slate-300 daylight:text-slate-700">Realized Cash</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-slate-300 daylight:text-slate-700">Billed Accrual</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.cashFlowPacingSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="billedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" className="daylight:stroke-slate-200" />
                                <XAxis
                                    dataKey="label"
                                    stroke="currentColor"
                                    className="text-slate-400 daylight:text-slate-600 text-xs font-mono"
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="currentColor"
                                    className="text-slate-400 daylight:text-slate-600 text-xs font-mono"
                                    tickLine={false}
                                    tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="p-3 rounded-xl bg-slate-900 daylight:bg-white border border-white/10 daylight:border-slate-200 shadow-xl text-xs">
                                                    <div className="font-bold text-white daylight:text-[#090D16] mb-2">{label}</div>
                                                    <div className="space-y-1 font-mono">
                                                        <div className="text-emerald-400 daylight:text-emerald-700 flex justify-between gap-4">
                                                            <span>Collected:</span>
                                                            <span className="font-bold">{formatMoney(payload[0]?.value as number || 0, currency, currency)}</span>
                                                        </div>
                                                        <div className="text-blue-400 daylight:text-blue-700 flex justify-between gap-4">
                                                            <span>Total Billed:</span>
                                                            <span className="font-bold">{formatMoney(payload[1]?.value as number || 0, currency, currency)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="collected"
                                    stroke="#10B981"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#cashGradient)"
                                    name="Realized Cash"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="billed"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#billedGradient)"
                                    name="Total Billed"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
