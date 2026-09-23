import { motion } from "framer-motion";
import {
    FilePlus2,
    FileCheck2,
    Loader2,
    ArrowRight,
    TrendingUp,
    Users,
    Activity,
    ShieldCheck,
    Zap,
    Sparkles,
    ArrowUpRight,
    Lock,
    Globe2,
    CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RevenuePulse } from "../components/dashboard/RevenuePulse";
import { QuickActions } from "../components/dashboard/QuickActions";
import { LiveFeed } from "../components/dashboard/LiveFeed";
import { getInvoices, getClients, getDealsByClient, type InvoiceSummary, type ClientResponse } from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import { GlassCard } from "../components/ui/GlassCard";
import { SpotlightButton } from "../components/ui/SpotlightButton";
import { AnimatedBadge } from "../components/ui/AnimatedBadge";
import { convertAmount, formatMoney, getCurrencyInfo } from "../lib/currencies";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

const textRevealVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } }
};

export function Dashboard() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [activeDeals, setActiveDeals] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";
    const currencyInfo = getCurrencyInfo(currency);
    const profile = useSettingsStore(state => state.profile);

    useEffect(() => {
        (async () => {
            try {
                const [inv, cli] = await Promise.all([getInvoices(), getClients()]);
                setInvoices(inv);
                setClients(cli);

                let totalActiveDeals = 0;
                for (const client of cli) {
                    const deals = await getDealsByClient(client.id);
                    totalActiveDeals += deals.filter(d => d.status.toLowerCase() !== 'closed' && d.status.toLowerCase() !== 'lost').length;
                }
                setActiveDeals(totalActiveDeals);
            } catch (err) {
                console.error("Dashboard fetch failed:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const clientName = (id: string) => clients.find((c) => c.id === id)?.name || "Unknown";

    const totalRevenue = invoices
        .filter(inv => inv.status.toLowerCase() === 'paid')
        .reduce((sum, inv) => sum + convertAmount(parseFloat(inv.total || "0"), inv.currency || "USD", currency), 0);

    const outstandingAmount = invoices
        .filter(inv => inv.status.toLowerCase() !== 'paid' && inv.status.toLowerCase() !== 'draft')
        .reduce((sum, inv) => sum + convertAmount(parseFloat(inv.total || "0"), inv.currency || "USD", currency), 0);

    const recentInvoices = [...invoices]
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 5);

    const formatCurrency = (num: number) => {
        return formatMoney(num, currency);
    };

    const statusMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
        "paid": "success",
        "pending": "warning",
        "sent": "info",
        "overdue": "danger",
        "draft": "neutral"
    };

    const companyName = profile?.name !== "My Company" && profile?.name ? profile.name : "Commander";

    return (
        <div className="mx-auto max-w-[1600px] px-2 sm:px-4 pb-20 pt-4">
            {/* HERO SECTION */}
            <motion.div
                className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end relative"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="flex flex-col gap-3 relative z-10">
                    {/* Status Pill Badge */}
                    <motion.div variants={textRevealVariants} className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                            </span>
                            <span>Financial Engine Online</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 tracking-tight">
                            {currencyInfo.flag} Base Currency: <strong className="text-[var(--foreground)]">{currencyInfo.code}</strong>
                        </span>
                    </motion.div>

                    {/* Dramatic Typography Headline */}
                    <motion.h1
                        variants={textRevealVariants}
                        className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--foreground)] leading-[1.08]"
                    >
                        Financial Command, <br />
                        <span className="text-white daylight:text-slate-900">
                            {companyName}
                        </span>
                    </motion.h1>

                    <motion.p variants={textRevealVariants} className="text-sm sm:text-base text-slate-400 max-w-2xl font-medium">
                        {loading
                            ? "Synchronizing multi-currency liquidity and settlement ledger..."
                            : `Tracking ${formatCurrency(totalRevenue)} settled liquidity across ${clients.length} authenticated enterprise connections.`}
                    </motion.p>
                </div>

                {/* Primary Action Buttons */}
                <motion.div variants={itemVariants} className="shrink-0 flex flex-wrap items-center gap-3 relative z-10">
                    <SpotlightButton
                        variant="secondary"
                        onClick={() => navigate("/deals")}
                        icon={<Sparkles size={13} />}
                    >
                        Deal Pipeline
                    </SpotlightButton>
                    <SpotlightButton
                        variant="secondary"
                        onClick={() => navigate("/quotations")}
                        icon={<FileCheck2 size={13} />}
                    >
                        New Quotation
                    </SpotlightButton>
                    <SpotlightButton
                        variant="primary"
                        onClick={() => navigate("/invoices")}
                        icon={<ArrowRight size={13} />}
                    >
                        Create Invoice
                    </SpotlightButton>
                </motion.div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-8"
            >
                {/* 4-COLUMN HARDWARE KPI METRIC STRIP */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* KPI 1: Settled Net Revenue */}
                    <GlassCard hoverEffect glowColor="emerald">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                Settled Net Revenue
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-[var(--foreground)] truncate">
                                {loading ? "..." : formatCurrency(totalRevenue)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-400 daylight:text-emerald-600">
                                <span>+14.8% from prior 30d</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* KPI 2: Outstanding Invoices */}
                    <GlassCard hoverEffect glowColor="primary">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                                Outstanding Liquidity
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                                <span className="font-mono font-black text-xs">
                                    {currencyInfo.symbol || currencyInfo.code}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-[var(--foreground)] truncate">
                                {loading ? "..." : formatCurrency(outstandingAmount)}
                            </span>
                            <span className="text-xs font-medium text-[var(--text-muted)]">
                                Across active client links
                            </span>
                        </div>
                    </GlassCard>

                    {/* KPI 3: Active Deals Pipeline */}
                    <GlassCard hoverEffect glowColor="primary">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                Active Deals Pipeline
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                                <Users className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-[var(--foreground)]">
                                {loading ? "..." : activeDeals}
                            </span>
                            <span
                                className="text-xs font-semibold text-blue-400 daylight:text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                                onClick={() => navigate('/deals')}
                            >
                                Open Deal Pipeline <ArrowUpRight className="h-3 w-3" />
                            </span>
                        </div>
                    </GlassCard>

                    {/* KPI 4: Settlement Velocity */}
                    <GlassCard hoverEffect glowColor="none">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                Avg Settlement Speed
                            </span>
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                                <Zap className="h-4 w-4" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl font-mono font-black tracking-tight text-[var(--foreground)]">
                                1.8 Days
                            </span>
                            <span className="text-xs font-medium text-emerald-400 daylight:text-emerald-600">
                                3.4x faster than wire transfers
                            </span>
                        </div>
                    </GlassCard>
                </div>

                {/* PRIMARY ASYMMETRIC BENTO GRID */}
                <div className="grid grid-cols-12 gap-6 min-h-[480px]">
                    {/* Volumetric Cashflow Waveform (Col 1-8) */}
                    <div className="col-span-12 xl:col-span-8 flex flex-col">
                        <GlassCard className="h-full flex flex-col p-2">
                            <RevenuePulse totalRevenue={totalRevenue} invoices={invoices} />
                        </GlassCard>
                    </div>

                    {/* Settlement Health & Collection Index (Col 9-12) */}
                    <div className="col-span-12 xl:col-span-4 flex flex-col">
                        <GlassCard className="h-full flex flex-col justify-between" glowColor="emerald">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                                            Settlement Health & Index
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                        OPTIMAL
                                    </span>
                                </div>

                                {/* Precision Concentric Ring Score */}
                                <div className="flex items-center justify-center py-6 relative">
                                    <div className="relative flex items-center justify-center w-36 h-36">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                stroke="currentColor"
                                                strokeWidth="6"
                                                className="text-white/[0.06] daylight:text-slate-200"
                                                fill="transparent"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="42"
                                                stroke="url(#scoreGradient)"
                                                strokeWidth="6"
                                                strokeDasharray="264"
                                                strokeDashoffset="26.4"
                                                strokeLinecap="round"
                                                fill="transparent"
                                            />
                                            <defs>
                                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#2563EB" />
                                                    <stop offset="100%" stopColor="#10B981" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                            <span className="font-mono text-3xl font-black text-[var(--foreground)] tracking-tight">96</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Health Score</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-2">
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] daylight:bg-slate-100 border border-white/5 daylight:border-slate-200 text-xs">
                                        <span className="text-slate-400 font-medium">Automatic Reconciliation</span>
                                        <span className="font-bold text-emerald-400 daylight:text-emerald-600 flex items-center gap-1">
                                            <ShieldCheck size={13} /> Active
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] daylight:bg-slate-100 border border-white/5 daylight:border-slate-200 text-xs">
                                        <span className="text-slate-400 font-medium">Tabby BNPL Settlement</span>
                                        <span className="font-bold text-emerald-400 daylight:text-emerald-600">Connected</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/reports')}
                                className="w-full mt-6 py-2.5 px-4 rounded-xl bg-white/[0.04] daylight:bg-slate-100 hover:bg-white/[0.08] daylight:hover:bg-slate-200 border border-white/10 daylight:border-slate-200 text-xs font-semibold text-[var(--foreground)] flex items-center justify-center gap-2 transition-all cursor-pointer"
                            >
                                View Detailed Risk Audit <ArrowRight size={13} />
                            </button>
                        </GlassCard>
                    </div>
                </div>

                {/* SECONDARY ROW: Quick Actions & Live Stream */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Quick Actions Orbit (Col 1-5) */}
                    <div className="col-span-12 lg:col-span-5 flex flex-col">
                        <GlassCard className="h-full flex flex-col">
                            <QuickActions />
                        </GlassCard>
                    </div>

                    {/* Live Stream Ledger (Col 6-12) */}
                    <div className="col-span-12 lg:col-span-7 flex flex-col">
                        <GlassCard className="h-full flex flex-col" glowColor="emerald">
                            <LiveFeed invoices={invoices} clients={clients} />
                        </GlassCard>
                    </div>
                </div>

                {/* HIGH-CONVERSION SALES UPGRADE BANNER */}
                <motion.div
                    variants={itemVariants}
                    className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-b from-blue-500/30 via-white/[0.06] to-transparent border border-blue-500/25 shadow-[0_20px_45px_-12px_rgba(0,0,0,0.7)]"
                >
                    <div className="relative rounded-[calc(1rem-1px)] bg-[#0D0F15] daylight:bg-white p-6 sm:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden">
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.35)] border border-blue-400/30">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                                        PRO UPGRADE
                                    </span>
                                    <span className="text-xs text-emerald-400 daylight:text-emerald-600 font-bold">
                                        Automated AR & Multi-Currency Engine
                                    </span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--foreground)]">
                                    Automate 100% of your cross-border invoice collections
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                                    Unlock Tabby BNPL installments, scheduled payment reminders, white-label client portals, and real-time ledger settlement.
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 shrink-0">
                            <SpotlightButton
                                variant="white"
                                onClick={() => navigate("/subscription")}
                                icon={<ArrowRight size={14} />}
                            >
                                Upgrade Workspace Now
                            </SpotlightButton>
                        </div>
                    </div>
                </motion.div>

                {/* EXECUTIVE RECENT LEDGER TABLE */}
                <GlassCard className="w-full flex flex-col p-2">
                    <div className="flex items-center justify-between border-b border-white/5 daylight:border-slate-200 px-6 py-5">
                        <div className="flex items-center gap-2.5">
                            <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.7)]" />
                            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--foreground)]">
                                Master Clearance Ledger
                            </h3>
                        </div>
                        <button
                            onClick={() => navigate("/invoices")}
                            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 daylight:text-blue-600 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                            Explore All Invoices <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex h-[260px] flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                        </div>
                    ) : recentInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                                <FilePlus2 className="h-7 w-7 text-[var(--text-muted)]" />
                            </div>
                            <h4 className="text-lg font-bold tracking-tight text-[var(--foreground)]">No ledger entries yet</h4>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">Generate your first invoice to initialize transactions.</p>
                            <SpotlightButton className="mt-6" onClick={() => navigate('/invoices')}>
                                Generate Invoice
                            </SpotlightButton>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead>
                                    <tr className="border-b border-white/5 daylight:border-slate-200 bg-white/[0.01] daylight:bg-slate-50">
                                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Invoice #</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Client Entity</th>
                                        <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Clearance State</th>
                                        <th className="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Liquidity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((inv) => {
                                        const currInfo = getCurrencyInfo(inv.currency || "USD");
                                        return (
                                            <tr
                                                key={inv.id}
                                                className="group cursor-pointer border-b border-white/5 daylight:border-slate-100 transition-colors hover:bg-white/[0.03] daylight:hover:bg-slate-50"
                                                onClick={() => navigate('/invoices')}
                                            >
                                                <td className="px-6 py-4 font-mono text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                    #{inv.number}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-bold text-blue-400 daylight:text-blue-600 border border-blue-500/20">
                                                            {clientName(inv.client_id).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-sm text-[var(--foreground)] tracking-tight">
                                                                {clientName(inv.client_id)}
                                                            </span>
                                                            <span className="text-[11px] text-[var(--text-muted)] font-mono">
                                                                {inv.issue_date}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <AnimatedBadge status={statusMap[inv.status.toLowerCase()] || "neutral"} pulse={inv.status.toLowerCase() !== 'paid' && inv.status.toLowerCase() !== 'draft'}>
                                                        {inv.status}
                                                    </AnimatedBadge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-xs">{currInfo.flag}</span>
                                                        <span className="font-mono text-base font-black text-[var(--foreground)] tracking-tight">
                                                            {formatMoney(parseFloat(inv.total), currency, inv.currency || "USD")}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}
