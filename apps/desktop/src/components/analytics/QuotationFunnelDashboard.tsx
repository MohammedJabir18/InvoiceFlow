import { useState } from "react";
import { motion } from "framer-motion";
import {
    Target,
    TrendingUp,
    Percent,
    DollarSign,
    Zap,
    CheckCircle2,
    Clock,
    FileCheck2,
    ArrowRight
} from "lucide-react";
import { ComprehensiveAnalytics } from "../../lib/analyticsEngine";
import { formatMoney } from "../../lib/currencies";

interface QuotationFunnelDashboardProps {
    data: ComprehensiveAnalytics;
    currency: string;
}

export function QuotationFunnelDashboard({ data, currency }: QuotationFunnelDashboardProps) {
    const [winRateBoost, setWinRateBoost] = useState<number>(10); // percentage boost slider

    // Simulated impact
    const baseWinRate = data.winRatePercent;
    const simulatedWinRate = Math.min(100, baseWinRate + winRateBoost);
    const simulatedLiftRevenue = (data.quotesTotalValue * (winRateBoost / 100));

    return (
        <div className="space-y-8">
            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Win Rate % */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-emerald-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 daylight:text-emerald-700 flex items-center gap-1.5">
                                <Percent size={16} />
                                Proposal Win Rate
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {data.winRatePercent}%
                            </div>
                            <p className="text-xs text-emerald-400 daylight:text-emerald-700 font-semibold mt-1">
                                Accepted proposals converted to contracts
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Weighted Pipeline Value */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-blue-500/30 via-blue-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-blue-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 daylight:text-blue-700 flex items-center gap-1.5">
                                <DollarSign size={16} />
                                Weighted Pipeline Forecast
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {formatMoney(data.weightedPipelineValue, currency, currency)}
                            </div>
                            <p className="text-xs text-slate-400 daylight:text-slate-600 font-medium mt-1">
                                Stage-probability adjusted forecast
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Average Deal Size */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent shadow-sm">
                    <div className="h-full p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-indigo-200/60 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 daylight:text-indigo-700 flex items-center gap-1.5">
                                <Target size={16} />
                                Average Contract Value
                            </span>
                        </div>
                        <div>
                            <div className="text-2xl sm:text-3xl font-black text-white daylight:text-[#090D16] font-mono">
                                {formatMoney(data.avgDealSize, currency, currency)}
                            </div>
                            <p className="text-xs text-slate-400 daylight:text-slate-600 font-medium mt-1">
                                Across {data.totalQuotes} total quotations issued
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Pipeline Scenario Simulator */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20">
                <div className="p-5 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 daylight:text-emerald-700">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white daylight:text-[#090D16] flex items-center gap-2">
                                    <span>Commercial Win Rate Lift Simulator</span>
                                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 daylight:bg-emerald-50 daylight:text-emerald-700">
                                        Predictive Modeling
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 daylight:text-slate-600 mt-0.5">
                                    Model the revenue expansion achieved by shortening quote signoff turnaround and follow-ups.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 self-end md:self-center font-mono">
                            <div className="text-right">
                                <div className="text-[10px] text-slate-400 uppercase">Simulated Win Rate</div>
                                <div className="text-sm font-bold text-emerald-400 daylight:text-emerald-700">{simulatedWinRate}%</div>
                            </div>
                            <div className="text-right border-l border-white/10 daylight:border-slate-200 pl-4">
                                <div className="text-[10px] text-slate-400 uppercase">Potential Revenue Lift</div>
                                <div className="text-sm font-bold text-white daylight:text-[#090D16]">+{formatMoney(simulatedLiftRevenue, currency, currency)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Slider */}
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5 daylight:border-slate-200">
                        <span className="text-xs font-semibold text-slate-400 daylight:text-slate-600 whitespace-nowrap">
                            Win Rate Improvement: +{winRateBoost}%
                        </span>
                        <input
                            type="range"
                            min="5"
                            max="30"
                            step="5"
                            value={winRateBoost}
                            onChange={(e) => setWinRateBoost(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {/* Quotation Stage Funnel Waterfall */}
            <div className="p-[1px] rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent">
                <div className="p-6 rounded-[calc(1rem-1px)] bg-[#0C1322] daylight:bg-white border border-white/5 daylight:border-slate-200">
                    <div className="mb-6">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 daylight:text-slate-600 block mb-1">
                            End-to-End Proposal Conversion Flow
                        </span>
                        <h2 className="text-xl font-black text-white daylight:text-[#090D16]">
                            Quotation Stage Velocity Funnel
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {data.quoteFunnelStages.map((st, i) => (
                            <div key={st.stage} className="p-4 rounded-xl bg-black/20 daylight:bg-slate-50 border border-white/5 daylight:border-slate-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: st.color }}
                                        />
                                        <span className="text-sm font-bold text-white daylight:text-slate-900">
                                            {st.stage}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400 daylight:text-slate-500">
                                            ({st.count} proposals)
                                        </span>
                                    </div>
                                    <div className="font-mono font-bold text-white daylight:text-[#090D16] text-sm">
                                        {formatMoney(st.value, currency, currency)}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-2 rounded-full bg-white/10 daylight:bg-slate-200 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: st.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(4, st.percentage)}%` }}
                                        transition={{ duration: 0.6, delay: i * 0.1 }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
