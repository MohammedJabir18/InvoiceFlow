import { motion } from "framer-motion";
import { FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { RevenuePulse } from "../components/dashboard/RevenuePulse";
import { QuickActions } from "../components/dashboard/QuickActions";
import { LiveFeed } from "../components/dashboard/LiveFeed";
import { getInvoices, getClients, type InvoiceSummary, type ClientResponse } from "../lib/api";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
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

    const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

    const recentInvoices = [...invoices]
        .sort((a, b) => b.issue_date.localeCompare(a.issue_date))
        .slice(0, 5);

    const formatCurrency = (num: number) =>
        `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    const statusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
            case "pending": return "bg-amber-400/10 text-amber-400 border-amber-400/20";
            case "sent": return "bg-blue-400/10 text-blue-400 border-blue-400/20";
            case "overdue": return "bg-rose-400/10 text-rose-400 border-rose-400/20";
            default: return "bg-gray-400/10 text-gray-400 border-gray-400/20";
        }
    };

    return (
        <motion.div
            className="p-8 max-w-[1600px] mx-auto space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
                    <p className="text-[var(--foreground)] opacity-60 mt-1">
                        {loading ? "Loading..." : `${invoices.length} invoices · ${clients.length} clients`}
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => navigate("/editor")}
                        className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        <FileText size={18} /> New Invoice
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                <motion.div className="md:col-span-2 h-full" variants={itemVariants}>
                    <RevenuePulse totalRevenue={totalRevenue} invoices={invoices} />
                </motion.div>
                <div className="flex flex-col gap-6 h-full">
                    <motion.div className="flex-1" variants={itemVariants}>
                        <QuickActions />
                    </motion.div>
                    <motion.div className="flex-1" variants={itemVariants}>
                        <LiveFeed invoices={invoices} clients={clients} />
                    </motion.div>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <motion.div className="glass-panel rounded-2xl p-6" variants={itemVariants}>
                <h3 className="text-[var(--secondary)] text-xs font-bold uppercase tracking-widest mb-6">Recent Invoices</h3>
                {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
                    </div>
                ) : recentInvoices.length === 0 ? (
                    <p style={{ textAlign: "center", padding: 40, opacity: 0.5 }}>No invoices yet. Create your first one!</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 text-left text-sm text-[var(--foreground)] opacity-50">
                                    <th className="pb-4 font-medium pl-4">Invoice</th>
                                    <th className="pb-4 font-medium">Client</th>
                                    <th className="pb-4 font-medium">Amount</th>
                                    <th className="pb-4 font-medium">Status</th>
                                    <th className="pb-4 font-medium pr-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentInvoices.map((inv) => (
                                    <tr key={inv.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="py-4 pl-4 font-mono font-medium text-[var(--primary)] group-hover:text-emerald-400 transition-colors">
                                            {inv.number}
                                        </td>
                                        <td className="py-4 text-sm font-medium">{clientName(inv.client_id)}</td>
                                        <td className="py-4 font-mono text-sm opacity-80">{formatCurrency(parseFloat(inv.total))}</td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="py-4 pr-4 text-right text-sm opacity-60">{inv.issue_date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
