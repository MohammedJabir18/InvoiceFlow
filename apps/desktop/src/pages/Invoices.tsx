import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    MoreHorizontal,
    FileText,
    Trash2,
    Loader2,
    Download,
    ArrowRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    FilePlus2,
    FileSpreadsheet,
    FileCode,
    Receipt,
    Copy,
    Edit3,
    CheckSquare,
    Square,
    QrCode
} from "lucide-react";
import {
    getInvoices,
    getClients,
    deleteInvoice,
    updateInvoiceStatus,
    duplicateInvoice,
    generatePdf,
    exportInvoicesToCsv,
    exportInvoicesToJson,
    type InvoiceSummary,
    type ClientResponse
} from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import { DownloadProgressModal } from "../components/ui/DownloadProgressModal";
import { InvoiceMetricsCards } from "../components/invoices/InvoiceMetricsCards";
import { InvoiceDetailsSheet } from "../components/invoices/InvoiceDetailsSheet";
import { PaymentLinkModal } from "../components/invoices/PaymentLinkModal";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const rowVariants = {
    hidden: { opacity: 0, x: -10, filter: "blur(4px)" },
    visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export function Invoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [linkModalInvoice, setLinkModalInvoice] = useState<InvoiceSummary | null>(null);
    const currency = useSettingsStore((state) => state.profile?.default_currency) || "USD";

    // Download Modal State
    const [downloadState, setDownloadState] = useState<{
        isOpen: boolean;
        status: "idle" | "initializing" | "rendering" | "generating" | "complete" | "error";
        invoiceNumber: string;
        path: string | null;
        error: string | null;
    }>({
        isOpen: false,
        status: "idle",
        invoiceNumber: "",
        path: null,
        error: null,
    });

    const fetchData = async () => {
        try {
            const [invoiceData, clientData] = await Promise.all([getInvoices(), getClients()]);
            setInvoices(invoiceData);
            setClients(clientData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Click outside listener to close contextual action menus
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (menuId && !target.closest(".actions-dropdown") && !target.closest(".btn-action-trigger")) {
                setMenuId(null);
            }
        };

        if (menuId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuId]);

    // Client name lookup
    const clientName = (id: string) => {
        const c = clients.find((cl) => cl.id === id);
        return c ? c.name : "Unknown Client";
    };

    const clientCompany = (id: string) => {
        const c = clients.find((cl) => cl.id === id);
        return c?.company || null;
    };

    // Delete handler
    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteInvoice(id);
            setMenuId(null);
            setSelectedIds((prev) => prev.filter((i) => i !== id));
            await fetchData();
        } catch (err) {
            console.error("Failed to delete invoice:", err);
            alert("Failed to delete invoice.");
        }
    };

    // Duplicate handler (Midday feature)
    const handleDuplicate = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const newId = await duplicateInvoice(id);
            setMenuId(null);
            await fetchData();
            navigate(`/editor?id=${newId}`);
        } catch (err) {
            console.error("Failed to duplicate invoice:", err);
            alert("Failed to duplicate invoice.");
        }
    };

    // Status change handler
    const handleStatusChange = async (id: string, newStatus: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await updateInvoiceStatus(id, newStatus);
            await fetchData();
            setMenuId(null);
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // Download PDF with simulated high-tech progress modal
    const handleDownload = async (id: string, invoiceNumber: string) => {
        setMenuId(null);
        setDownloadState({ isOpen: true, status: "initializing", invoiceNumber, path: null, error: null });

        const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

        try {
            await delay(300);
            setDownloadState((s) => ({ ...s, status: "rendering" }));

            await delay(300);
            setDownloadState((s) => ({ ...s, status: "generating" }));

            const path = await generatePdf(id);
            await delay(400);

            setDownloadState((s) => ({ ...s, status: "complete", path }));
        } catch (err) {
            console.error("PDF generation failed:", err);
            setDownloadState((s) => ({
                ...s,
                status: "error",
                error: "Failed to generate PDF. Make sure Chrome/Edge is installed.",
            }));
        }
    };

    // Status calculation & Relative Due Date (Midday Style)
    const getDisplayStatus = (inv: InvoiceSummary) => {
        if (inv.status !== "Paid" && inv.status !== "Cancelled") {
            if (inv.due_date) {
                const dueDate = new Date(inv.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!isNaN(dueDate.getTime()) && dueDate < today) {
                    return "Overdue";
                }
            }
        }
        return inv.status;
    };

    const getRelativeDueInfo = (inv: InvoiceSummary) => {
        const displayStatus = getDisplayStatus(inv);
        if (displayStatus === "Paid") {
            return <span className="text-emerald-400 font-medium">Paid</span>;
        }
        if (displayStatus === "Cancelled") {
            return <span className="text-gray-500 line-through">Cancelled</span>;
        }
        if (!inv.due_date) return <span className="text-gray-400">Upon Receipt</span>;

        const due = new Date(inv.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(due.getTime())) return <span>{inv.due_date}</span>;

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Overdue by {Math.abs(diffDays)}d
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Due today
                </span>
            );
        } else if (diffDays <= 7) {
            return <span className="text-amber-400/90 font-medium">Due in {diffDays}d</span>;
        } else {
            return <span className="text-gray-400">Due in {diffDays}d</span>;
        }
    };

    const formatCurrency = (total: string) => {
        const num = parseFloat(total);
        if (isNaN(num)) return total;
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(num);
    };

    // Filter & search invoices
    const filtered = invoices.filter((inv) => {
        const matchesSearch =
            inv.number.toLowerCase().includes(search.toLowerCase()) ||
            clientName(inv.client_id).toLowerCase().includes(search.toLowerCase()) ||
            (clientCompany(inv.client_id) || "").toLowerCase().includes(search.toLowerCase());
        const matchesFilter = !filterStatus || getDisplayStatus(inv).toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    const statusPillConfig = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
            case "pending":
            case "sent":
                return "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
            case "overdue":
                return "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
            case "draft":
                return "bg-gray-500/10 text-gray-400 border-gray-500/30";
            case "cancelled":
                return "bg-zinc-800/60 text-zinc-500 border-zinc-700/40 line-through";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    // Batch Selection Helpers
    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map((i) => i.id));
        }
    };

    const toggleSelectRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    };

    // Batch Actions
    const handleBatchMarkPaid = async () => {
        for (const id of selectedIds) {
            await updateInvoiceStatus(id, "Paid");
        }
        setSelectedIds([]);
        await fetchData();
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} invoices?`)) return;
        for (const id of selectedIds) {
            await deleteInvoice(id);
        }
        setSelectedIds([]);
        await fetchData();
    };

    return (
        <div style={{ paddingBottom: "6rem", maxWidth: "1400px", margin: "0 auto" }}>
            {/* Download Progress Modal */}
            <DownloadProgressModal
                {...downloadState}
                onClose={() => setDownloadState((s) => ({ ...s, isOpen: false }))}
            />

            {/* Top Header */}
            <motion.div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div>
                    <h1
                        className="text-gradient"
                        style={{
                            fontSize: "2.5rem",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            marginBottom: "0.25rem",
                        }}
                    >
                        Invoices
                    </h1>
                    <p style={{ color: "var(--text-tertiary)", fontSize: "1rem", margin: 0 }}>
                        Command, monitor, and accelerate your cash flow with Midday-grade precision.
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-3">
                    {/* Export Dropdown */}
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1">
                        <button
                            onClick={() => exportInvoicesToCsv(filtered, clients)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            title="Export current view to CSV"
                        >
                            <FileSpreadsheet size={14} className="text-emerald-400" />
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={() => exportInvoicesToJson(filtered)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                            title="Export current view to JSON"
                        >
                            <FileCode size={14} className="text-blue-400" />
                            <span>JSON</span>
                        </button>
                    </div>

                    {/* New Invoice Button */}
                    <motion.button
                        className="btn btn-primary glass-panel"
                        onClick={() => navigate("/editor")}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        style={{ height: "2.75rem", padding: "0 1.25rem", borderRadius: "var(--radius-xl)" }}
                    >
                        <Plus size={16} /> New Invoice
                    </motion.button>
                </div>
            </motion.div>

            {/* Midday-style Financial Metrics Cards */}
            <InvoiceMetricsCards
                invoices={invoices}
                currency={currency}
                activeFilter={filterStatus}
                onSelectFilter={(st) => setFilterStatus(st)}
            />

            {/* Search & Filter Toolbar */}
            <div className="glass-panel mb-6 p-4 rounded-2xl flex gap-4 items-center justify-between flex-wrap border border-white/10">
                {/* Search Input */}
                <div style={{ position: "relative", flex: "1 1 300px", minWidth: "250px" }}>
                    <Search
                        size={16}
                        style={{
                            position: "absolute",
                            left: 14,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--foreground)",
                            opacity: 0.5,
                        }}
                    />
                    <input
                        className="form-input"
                        placeholder="Search invoice number, client, company..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: "40px", borderRadius: "var(--radius-xl)", height: "2.5rem" }}
                    />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 flex-wrap">
                    {[
                        { id: "all", label: "All", icon: FileText },
                        { id: "paid", label: "Paid", icon: CheckCircle2 },
                        { id: "pending", label: "Pending", icon: Clock },
                        { id: "overdue", label: "Overdue", icon: AlertCircle },
                        { id: "draft", label: "Draft", icon: FilePlus2 },
                    ].map((s) => {
                        const Icon = s.icon;
                        const isActive = (s.id === "all" && !filterStatus) || filterStatus === s.id;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setFilterStatus(s.id === "all" ? null : s.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                                    isActive
                                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white"
                                }`}
                            >
                                <Icon size={13} />
                                <span>{s.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Invoices Table Container */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            height: "300px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        >
                            <Loader2 size={32} style={{ color: "var(--primary)" }} />
                        </motion.div>
                        <p style={{ marginTop: "1rem", color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
                            Loading invoices...
                        </p>
                    </motion.div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-12 rounded-2xl text-center border border-white/10"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                            <FileText size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No invoices found</h3>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                            {search || filterStatus
                                ? "No invoices match your current search or filter query."
                                : "Create your first professional invoice with auto-save and payment tracking."}
                        </p>
                        <button
                            onClick={() => navigate("/editor")}
                            className="btn btn-primary px-5 py-2.5 rounded-xl font-semibold text-xs inline-flex items-center gap-2"
                        >
                            <Plus size={15} /> Create Invoice
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="table"
                        className="glass-panel w-full rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[750px]">
                                <thead>
                                    <tr className="bg-black/40 border-b border-white/10 text-xs uppercase tracking-wider font-semibold text-gray-400">
                                        <th className="py-3.5 px-4 w-12 text-center">
                                            <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white">
                                                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                                                    <CheckSquare size={16} className="text-blue-400" />
                                                ) : (
                                                    <Square size={16} />
                                                )}
                                            </button>
                                        </th>
                                        <th className="py-3.5 px-4">Invoice #</th>
                                        <th className="py-3.5 px-4">Customer</th>
                                        <th className="py-3.5 px-4">Due Date</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                        <th className="py-3.5 px-4 text-right">Amount</th>
                                        <th className="py-3.5 px-4 w-16 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs">
                                    {filtered.map((inv) => {
                                        const displayStatus = getDisplayStatus(inv);
                                        const isRowSelected = selectedIds.includes(inv.id);

                                        return (
                                            <motion.tr
                                                key={inv.id}
                                                variants={rowVariants}
                                                onClick={() => setSelectedInvoiceId(inv.id)}
                                                className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${
                                                    isRowSelected ? "bg-blue-500/[0.07]" : ""
                                                } ${menuId === inv.id ? "relative z-30" : ""}`}
                                            >
                                                {/* Checkbox */}
                                                <td className="py-3.5 px-4 text-center" onClick={(e) => toggleSelectRow(inv.id, e)}>
                                                    <button className="text-gray-400 hover:text-white">
                                                        {isRowSelected ? (
                                                            <CheckSquare size={16} className="text-blue-400" />
                                                        ) : (
                                                            <Square size={16} />
                                                        )}
                                                    </button>
                                                </td>

                                                {/* Invoice Number */}
                                                <td className="py-3.5 px-4 font-mono font-bold text-white">
                                                    <span className={displayStatus === "Cancelled" ? "line-through text-gray-500" : ""}>
                                                        {inv.number}
                                                    </span>
                                                </td>

                                                {/* Client Name & Avatar */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                                                            {clientName(inv.client_id).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold text-white block">
                                                                {clientName(inv.client_id)}
                                                            </span>
                                                            {clientCompany(inv.client_id) && (
                                                                <span className="text-[11px] text-gray-400">
                                                                    {clientCompany(inv.client_id)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Timeline / Relative Due Date */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        {getRelativeDueInfo(inv)}
                                                        <span className="text-[10px] text-gray-500 mt-0.5">
                                                            {inv.due_date || "Upon receipt"}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5 px-4 text-center">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusPillConfig(
                                                            displayStatus
                                                        )}`}
                                                    >
                                                        {displayStatus}
                                                    </span>
                                                </td>

                                                {/* Amount */}
                                                <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                                                    <span className={displayStatus === "Cancelled" ? "line-through text-gray-500" : ""}>
                                                        {formatCurrency(inv.total)}
                                                    </span>
                                                </td>

                                                {/* Action Menu (Three dots) */}
                                                <td className={`py-3.5 px-4 text-center relative ${menuId === inv.id ? "z-30" : ""}`} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => setMenuId(menuId === inv.id ? null : inv.id)}
                                                        className="btn-action-trigger p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>

                                                    {/* Context Dropdown */}
                                                    {menuId === inv.id && (
                                                        <div className="actions-dropdown absolute right-4 top-10 w-48 bg-[#141b2d] border border-white/10 rounded-xl shadow-2xl py-1.5 z-40 backdrop-blur-xl">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInvoiceId(inv.id);
                                                                    setMenuId(null);
                                                                }}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <FileText size={13} className="text-blue-400" />
                                                                <span>View Details</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setMenuId(null);
                                                                    navigate(`/editor?id=${inv.id}`);
                                                                }}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <Edit3 size={13} className="text-amber-400" />
                                                                <span>Edit Invoice</span>
                                                            </button>

                                                            <button
                                                                onClick={(e) => handleDuplicate(inv.id, e)}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <Copy size={13} className="text-purple-400" />
                                                                <span>Duplicate Invoice</span>
                                                            </button>

                                                            <button
                                                                onClick={() => handleDownload(inv.id, inv.number)}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <Download size={13} className="text-teal-400" />
                                                                <span>Download PDF</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setMenuId(null);
                                                                    setLinkModalInvoice(inv);
                                                                }}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
                                                            >
                                                                <QrCode size={13} className="text-emerald-400" />
                                                                <span>Payment Link & QR</span>
                                                            </button>

                                                            {displayStatus === "Paid" && (
                                                                <button
                                                                    onClick={() => handleDownload(inv.id, `${inv.number}_Receipt`)}
                                                                    className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <Receipt size={13} />
                                                                    <span>Download Receipt</span>
                                                                </button>
                                                            )}

                                                            <div className="my-1 border-t border-white/5" />

                                                            {displayStatus !== "Paid" ? (
                                                                <button
                                                                    onClick={(e) => handleStatusChange(inv.id, "Paid", e)}
                                                                    className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-emerald-400 hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <CheckCircle2 size={13} />
                                                                    <span>Mark as Paid</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => handleStatusChange(inv.id, "Pending", e)}
                                                                    className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-amber-400 hover:bg-white/10 flex items-center gap-2"
                                                                >
                                                                    <Clock size={13} />
                                                                    <span>Mark as Pending</span>
                                                                </button>
                                                            )}

                                                            <div className="my-1 border-t border-white/5" />

                                                            <button
                                                                onClick={(e) => handleDelete(inv.id, e)}
                                                                className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={13} />
                                                                <span>Delete Invoice</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Midday-style Floating Bottom Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#141b2d] border border-blue-500/30 rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 backdrop-blur-2xl"
                    >
                        <span className="text-xs font-semibold text-white">
                            {selectedIds.length} {selectedIds.length === 1 ? "invoice" : "invoices"} selected
                        </span>

                        <div className="h-4 w-px bg-white/20" />

                        <button
                            onClick={handleBatchMarkPaid}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 transition-all flex items-center gap-1.5"
                        >
                            <CheckCircle2 size={13} />
                            <span>Mark Paid</span>
                        </button>

                        <button
                            onClick={handleBatchDelete}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 transition-all flex items-center gap-1.5"
                        >
                            <Trash2 size={13} />
                            <span>Delete</span>
                        </button>

                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-xs text-gray-400 hover:text-white px-2 py-1"
                        >
                            Clear
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Midday-style Slide-Over Invoice Details Sheet */}
            <InvoiceDetailsSheet
                invoiceId={selectedInvoiceId}
                clients={clients}
                currency={currency}
                onClose={() => setSelectedInvoiceId(null)}
                onRefresh={fetchData}
                onDownloadPdf={handleDownload}
            />

            {/* Payment Link Modal */}
            <PaymentLinkModal
                invoice={linkModalInvoice}
                client={linkModalInvoice ? (clients.find(c => c.id === linkModalInvoice.client_id) || null) : null}
                isOpen={Boolean(linkModalInvoice)}
                onClose={() => setLinkModalInvoice(null)}
            />
        </div>
    );
}
