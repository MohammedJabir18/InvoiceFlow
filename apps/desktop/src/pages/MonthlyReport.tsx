import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    getInvoices,
    getClients,
    getQuotations,
    type InvoiceSummary,
    type ClientResponse,
    type QuotationSummary,
    exportInvoicesToCsv,
    exportInvoicesToJson
} from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import {
    computeComprehensiveAnalytics,
    TimeHorizon,
    DateFilterRange
} from "../lib/analyticsEngine";
import { AnalyticsHeader, DashboardMode } from "../components/analytics/AnalyticsHeader";
import { AnalyticSignalBanner } from "../components/analytics/AnalyticSignalBanner";
import { CashFlowDashboard } from "../components/analytics/CashFlowDashboard";
import { ReceivablesAgingDashboard } from "../components/analytics/ReceivablesAgingDashboard";
import { ClientLtvDashboard } from "../components/analytics/ClientLtvDashboard";
import { QuotationFunnelDashboard } from "../components/analytics/QuotationFunnelDashboard";
import { TaxAccountingDashboard } from "../components/analytics/TaxAccountingDashboard";

const STORAGE_KEY_MODE = "invoiceflow_analytics_mode";
const STORAGE_KEY_HORIZON = "invoiceflow_analytics_horizon";

export function MonthlyReport() {
    const profile = useSettingsStore(state => state.profile);
    const currency = profile?.default_currency || "USD";

    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
    const [loading, setLoading] = useState(true);

    // Active Dashboard Mode & Horizon Filter (persisted in localStorage)
    const [activeMode, setActiveMode] = useState<DashboardMode>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_MODE);
        if (saved && ["cash-flow", "receivables", "clients", "quotes", "tax"].includes(saved)) {
            return saved as DashboardMode;
        }
        return "cash-flow";
    });

    const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>(() => {
        const saved = localStorage.getItem(STORAGE_KEY_HORIZON);
        if (saved && ["30D", "90D", "YTD", "12M", "ALL"].includes(saved)) {
            return saved as TimeHorizon;
        }
        return "ALL";
    });

    const [taxRate, setTaxRate] = useState<number>(18);

    useEffect(() => {
        setLoading(true);
        Promise.all([getInvoices(), getClients(), getQuotations()])
            .then(([invs, cls, qts]) => {
                setInvoices(invs);
                setClients(cls);
                setQuotations(qts);
            })
            .catch(err => console.error("Failed to load analytics records:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleModeChange = (mode: DashboardMode) => {
        setActiveMode(mode);
        localStorage.setItem(STORAGE_KEY_MODE, mode);
    };

    const handleHorizonChange = (horizon: TimeHorizon) => {
        setTimeHorizon(horizon);
        localStorage.setItem(STORAGE_KEY_HORIZON, horizon);
    };

    // Calculate Comprehensive Analytics
    const analytics = useMemo(() => {
        const dateRange: DateFilterRange = { horizon: timeHorizon };
        return computeComprehensiveAnalytics(
            invoices,
            quotations,
            clients,
            currency,
            taxRate,
            dateRange
        );
    }, [invoices, quotations, clients, currency, taxRate, timeHorizon]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportCsv = () => {
        exportInvoicesToCsv(invoices, clients);
    };

    const handleExportJson = () => {
        const payload = {
            metadata: {
                generatedAt: new Date().toISOString(),
                currency,
                timeHorizon,
                effectiveTaxRate: `${taxRate}%`,
                system: "InvoiceFlow Analytics Hub"
            },
            summary: {
                totalBilled: analytics.totalBilled,
                totalCashCollected: analytics.totalCashCollected,
                totalOutstanding: analytics.totalOutstanding,
                dsoDays: analytics.dsoDays,
                collectionVelocityRate: `${analytics.collectionVelocityRate}%`,
                totalDelinquentAmount: analytics.totalDelinquentAmount,
                estimatedBadDebt: analytics.totalEstimatedBadDebt,
                paretoTop20Share: `${analytics.paretoTop20Share}%`,
                winRatePercent: `${analytics.winRatePercent}%`
            },
            invoices,
            quotations,
            clients
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", dataStr);
        link.setAttribute("download", `InvoiceFlow_Analytics_Dossier_${new Date().toISOString().split("T")[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono text-slate-400 daylight:text-slate-600">
                        Computing Financial Intelligence...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header with Switcher Tabs & Global Filters */}
            <AnalyticsHeader
                activeMode={activeMode}
                onModeChange={handleModeChange}
                timeHorizon={timeHorizon}
                onHorizonChange={handleHorizonChange}
                onExportCsv={handleExportCsv}
                onExportJson={handleExportJson}
                onPrint={handlePrint}
                currency={currency}
            />

            {/* Plain-English Data Science Signals Banner (Visible on all views) */}
            <div className="print:hidden">
                <AnalyticSignalBanner signals={analytics.signals} />
            </div>

            {/* Dynamic Interactive Dashboard Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeMode === "cash-flow" && (
                        <CashFlowDashboard data={analytics} currency={currency} />
                    )}

                    {activeMode === "receivables" && (
                        <ReceivablesAgingDashboard
                            data={analytics}
                            clients={clients}
                            currency={currency}
                        />
                    )}

                    {activeMode === "clients" && (
                        <ClientLtvDashboard data={analytics} currency={currency} />
                    )}

                    {activeMode === "quotes" && (
                        <QuotationFunnelDashboard data={analytics} currency={currency} />
                    )}

                    {activeMode === "tax" && (
                        <TaxAccountingDashboard
                            data={analytics}
                            invoices={invoices}
                            clients={clients}
                            currency={currency}
                            taxRate={taxRate}
                            onTaxRateChange={setTaxRate}
                            onPrint={handlePrint}
                            onExportCsv={handleExportCsv}
                            profileName={profile?.name}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
