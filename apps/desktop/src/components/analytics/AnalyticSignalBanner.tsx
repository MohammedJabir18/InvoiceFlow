import { Sparkles, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import { AnalyticSignals } from "../../lib/analyticsEngine";
import { motion } from "framer-motion";

interface AnalyticSignalBannerProps {
    signals: AnalyticSignals;
}

export function AnalyticSignalBanner({ signals }: AnalyticSignalBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full mb-8"
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-500">
                    <Sparkles size={14} />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-400 daylight:text-blue-700 font-bold">
                    Automated Executive Signals • No Data Analyst Required
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Positive Signal */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent shadow-sm">
                    <div className="h-full p-4 rounded-[calc(1rem-1px)] bg-[#0C111C]/90 daylight:bg-white border border-white/5 daylight:border-emerald-200/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 daylight:text-emerald-700 flex items-center gap-1.5">
                                    <ShieldCheck size={14} />
                                    {signals.positive.title}
                                </span>
                                {signals.positive.metric && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 daylight:bg-emerald-50 daylight:text-emerald-800 border border-emerald-500/20 daylight:border-emerald-200">
                                        {signals.positive.metric}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300 daylight:text-slate-700 leading-relaxed font-medium">
                                {signals.positive.message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Opportunity Signal */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-blue-500/20 via-blue-500/5 to-transparent shadow-sm">
                    <div className="h-full p-4 rounded-[calc(1rem-1px)] bg-[#0C111C]/90 daylight:bg-white border border-white/5 daylight:border-blue-200/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 daylight:text-blue-700 flex items-center gap-1.5">
                                    <TrendingUp size={14} />
                                    {signals.opportunity.title}
                                </span>
                                {signals.opportunity.metric && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 daylight:bg-blue-50 daylight:text-blue-800 border border-blue-500/20 daylight:border-blue-200">
                                        {signals.opportunity.metric}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300 daylight:text-slate-700 leading-relaxed font-medium">
                                {signals.opportunity.message}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Risk / Warning Signal */}
                <div className="p-[1px] rounded-2xl bg-gradient-to-b from-amber-500/20 via-rose-500/5 to-transparent shadow-sm">
                    <div className="h-full p-4 rounded-[calc(1rem-1px)] bg-[#0C111C]/90 daylight:bg-white border border-white/5 daylight:border-amber-200/80 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 daylight:text-amber-800 flex items-center gap-1.5">
                                    <AlertTriangle size={14} />
                                    {signals.risk.title}
                                </span>
                                {signals.risk.metric && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 daylight:bg-amber-50 daylight:text-amber-800 border border-amber-500/20 daylight:border-amber-200">
                                        {signals.risk.metric}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-300 daylight:text-slate-700 leading-relaxed font-medium">
                                {signals.risk.message}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
