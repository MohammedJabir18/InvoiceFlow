import { motion } from "framer-motion";
import { FilePlus2, Loader2, ArrowRight, TrendingUp, Users, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RevenuePulse } from "../components/dashboard/RevenuePulse";
import { QuickActions } from "../components/dashboard/QuickActions";
import { LiveFeed } from "../components/dashboard/LiveFeed";
import { getInvoices, getClients, getDealsByClient, type InvoiceSummary, type ClientResponse, type Deal } from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import { GlassCard } from "../components/ui/GlassCard";
import { SpotlightButton } from "../components/ui/SpotlightButton";
import { AnimatedBadge } from "../components/ui/AnimatedBadge";
import { convertAmount, formatMoney, getCurrencyInfo } from "../lib/currencies";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const textRevealVariants = {
    hidden: { opacity: 0, y: 30, rotateX: -20 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
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

                // Aggregate deals from all clients
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
        <div className="mx-auto max-w-7xl pb-16">

            {/* HEROS SECTION */}
            <motion.div
                className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <div className="flex flex-col gap-2 relative">
                    {/* Ambient Glow behind text */}
                    <div className="absolute -inset-10 -z-10 bg-[var(--primary)]/10 blur-[80px] rounded-full" />

                    <motion.div variants={textRevealVariants} className="overflow-hidden">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/60">System Online</span>
                        </div>
                    </motion.div>

                    <motion.h1 variants={textRevealVariants} className="text-5xl md:text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)]/90 to-[var(--primary)]/60">
                        Welcome back, <br />
                        <span className="text-[var(--primary)] drop-shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)]">{companyName}</span>
                    </motion.h1>

                    <motion.p variants={textRevealVariants} className="mt-2 text-lg text-[var(--text-muted)] max-w-xl">
                        {loading ? "Synchronizing your financial and intelligence network..." : `You are tracking ${formatCurrency(totalRevenue)} in settled revenue across ${clients.length} active connections.`}
                    </motion.p>
                </div>

                <motion.div variants={itemVariants} className="shrink-0 flex gap-4">
                    <SpotlightButton variant="secondary" onClick={() => navigate("/deals")}>
                        <Activity className="h-4 w-4" /> Analyze Ecosystem
                    </SpotlightButton>
                    <SpotlightButton onClick={() => navigate("/invoices")}>
                        <FilePlus2 className="h-4 w-4" /> New Invoice
                    </SpotlightButton>
                </motion.div>
            </motion.div>


            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-8"
            >
                {/* METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Net Revenue</h3>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-500 ring-1 ring-emerald-500/20">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl xl:text-4xl font-mono font-bold tracking-tight text-[var(--foreground)] truncate">
                                {loading ? "..." : formatCurrency(totalRevenue)}
                            </span>
                            <span className="text-sm font-medium text-emerald-500">+12% from last cycle</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Outstanding</h3>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 ring-1 ring-amber-500/20">
                                <span className="font-mono font-black text-xs select-none">
                                    {currencyInfo.symbol || currencyInfo.code}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-2xl sm:text-3xl xl:text-4xl font-mono font-bold tracking-tight text-[var(--foreground)] truncate">
                                {loading ? "..." : formatCurrency(outstandingAmount)}
                            </span>
                            <span className="text-sm font-medium text-[var(--text-muted)]">Across active invoices</span>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 overflow-hidden group sm:col-span-2 lg:col-span-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Deals</h3>
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] ring-1 ring-[var(--primary)]/20 shadow-[0_0_15px_color-mix(in_srgb,var(--primary)_20%,transparent)]">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-2xl sm:text-3xl xl:text-4xl font-mono font-bold tracking-tight text-[var(--foreground)] drop-shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_30%,transparent)]">
                                    {loading ? "..." : activeDeals}
                                </span>
                                <span className="text-sm font-medium text-[var(--primary)] cursor-pointer hover:underline flex items-center gap-1" onClick={() => navigate('/deals')}>
                                    View AI Insights <ArrowRight className="h-3 w-3" />
                                </span>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* MAIN DASHBOARD CONTENT */}
                <div className="grid grid-cols-12 gap-8 min-h-[500px]">
                    {/* Revenue Pulse spans 8 columns on large screens */}
                    <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
                        <GlassCard className="h-full flex flex-col">
                            <RevenuePulse totalRevenue={totalRevenue} invoices={invoices} />
                        </GlassCard>
                    </div>

                    {/* Right column for Actions and Feed */}
                    <div className="col-span-12 lg:col-span-4 flex flex-col gap-8 h-full">
                        <GlassCard>
                            <QuickActions />
                        </GlassCard>
                        <GlassCard className="flex-1 flex flex-col min-h-0">
                            <LiveFeed invoices={invoices} clients={clients} />
                        </GlassCard>
                    </div>
                </div>

                {/* Recent Invoices Table */}
                <GlassCard className="w-full flex flex-col">
                    <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--foreground)]">Ledger Activity</h3>
                        <button
                            onClick={() => navigate("/invoices")}
                            className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:text-[var(--secondary)]"
                        >
                            View All <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex h-[300px] flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
                        </div>
                    ) : recentInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                                <FilePlus2 className="h-8 w-8 text-[var(--text-muted)]" />
                            </div>
                            <h4 className="text-xl font-bold tracking-tight text-[var(--foreground)]">No ledger entries yet</h4>
                            <p className="mt-2 text-[var(--text-muted)]">Create your first invoice to initialize the network.</p>
                            <SpotlightButton className="mt-8" onClick={() => navigate('/invoices')}>Initialize Flow</SpotlightButton>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black/20 dark:bg-black/40">
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Identifier</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Connection</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Clearance</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((inv) => (
                                        <tr
                                            key={inv.id}
                                            className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.02]"
                                            onClick={() => navigate('/invoices')}
                                        >
                                            <td className="px-6 py-5 font-mono text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                {inv.number}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/20 text-xs font-bold text-[var(--primary)] ring-1 ring-[var(--primary)]/30">
                                                        {clientName(inv.client_id).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-[var(--foreground)]">{clientName(inv.client_id)}</span>
                                                        <span className="text-xs text-[var(--text-muted)]">{inv.issue_date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <AnimatedBadge status={statusMap[inv.status.toLowerCase()] || "neutral"} pulse={inv.status.toLowerCase() !== 'paid' && inv.status.toLowerCase() !== 'draft'}>
                                                    {inv.status}
                                                </AnimatedBadge>
                                            </td>
                                            <td className="px-6 py-5 text-right font-mono text-[1.1rem] font-bold text-[var(--foreground)] tracking-tight">
                                                {formatMoney(parseFloat(inv.total), currency, inv.currency || "USD")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </div>
    );
}
