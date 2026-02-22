import { motion } from "framer-motion";
import { FilePlus2, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RevenuePulse } from "../components/dashboard/RevenuePulse";
import { QuickActions } from "../components/dashboard/QuickActions";
import { LiveFeed } from "../components/dashboard/LiveFeed";
import { getInvoices, getClients, type InvoiceSummary, type ClientResponse } from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export function Dashboard() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";

    useEffect(() => {
        (async () => {
            try {
                const [inv, cli] = await Promise.all([getInvoices(), getClients()]);
                setInvoices(inv);
                setClients(cli);
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
        .reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

    const recentInvoices = [...invoices]
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 5);

    const formatCurrency = (num: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const statusConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid": return { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.3)", color: "#34d399", glow: "0 0 10px rgba(16, 185, 129, 0.4)" };
            case "pending": return { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", color: "#fbbf24", glow: "0 0 10px rgba(245, 158, 11, 0.4)" };
            case "sent": return { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.3)", color: "#60a5fa", glow: "0 0 10px rgba(59, 130, 246, 0.4)" };
            case "overdue": return { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", color: "#f87171", glow: "0 0 10px rgba(239, 68, 68, 0.4)" };
            case "draft": return { bg: "rgba(107, 114, 128, 0.15)", border: "rgba(107, 114, 128, 0.3)", color: "#9ca3af", glow: "none" };
            default: return { bg: "rgba(107, 114, 128, 0.1)", border: "transparent", color: "#6b7280", glow: "none" };
        }
    };

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Premium Dashboard Header */}
            <motion.div
                className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Overview</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', margin: 0 }}>
                        {loading ? "Syncing data..." : `Tracking ${invoices.length} invoices across ${clients.length} clients.`}
                    </p>
                </div>
                <div className="page-header-actions">
                    <motion.button
                        className="btn btn-primary glass-panel"
                        onClick={() => navigate("/invoices")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: 'var(--radius-xl)' }}
                    >
                        <FilePlus2 size={18} /> New Invoice
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                className="page-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
                {/* Bento Grid layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', minHeight: '500px' }}>
                    {/* Revenue Pulse spans 8 columns on large screens */}
                    <motion.div variants={itemVariants} style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8' } } as React.CSSProperties}>
                        <RevenuePulse totalRevenue={totalRevenue} invoices={invoices} />
                    </motion.div>

                    {/* Right column for Actions and Feed */}
                    <div style={{ gridColumn: 'span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4' }, display: 'flex', flexDirection: 'column', gap: '2rem' } as React.CSSProperties}>
                        <motion.div variants={itemVariants} style={{ flex: '0 0 auto' }}>
                            <QuickActions />
                        </motion.div>
                        <motion.div variants={itemVariants} style={{ flex: 1, minHeight: 0 }}>
                            <LiveFeed invoices={invoices} clients={clients} />
                        </motion.div>
                    </div>
                </div>

                {/* Recent Invoices Table (Premium styled) */}
                <motion.div className="glass-panel w-full overflow-x-auto" style={{ padding: 0, borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(255,255,255,0.08)' }} variants={itemVariants}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Invoices</h3>
                        <button
                            onClick={() => navigate("/invoices")}
                            className="btn btn-ghost"
                            style={{ padding: '4px 12px', fontSize: '0.9rem', color: 'var(--primary)', height: 'auto' }}
                        >
                            View All <ArrowRight size={14} />
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                                <Loader2 size={36} style={{ color: "var(--secondary)" }} />
                            </motion.div>
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-tertiary)', fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fetching Data</p>
                        </div>
                    ) : recentInvoices.length === 0 ? (
                        <div style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(45,212,191,0.1), rgba(124,58,237,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <FilePlus2 size={32} style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>No invoices yet</h4>
                            <p style={{ margin: '0.5rem 0 0', color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>Create your first invoice to populate this list.</p>
                        </div>
                    ) : (
                        <table className="data-table min-w-[600px]" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentInvoices.map((inv) => {
                                    const config = statusConfig(inv.status);
                                    return (
                                        <motion.tr
                                            key={inv.id}
                                            style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                            onClick={() => navigate('/invoices')}
                                            className="cursor-pointer"
                                        >
                                            <td style={{ padding: '1.25rem 1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)', fontSize: '0.95rem' }}>
                                                {inv.number}
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>
                                                        {clientName(inv.client_id).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 500, color: 'var(--foreground)', fontSize: '0.95rem' }}>{clientName(inv.client_id)}</span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{inv.issue_date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem' }}>
                                                <span style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    gap: 6,
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.05em",
                                                    background: config.bg,
                                                    color: config.color,
                                                    border: `1px solid ${config.border}`,
                                                }}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--foreground)', fontSize: '1.05rem' }}>
                                                {formatCurrency(parseFloat(inv.total))}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
