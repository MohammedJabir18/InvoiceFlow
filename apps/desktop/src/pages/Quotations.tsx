import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    FileCheck2,
    Printer,
    Edit3,
    Trash2,
    CheckCircle2,
    Clock,
    Layers,
    ArrowRight,
    Sparkles,
    AlertCircle
} from "lucide-react";
import {
    getQuotations,
    getQuotationById,
    getClients,
    deleteQuotation,
    convertQuotationToInvoice,
    type QuotationSummary,
    type FullQuotation,
    type ClientResponse
} from "../lib/api";
import { QuotationPrintModal } from "../components/quotations/QuotationPrintModal";
import { QuotationEditor } from "../components/quotations/QuotationEditor";
import { useSubscriptionStore } from "../store/subscriptionStore";
import { useSettingsStore } from "../store/settingsStore";
import { convertAmount, formatMoney, getCurrencyInfo } from "../lib/currencies";
import { motion, AnimatePresence } from "framer-motion";
import { SpotlightButton } from "../components/ui/SpotlightButton";

export function Quotations() {
    const navigate = useNavigate();
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";
    const currencyInfo = getCurrencyInfo(currency);
    const [searchParams] = useSearchParams();
    const autoCreate = searchParams.get("create") === "true";

    const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Modals
    const [showEditor, setShowEditor] = useState(autoCreate);
    const [editingQuote, setEditingQuote] = useState<FullQuotation | null>(null);
    const [printingQuote, setPrintingQuote] = useState<FullQuotation | null>(null);

    const incrementQuoteCount = useSubscriptionStore(state => state.incrementQuoteCount);

    const loadData = async () => {
        setLoading(true);
        try {
            const [quotesData, clientsData] = await Promise.all([
                getQuotations(),
                getClients()
            ]);
            setQuotations(quotesData);
            setClients(clientsData);
        } catch (err) {
            console.error("Failed to load quotations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtered Quotes
    const filteredQuotes = useMemo(() => {
        return quotations.filter(q => {
            const client = clients.find(c => c.id === q.client_id);
            const matchesSearch =
                q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (client?.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (client?.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === "All" || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [quotations, clients, searchTerm, statusFilter]);

    // Metrics
    const metrics = useMemo(() => {
        const totalValue = quotations.reduce(
            (sum, q) => sum + convertAmount(parseFloat(q.total || "0"), q.currency || "USD", currency),
            0
        );
        const accepted = quotations.filter(q => q.status === "Accepted" || q.status === "Converted");
        const pending = quotations.filter(q => q.status === "Sent" || q.status === "Draft");
        const converted = quotations.filter(q => q.status === "Converted");

        return {
            totalValue,
            acceptedCount: accepted.length,
            pendingValue: pending.reduce(
                (sum, q) => sum + convertAmount(parseFloat(q.total || "0"), q.currency || "USD", currency),
                0
            ),
            convertedCount: converted.length
        };
    }, [quotations, currency]);

    const handleOpenPrint = async (id: string) => {
        const full = await getQuotationById(id);
        if (full) setPrintingQuote(full);
    };

    const handleOpenEdit = async (id: string) => {
        const full = await getQuotationById(id);
        if (full) {
            setEditingQuote(full);
            setShowEditor(true);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this quotation?")) return;
        await deleteQuotation(id);
        loadData();
    };

    const [successToast, setSuccessToast] = useState<string | null>(null);

    const handleConvert = async (id: string) => {
        try {
            const invNumber = await convertQuotationToInvoice(id);
            setSuccessToast(`Quotation converted! Created Invoice #${invNumber}. Redirecting...`);
            loadData();
            setPrintingQuote(null);
            setTimeout(() => {
                navigate("/invoices");
            }, 1200);
        } catch (err) {
            console.error("Failed to convert quotation:", err);
            setSuccessToast("Conversion failed. Please try again.");
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto text-white relative">
            {/* Success Toast */}
            <AnimatePresence>
                {successToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-2xl shadow-emerald-500/30 border border-emerald-400/40"
                    >
                        <CheckCircle2 size={20} className="shrink-0" />
                        <span>{successToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
                        <FileCheck2 className="text-amber-400" size={28} />
                        <span>Quotations & Estimates</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Draft proposals, send formal price quotes, and convert accepted deals to invoices in 1-click.
                    </p>
                </div>

                <SpotlightButton
                    variant="primary"
                    onClick={() => {
                        setEditingQuote(null);
                        setShowEditor(true);
                    }}
                    icon={<Plus size={14} />}
                >
                    New Quotation
                </SpotlightButton>
            </div>

            {/* Metric KPI Cards (Precision Hardware) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-[1px] rounded-xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] daylight:border-slate-200 shadow-sm">
                    <div className="rounded-[calc(0.75rem-1px)] bg-[#0D0F15] daylight:bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                            <span>Total Quoted</span>
                            <span className="font-mono font-bold text-xs text-amber-400 select-none">
                                {currencyInfo.symbol || currencyInfo.code}
                            </span>
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[var(--foreground)] font-mono truncate" title={formatMoney(metrics.totalValue, currency, currency)}>
                            {formatMoney(metrics.totalValue, currency, currency)}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">{quotations.length} total proposals</span>
                    </div>
                </div>

                <div className="p-[1px] rounded-xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] daylight:border-slate-200 shadow-sm">
                    <div className="rounded-[calc(0.75rem-1px)] bg-[#0D0F15] daylight:bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                            <span>Pending Signoff</span>
                            <Clock size={16} className="text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[var(--foreground)] font-mono truncate" title={formatMoney(metrics.pendingValue, currency, currency)}>
                            {formatMoney(metrics.pendingValue, currency, currency)}
                        </div>
                        <span className="text-[10px] text-blue-400 font-medium mt-1.5 block">Awaiting customer signature</span>
                    </div>
                </div>

                <div className="p-[1px] rounded-xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] daylight:border-slate-200 shadow-sm">
                    <div className="rounded-[calc(0.75rem-1px)] bg-[#0D0F15] daylight:bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                            <span>Accepted Deals</span>
                            <CheckCircle2 size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-400 daylight:text-emerald-600 font-mono">
                            {metrics.acceptedCount}
                        </div>
                        <span className="text-[10px] text-emerald-400/90 daylight:text-emerald-600 font-medium mt-1.5 block">
                            {quotations.length ? Math.round((metrics.acceptedCount / quotations.length) * 100) : 0}% win rate
                        </span>
                    </div>
                </div>

                <div className="p-[1px] rounded-xl bg-gradient-to-b from-white/[0.12] via-white/[0.04] to-transparent border border-white/[0.08] daylight:border-slate-200 shadow-sm">
                    <div className="rounded-[calc(0.75rem-1px)] bg-[#0D0F15] daylight:bg-white p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] daylight:shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-2">
                            <span>Converted to Invoices</span>
                            <CheckCircle2 size={16} className="text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-blue-400 daylight:text-blue-600 font-mono">
                            {metrics.convertedCount}
                        </div>
                        <span className="text-[10px] text-blue-400/90 daylight:text-blue-600 font-medium mt-1.5 block">Active billing contracts</span>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#0D0F15] daylight:bg-white p-2.5 rounded-xl border border-white/10 daylight:border-slate-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                    <input
                        type="text"
                        placeholder="Search quote #, client name, or company..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#08090C] daylight:bg-slate-50 rounded-lg border border-white/10 daylight:border-slate-200 text-xs text-white daylight:text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
                    />
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {["All", "Draft", "Sent", "Accepted", "Converted", "Declined"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                statusFilter === tab
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5 daylight:text-slate-600 daylight:hover:text-slate-900 daylight:hover:bg-slate-100"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quotations List */}
            {filteredQuotes.length === 0 ? (
                <div className="p-12 text-center bg-[#111927]/60 rounded-2xl border border-white/10">
                    <FileCheck2 className="mx-auto text-gray-600 mb-3" size={40} />
                    <h3 className="text-sm font-bold text-white">No Quotations Found</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                        Create your first formal client quotation to establish pricing and terms before invoicing.
                    </p>
                    <button
                        onClick={() => {
                            setEditingQuote(null);
                            setShowEditor(true);
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all inline-flex items-center gap-1.5"
                    >
                        <Plus size={14} />
                        <span>Create Quotation</span>
                    </button>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block doppelrand-chassis w-full shadow-2xl p-1.5">
                        <div className="doppelrand-core w-full overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-black/40 text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="py-3 px-4">Quotation #</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Issue Date</th>
                                        <th className="py-3 px-4">Valid Until</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Total Amount</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-gray-300">
                                    {filteredQuotes.map((q) => {
                                        const client = clients.find(c => c.id === q.client_id);
                                        return (
                                            <tr key={q.id} className="hover:bg-white/[0.03] transition-colors group">
                                                <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                                                    {q.number}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-semibold text-white">{client?.name || "Unknown"}</div>
                                                    {client?.company && (
                                                        <div className="text-[11px] text-gray-500">{client.company}</div>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-gray-400 font-mono">{q.issue_date}</td>
                                                <td className="py-3.5 px-4 text-gray-400 font-mono">
                                                    <span className={new Date(q.valid_until) < new Date() ? "text-rose-400 font-bold" : ""}>
                                                        {q.valid_until}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                                        q.status === "Accepted"
                                                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                            : q.status === "Converted"
                                                            ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                                            : q.status === "Sent"
                                                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                            : q.status === "Declined"
                                                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                            : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                                                    }`}>
                                                        ● {q.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 font-mono font-bold text-sm text-[var(--foreground)]">
                                                        <span className="text-xs">{getCurrencyInfo(q.currency || "USD").flag}</span>
                                                        <span>{formatMoney(q.total, currency, q.currency || "USD")}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handleOpenPrint(q.id)}
                                                            className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors"
                                                            title="Print / View Quotation"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEdit(q.id)}
                                                            className="p-1.5 rounded-lg hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 transition-colors"
                                                            title="Edit Quotation"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>
                                                        {q.status !== "Converted" && (
                                                            <button
                                                                onClick={() => handleConvert(q.id)}
                                                                className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 transition-colors"
                                                                title="Convert to Active Invoice"
                                                            >
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(q.id)}
                                                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3">
                        {filteredQuotes.map((q) => {
                            const client = clients.find(c => c.id === q.client_id);
                            return (
                                <div
                                    key={q.id}
                                    className="doppelrand-chassis p-1 shadow-lg"
                                >
                                    <div className="doppelrand-core p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-sm text-blue-400">
                                                {q.number}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                                q.status === "Accepted"
                                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                                    : q.status === "Converted"
                                                    ? "bg-purple-500/15 text-purple-400 border-purple-500/30"
                                                    : q.status === "Sent"
                                                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                    : q.status === "Declined"
                                                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                                    : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                                            }`}>
                                                ● {q.status}
                                            </span>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-semibold text-white">{client?.name || "Client"}</h4>
                                            {client?.company && (
                                                <p className="text-xs text-gray-400">{client.company}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5 font-mono">
                                            <span className="text-gray-400">Valid: {q.valid_until}</span>
                                            <div className="flex items-center gap-1.5 font-mono font-extrabold text-white text-base">
                                                <span className="text-xs">{getCurrencyInfo(q.currency || "USD").flag}</span>
                                                <span>{formatMoney(q.total, currency, q.currency || "USD")}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => handleOpenPrint(q.id)}
                                                className="py-2 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-blue-600/30 transition-colors"
                                            >
                                                <Printer size={14} />
                                                <span>Print</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(q.id)}
                                                className="py-2 rounded-xl bg-white/5 text-gray-300 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-white/10 transition-colors"
                                            >
                                                <Edit3 size={14} />
                                                <span>Edit</span>
                                            </button>
                                            {q.status !== "Converted" ? (
                                                <button
                                                    onClick={() => handleConvert(q.id)}
                                                    className="py-2 rounded-xl bg-emerald-600/20 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-emerald-600/30 transition-colors"
                                                >
                                                    <CheckCircle2 size={14} />
                                                    <span>Invoice</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDelete(q.id)}
                                                    className="py-2 rounded-xl bg-rose-600/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-rose-600/30 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    <span>Delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Print Modal */}
            <QuotationPrintModal
                isOpen={Boolean(printingQuote)}
                quotation={printingQuote}
                client={printingQuote ? (clients.find(c => c.id === printingQuote.client_id) || null) : null}
                onClose={() => setPrintingQuote(null)}
                onConvert={handleConvert}
            />

            {/* Editor Modal */}
            <QuotationEditor
                isOpen={showEditor}
                clients={clients}
                initialData={editingQuote}
                onClose={() => {
                    setShowEditor(false);
                    setEditingQuote(null);
                }}
                onSaved={() => {
                    incrementQuoteCount();
                    loadData();
                }}
            />
        </div>
    );
}
