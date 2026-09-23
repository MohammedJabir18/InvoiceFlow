import { motion } from "framer-motion";
import {
    Activity,
    ShieldAlert,
    Users,
    Target,
    FileSpreadsheet,
    Printer,
    Download,
    Calendar,
    Sparkles
} from "lucide-react";
import { TimeHorizon } from "../../lib/analyticsEngine";

export type DashboardMode = "cash-flow" | "receivables" | "clients" | "quotes" | "tax";

interface AnalyticsHeaderProps {
    activeMode: DashboardMode;
    onModeChange: (mode: DashboardMode) => void;
    timeHorizon: TimeHorizon;
    onHorizonChange: (horizon: TimeHorizon) => void;
    onExportCsv: () => void;
    onExportJson: () => void;
    onPrint: () => void;
    currency: string;
}

const DASHBOARD_TABS: { id: DashboardMode; label: string; icon: any; badge?: string }[] = [
    { id: "cash-flow", label: "Cash Flow & Velocity", icon: Activity },
    { id: "receivables", label: "Receivables & Aging", icon: ShieldAlert },
    { id: "clients", label: "Client LTV & Pareto", icon: Users },
    { id: "quotes", label: "Quote Funnel & Pipeline", icon: Target },
    { id: "tax", label: "Tax & Accounting Ledger", icon: FileSpreadsheet, badge: "Reconciled" },
];

const TIME_HORIZONS: { id: TimeHorizon; label: string }[] = [
    { id: "30D", label: "30 Days" },
    { id: "90D", label: "90 Days" },
    { id: "YTD", label: "Year to Date" },
    { id: "12M", label: "12 Months" },
    { id: "ALL", label: "All Time" },
];

export function AnalyticsHeader({
    activeMode,
    onModeChange,
    timeHorizon,
    onHorizonChange,
    onExportCsv,
    onExportJson,
    onPrint,
    currency
}: AnalyticsHeaderProps) {
    return (
        <div className="space-y-6 mb-8 print:hidden">
            {/* Top Bar: Title & Global Export Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-500">
                            <Sparkles size={14} />
                        </div>
                        <span className="text-[11px] font-mono tracking-wider uppercase text-blue-500 font-semibold">
                            Enterprise Business Intelligence Hub
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 daylight:bg-slate-100 daylight:text-slate-700 border border-white/5 daylight:border-slate-200">
                            Base Currency: {currency}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white daylight:text-[#090D16]">
                        Financial Analytics Command
                    </h1>
                    <p className="text-sm font-medium text-slate-400 daylight:text-slate-600 mt-1">
                        Dynamic multi-perspective dashboards engineered for cash visibility, credit risk control, and growth forecasting.
                    </p>
                </div>

                {/* Global Time Horizon & Export Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Time Horizon Pills */}
                    <div className="flex items-center p-1 rounded-xl bg-black/30 daylight:bg-slate-100 border border-white/10 daylight:border-slate-200/80 backdrop-blur-md">
                        {TIME_HORIZONS.map(h => {
                            const isSelected = timeHorizon === h.id;
                            return (
                                <button
                                    key={h.id}
                                    onClick={() => onHorizonChange(h.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                                        isSelected
                                            ? "text-white daylight:text-white"
                                            : "text-slate-400 daylight:text-slate-600 hover:text-white daylight:hover:text-slate-900"
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="horizon-pill"
                                            className="absolute inset-0 bg-blue-600 rounded-lg shadow-sm"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10">{h.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Export Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onExportCsv}
                            title="Export current view to CSV"
                            className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white daylight:bg-white daylight:text-slate-700 daylight:border daylight:border-slate-200 daylight:hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 shadow-sm"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-400 daylight:text-emerald-600" />
                            <span>CSV</span>
                        </button>

                        <button
                            onClick={onExportJson}
                            title="Export analytics payload as JSON"
                            className="px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white daylight:bg-white daylight:text-slate-700 daylight:border daylight:border-slate-200 daylight:hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 shadow-sm"
                        >
                            <Download size={14} className="text-blue-400 daylight:text-blue-600" />
                            <span>JSON</span>
                        </button>

                        <button
                            onClick={onPrint}
                            title="Print formal statement / audit dossier"
                            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35)]"
                        >
                            <Printer size={14} />
                            <span>Print Audit</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Purpose-Built Dashboard Navigation Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/10 daylight:border-slate-200">
                {DASHBOARD_TABS.map(tab => {
                    const isActive = activeMode === tab.id;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onModeChange(tab.id)}
                            className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all whitespace-nowrap outline-none ${
                                isActive
                                    ? "text-blue-400 daylight:text-blue-700"
                                    : "text-slate-400 daylight:text-slate-600 hover:text-white daylight:hover:text-slate-900"
                            }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-colors ${
                                isActive
                                    ? "bg-blue-500/20 daylight:bg-blue-100 text-blue-400 daylight:text-blue-700"
                                    : "bg-white/5 daylight:bg-slate-100 text-slate-400 daylight:text-slate-500 group-hover:text-white daylight:group-hover:text-slate-900"
                            }`}>
                                <Icon size={16} />
                            </div>
                            <span>{tab.label}</span>

                            {tab.badge && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 daylight:bg-emerald-50 daylight:text-emerald-800 border border-emerald-500/20 daylight:border-emerald-200">
                                    {tab.badge}
                                </span>
                            )}

                            {isActive && (
                                <motion.div
                                    layoutId="active-dashboard-bar"
                                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 daylight:bg-blue-600 rounded-full"
                                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
