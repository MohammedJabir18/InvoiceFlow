import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    MoreHorizontal,
    FileText,
    Trash2,
    X,
    Loader2,
    Download,
} from "lucide-react";
import {
    getInvoices,
    getClients,
    createInvoice,
    deleteInvoice,
    generatePdf,
    type InvoiceSummary,
    type ClientResponse,
} from "../lib/api";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const rowVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export function Invoices() {
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);

    // Form refs
    const clientRef = useRef<HTMLSelectElement>(null);
    const descRef = useRef<HTMLInputElement>(null);
    const qtyRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const notesRef = useRef<HTMLInputElement>(null);

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

    // Find client name by ID
    const clientName = (id: string) => {
        const c = clients.find((cl) => cl.id === id);
        return c ? c.name : "Unknown";
    };

    const handleCreate = async () => {
        const clientId = clientRef.current?.value;
        const desc = descRef.current?.value?.trim();
        const qty = parseFloat(qtyRef.current?.value || "1");
        const price = parseFloat(priceRef.current?.value || "0");

        if (!clientId || !desc || price <= 0) {
            alert("Please fill in all required fields (client, description, price).");
            return;
        }

        setCreating(true);
        try {
            await createInvoice({
                client_id: clientId,
                items: [{ description: desc, quantity: qty, unit_price: price }],
                notes: notesRef.current?.value?.trim() || null,
            });
            setShowCreate(false);
            await fetchData();
        } catch (err) {
            console.error("Failed to create invoice:", err);
            alert("Failed to create invoice. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this invoice?")) return;
        try {
            await deleteInvoice(id);
            await fetchData();
            setMenuId(null);
        } catch (err) {
            console.error("Failed to delete invoice:", err);
            alert("Failed to delete invoice.");
        }
    };

    const handleDownload = async (id: string) => {
        try {
            const path = await generatePdf(id);
            alert(`PDF saved to: ${path}`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("PDF generation failed. Chrome may not be available.");
        }
    };

    const formatCurrency = (total: string) => {
        const num = parseFloat(total);
        if (isNaN(num)) return total;
        return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    };

    const filtered = invoices.filter((inv) => {
        const matchesSearch =
            inv.number.toLowerCase().includes(search.toLowerCase()) ||
            clientName(inv.client_id).toLowerCase().includes(search.toLowerCase());
        const matchesFilter = !filterStatus || inv.status.toLowerCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const statuses = ["all", "draft", "pending", "sent", "paid", "overdue"];

    const statusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid": return { bg: "rgba(16, 185, 129, 0.1)", color: "#10b981" };
            case "pending": return { bg: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" };
            case "sent": return { bg: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" };
            case "overdue": return { bg: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
            case "draft": return { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
            default: return { bg: "rgba(107, 114, 128, 0.1)", color: "#6b7280" };
        }
    };

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Invoices</h1>
                    <p className="page-header-subtitle">{invoices.length} total invoices</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> New Invoice
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="page-content">
                {/* Toolbar */}
                <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", alignItems: "center" }}>
                    <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                        <Search
                            size={16}
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--text-tertiary)",
                            }}
                        />
                        <input
                            className="form-input"
                            placeholder="Search invoices..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: 36 }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                        {statuses.map((s) => (
                            <button
                                key={s}
                                className="btn btn-ghost"
                                style={{
                                    fontSize: "var(--text-xs)",
                                    textTransform: "capitalize",
                                    height: 32,
                                    padding: "0 var(--space-3)",
                                    background:
                                        (s === "all" && !filterStatus) || filterStatus === s
                                            ? "rgba(99, 102, 241, 0.1)"
                                            : undefined,
                                    color:
                                        (s === "all" && !filterStatus) || filterStatus === s
                                            ? "var(--accent-primary)"
                                            : undefined,
                                }}
                                onClick={() => setFilterStatus(s === "all" ? null : s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="empty-state">
                        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
                        <p className="empty-state-desc">Loading invoices...</p>
                    </div>
                )}

                {/* Table */}
                {!loading && (
                    <motion.div className="card" style={{ padding: 0 }} variants={containerVariants} initial="hidden" animate="visible">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Client</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Issue Date</th>
                                    <th>Due Date</th>
                                    <th style={{ width: 48 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((inv) => (
                                    <motion.tr key={inv.id} variants={rowVariants}>
                                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                                            {inv.number}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                                                {clientName(inv.client_id)}
                                            </div>
                                        </td>
                                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>
                                            {formatCurrency(inv.total)}
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: "2px 10px",
                                                    borderRadius: 999,
                                                    fontSize: "var(--text-xs)",
                                                    fontWeight: 600,
                                                    textTransform: "capitalize",
                                                    background: statusColor(inv.status).bg,
                                                    color: statusColor(inv.status).color,
                                                }}
                                            >
                                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(inv.status).color }} />
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td>{inv.issue_date}</td>
                                        <td>{inv.due_date}</td>
                                        <td>
                                            <div style={{ position: "relative" }}>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    style={{ height: 32, width: 32 }}
                                                    onClick={() => setMenuId(menuId === inv.id ? null : inv.id)}
                                                >
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                <AnimatePresence>
                                                    {menuId === inv.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            style={{
                                                                position: "absolute",
                                                                right: 0,
                                                                top: "100%",
                                                                marginTop: 4,
                                                                background: "var(--bg-primary)",
                                                                border: "1px solid var(--border-subtle)",
                                                                borderRadius: "var(--radius-md)",
                                                                padding: "var(--space-1)",
                                                                minWidth: 160,
                                                                zIndex: 50,
                                                                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                                            }}
                                                        >
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ width: "100%", justifyContent: "flex-start", fontSize: "var(--text-sm)", height: 36 }}
                                                                onClick={() => handleDownload(inv.id)}
                                                            >
                                                                <Download size={14} /> Download PDF
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ width: "100%", justifyContent: "flex-start", color: "var(--danger)", fontSize: "var(--text-sm)", height: 36 }}
                                                                onClick={() => handleDelete(inv.id)}
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>

                        {filtered.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">
                                    <FileText size={28} />
                                </div>
                                <h3 className="empty-state-title">No invoices found</h3>
                                <p className="empty-state-desc">
                                    {invoices.length === 0
                                        ? "Create your first invoice to get started."
                                        : "Try adjusting your search or filter."}
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Create Invoice Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Create Invoice</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Client *</label>
                                    <select ref={clientRef} className="form-input">
                                        <option value="">Select a client...</option>
                                        {clients.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} {c.company ? `(${c.company})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    {clients.length === 0 && (
                                        <p style={{ fontSize: "var(--text-xs)", color: "var(--warning)", marginTop: 4 }}>
                                            No clients yet. Add a client first.
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Item Description *</label>
                                    <input ref={descRef} className="form-input" placeholder="What are you billing for?" />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                                    <div className="form-group">
                                        <label className="form-label">Quantity</label>
                                        <input ref={qtyRef} className="form-input" type="number" placeholder="1" defaultValue={1} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Unit Price ($) *</label>
                                        <input ref={priceRef} className="form-input" type="number" placeholder="0.00" step="0.01" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <input ref={notesRef} className="form-input" placeholder="Payment instructions, thank you note..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {creating ? "Creating..." : "Create Invoice"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
