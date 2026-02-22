import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    MoreHorizontal,
    FileText,
    Trash2,
    X,
    Loader2,
    Download,
    ArrowRight,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    FilePlus2
} from "lucide-react";
import {
    getInvoices,
    getClients,
    createInvoice,
    deleteInvoice,
    updateInvoiceStatus,
    generatePdf,
    openPdf,
    type InvoiceSummary,
    type ClientResponse,
    type CreateInvoiceRequest,
} from "../lib/api";
import { useSettingsStore } from "../store/settingsStore";
import { DownloadProgressModal } from "../components/ui/DownloadProgressModal";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const rowVariants = {
    hidden: { opacity: 0, x: -10, filter: 'blur(4px)' },
    visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const slideOverVariants = {
    hidden: { x: '100%', opacity: 0.5 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
    exit: { x: '100%', opacity: 0.5, transition: { duration: 0.3, ease: 'easeIn' } }
};

export function Invoices() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [previewInvoice, setPreviewInvoice] = useState<InvoiceSummary | null>(null);
    const currency = useSettingsStore(state => state.profile?.default_currency) || "USD";

    // Download Modal State
    const [downloadState, setDownloadState] = useState<{
        isOpen: boolean;
        status: 'idle' | 'initializing' | 'rendering' | 'generating' | 'complete' | 'error';
        invoiceNumber: string;
        path: string | null;
        error: string | null;
    }>({
        isOpen: false,
        status: 'idle',
        invoiceNumber: '',
        path: null,
        error: null
    });

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

    // Click outside handler for more options menu
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // If menu is open and we click outside the menu container and outside the toggle button
            if (menuId && !target.closest('.aurora-menu') && !target.closest('.btn-icon')) {
                setMenuId(null);
            }
        };

        if (menuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuId]);

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
                invoice_number: null,
                client_id: clientId,
                items: [{ description: desc, quantity: qty, unit_price: price }],
                notes: notesRef.current?.value?.trim() || null,
                status: "Draft",
                issue_date: null,
                due_date: null
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

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateInvoiceStatus(id, newStatus);
            await fetchData();
            setMenuId(null);
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status.");
        }
    };

    const handleDownload = async (id: string, invoiceNumber: string) => {
        setMenuId(null);
        setDownloadState({ isOpen: true, status: 'initializing', invoiceNumber, path: null, error: null });

        // Timeout promises to stagger the visual effects to look premium
        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        try {
            // Stage 1
            await delay(400);
            setDownloadState(s => s.status === 'initializing' ? { ...s, status: 'rendering' } : s);

            // Stage 2
            await delay(400);
            setDownloadState(s => s.status === 'rendering' ? { ...s, status: 'generating' } : s);

            const path = await generatePdf(id);

            // Minimum time in generating state so it doesn't flash too fast
            await delay(600);

            setDownloadState(s => ({ ...s, status: 'complete', path }));
        } catch (err) {
            console.error("PDF generation failed:", err);
            setDownloadState(s => ({ ...s, status: 'error', error: "Failed to generate PDF. Make sure Chrome/Edge is installed." }));
        }
    };

    const getDisplayStatus = (inv: InvoiceSummary) => {
        if (inv.status !== 'Paid' && inv.status !== 'Cancelled') {
            if (inv.due_date) {
                const dueDate = new Date(inv.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!isNaN(dueDate.getTime()) && dueDate < today) {
                    return 'Overdue';
                }
            }
        }
        return inv.status;
    };

    const handlePreview = (id: string, e?: React.MouseEvent) => {
        console.log("handlePreview triggered for:", id);
        if (e) {
            const target = e.target as HTMLElement;
            console.log("Clicked element:", target.tagName, target.className);
            if (target.closest('button') || target.closest('.aurora-menu')) {
                console.log("Click was on/inside a button or menu, ignoring preview");
                return;
            }
        }

        const inv = invoices.find(i => i.id === id);
        if (inv) {
            console.log("Setting previewInvoice:", inv.number);
            setPreviewInvoice(inv);
        } else {
            console.warn("Invoice not found in state for ID:", id);
        }
    };

    const formatCurrency = (total: string) => {
        const num = parseFloat(total);
        if (isNaN(num)) return total;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
    };

    const filtered = invoices.filter((inv) => {
        const matchesSearch =
            inv.number.toLowerCase().includes(search.toLowerCase()) ||
            clientName(inv.client_id).toLowerCase().includes(search.toLowerCase());
        const matchesFilter = !filterStatus || getDisplayStatus(inv).toLowerCase() === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const statuses = [
        { id: "all", label: "All Invoices", icon: FileText },
        { id: "paid", label: "Paid", icon: CheckCircle2 },
        { id: "sent", label: "Sent", icon: ArrowRight },
        { id: "pending", label: "Pending", icon: Clock },
        { id: "overdue", label: "Overdue", icon: AlertCircle },
        { id: "draft", label: "Draft", icon: FilePlus2 },
    ];

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

    // Calculate sum of visible invoices
    const totalAmount = filtered.reduce((sum, inv) => sum + parseFloat(inv.total || "0"), 0);

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Download Progress Modal */}
            <DownloadProgressModal
                {...downloadState}
                onClose={() => setDownloadState(s => ({ ...s, isOpen: false }))}
            />

            {/* Premium Dashboard Header */}
            <motion.div
                className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Financials</h1>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', margin: 0 }}>
                            Track and manage your revenue stream.
                        </p>
                        {!loading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(45,212,191,0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(45,212,191,0.2)' }}>
                                <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                                <span style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.9rem' }}>
                                    {formatCurrency(totalAmount.toString())}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="page-header-actions">
                    <motion.button
                        className="btn btn-primary glass-panel"
                        onClick={() => navigate('/editor')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: 'var(--radius-xl)' }}
                    >
                        <Plus size={18} /> Generate Invoice
                    </motion.button>
                </div>
            </motion.div>

            {/* Dashboard Controls */}
            <div className="page-content">
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-2xl)', marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search Component */}
                    <div style={{ position: "relative", flex: '1 1 300px', minWidth: '250px' }}>
                        <Search
                            size={18}
                            style={{
                                position: "absolute",
                                left: 16,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "var(--foreground)",
                                opacity: 0.5
                            }}
                        />
                        <input
                            className="form-input"
                            placeholder="Search by invoice number or client name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '44px', borderRadius: 'var(--radius-xl)' }}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", flex: '2 1 auto', justifyContent: 'flex-end' }}>
                        {statuses.map((s) => {
                            const Icon = s.icon;
                            const isActive = (s.id === "all" && !filterStatus) || filterStatus === s.id;
                            return (
                                <motion.button
                                    key={s.id}
                                    className="btn btn-ghost"
                                    whileHover={{ scale: 1.05, background: 'color-mix(in srgb, var(--foreground) 8%, transparent)' }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        fontSize: "0.9rem",
                                        fontWeight: isActive ? 600 : 500,
                                        height: '2.5rem',
                                        padding: "0 1rem",
                                        borderRadius: '20px',
                                        background: isActive ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "color-mix(in srgb, var(--foreground) 3%, transparent)",
                                        color: isActive ? "#fff" : "var(--foreground)",
                                        opacity: isActive ? 1 : 0.7,
                                        border: `1px solid ${isActive ? 'transparent' : 'color-mix(in srgb, var(--foreground) 5%, transparent)'}`,
                                        boxShadow: isActive ? '0 4px 15px rgba(124, 58, 237, 0.3)' : 'none',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        gap: '6px',
                                        alignItems: 'center'
                                    }}
                                    onClick={() => setFilterStatus(s.id === "all" ? null : s.id)}
                                >
                                    {s.id !== 'all' && <Icon size={14} />}
                                    {s.label}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Loading State */}
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                                <Loader2 size={36} style={{ color: "var(--secondary)" }} />
                            </motion.div>
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-tertiary)', fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Fetching Financials</p>
                        </motion.div>
                    )}

                    {/* Premium Data Table */}
                    {!loading && filtered.length > 0 && (
                        <motion.div
                            key="table"
                            className="glass-panel w-full"
                            style={{ padding: 0, borderRadius: 'var(--radius-2xl)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'visible' }}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: menuId ? '150px' : '0' }}>
                                <table className="data-table min-w-[800px]" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice ID</th>
                                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline</th>
                                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                            <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                            <th style={{ padding: '1.25rem 1.5rem', width: 80 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((inv) => {
                                            const displayStatus = getDisplayStatus(inv);
                                            const config = statusConfig(displayStatus);
                                            return (
                                                <motion.tr
                                                    key={inv.id}
                                                    variants={rowVariants}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s ease', position: 'relative', zIndex: menuId === inv.id ? 20 : 1, cursor: 'pointer' }}
                                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                    onClick={(e) => handlePreview(inv.id, e)}
                                                >
                                                    <td style={{ padding: '1.25rem 1.5rem', fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--foreground)", fontSize: '0.95rem' }}>
                                                        {inv.number}
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                                                                {clientName(inv.client_id).charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={{ fontWeight: 600, color: "var(--foreground)", fontSize: '1rem' }}>
                                                                {clientName(inv.client_id)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ display: 'inline-block', width: '40px' }}>Issued:</span>
                                                                <span style={{ color: 'var(--text-primary)' }}>
                                                                    {inv.issue_date && !isNaN(new Date(inv.issue_date).getTime())
                                                                        ? new Date(inv.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                        : 'N/A'}
                                                                </span>
                                                            </span>
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ display: 'inline-block', width: '40px' }}>Due:</span>
                                                                <span style={{ color: displayStatus === 'Overdue' ? 'var(--danger)' : 'var(--text-primary)' }}>
                                                                    {inv.due_date && !isNaN(new Date(inv.due_date).getTime())
                                                                        ? new Date(inv.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                        : 'N/A'}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: config.color,
                                                            background: config.bg,
                                                            border: `1px solid ${config.color}20`
                                                        }}>
                                                            {displayStatus}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--foreground)", fontSize: '1.1rem' }}>
                                                        {formatCurrency(inv.total)}
                                                    </td>
                                                    <td style={{ padding: '1.25rem 1.5rem', position: "relative", zIndex: menuId === inv.id ? 50 : 1 }}>
                                                        <motion.button
                                                            className="btn btn-ghost btn-icon"
                                                            style={{ height: 36, width: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}
                                                            onClick={() => setMenuId(menuId === inv.id ? null : inv.id)}
                                                            whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                                                        >
                                                            <MoreHorizontal size={18} />
                                                        </motion.button>
                                                        <AnimatePresence>
                                                            {menuId === inv.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    transition={{ duration: 0.2, type: 'spring' }}
                                                                    className="aurora-menu"
                                                                    style={{
                                                                        position: "absolute",
                                                                        right: '2.5rem',
                                                                        top: 'calc(100% - 10px)',
                                                                        background: "rgba(15, 23, 42, 0.95)",
                                                                        backdropFilter: "blur(20px)",
                                                                        border: "1px solid rgba(255,255,255,0.2)",
                                                                        borderRadius: "var(--radius-lg)",
                                                                        padding: "0.5rem",
                                                                        minWidth: 180,
                                                                        zIndex: 9999,
                                                                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                                                                    }}
                                                                >
                                                                    <button
                                                                        className="btn btn-ghost"
                                                                        style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.9rem", height: 36, gap: '10px', color: 'var(--text-primary)' }}
                                                                        onClick={() => handleDownload(inv.id, inv.number)}
                                                                    >
                                                                        <Download size={16} /> Download PDF
                                                                    </button>

                                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                                                                    {/* Status sub-menu / options */}
                                                                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Set Status</div>
                                                                    <div className="flex flex-col gap-1 px-1">
                                                                        {['Draft', 'Pending', 'Sent', 'Paid', 'Cancelled'].map((s) => (
                                                                            <button
                                                                                key={s}
                                                                                className="btn btn-ghost"
                                                                                style={{ width: "100%", justifyContent: "flex-start", fontSize: "0.85rem", height: 28, color: inv.status === s ? 'var(--primary)' : 'var(--text-secondary)' }}
                                                                                onClick={() => handleStatusChange(inv.id, s)}
                                                                            >
                                                                                <span className="w-4">{inv.status === s && "✓"}</span>
                                                                                {s}
                                                                            </button>
                                                                        ))}
                                                                    </div>

                                                                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />

                                                                    <button
                                                                        className="btn btn-ghost"
                                                                        style={{ width: "100%", justifyContent: "flex-start", color: "var(--color-soft-coral)", fontSize: "0.9rem", height: 36, gap: '10px' }}
                                                                        onClick={() => handleDelete(inv.id)}
                                                                    >
                                                                        <Trash2 size={16} /> Delete Invoice
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel"
                            style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <FileText size={48} style={{ color: 'var(--foreground)' }} />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {search || filterStatus ? "No matches found" : "No invoices yet"}
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                                {invoices.length === 0
                                    ? "Start generating revenue. Create your first professional invoice to send to your clients."
                                    : "Try adjusting your search criteria or modifying the active filters."}
                            </p>
                            {!search && !filterStatus && (
                                <button className="btn btn-primary" onClick={() => navigate('/editor')} style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                                    <Plus size={20} /> Create First Invoice
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Slide-Over Form for Creation */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--background) 70%, transparent)', zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            variants={slideOverVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                height: '100%',
                                background: 'var(--surface)',
                                borderLeft: '1px solid color-mix(in srgb, var(--foreground) 8%, transparent)',
                                boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Slide-over Header */}
                            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid color-mix(in srgb, var(--foreground) 5%, transparent)', background: 'color-mix(in srgb, var(--foreground) 2%, transparent)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(circle at top right, color-mix(in srgb, var(--secondary) 15%, transparent), transparent 70%)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            Draft New Invoice
                                        </h2>
                                        <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.95rem', marginTop: '0.5rem' }}>Configure details and generate a new billable item.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        style={{ width: 40, height: 40, borderRadius: '50%', background: 'color-mix(in srgb, var(--foreground) 5%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', opacity: 0.7, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 10%, transparent)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 5%, transparent)'}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Form Content */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                                    {/* Client Selection Section */}
                                    <div style={{ background: 'color-mix(in srgb, var(--foreground) 3%, transparent)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid color-mix(in srgb, var(--foreground) 5%, transparent)' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label" style={{ fontSize: '1rem', color: 'var(--foreground)' }}>Bill To <span style={{ color: 'var(--primary)' }}>*</span></label>
                                            <select ref={clientRef} className="form-input glass-panel" style={{ height: '3.5rem', fontSize: '1.05rem', marginTop: '0.5rem' }}>
                                                <option value="" style={{ background: 'var(--surface)' }}>Select a registered client...</option>
                                                {clients.map((c) => (
                                                    <option key={c.id} value={c.id} style={{ background: 'var(--surface)' }}>
                                                        {c.name} {c.company ? `— ${c.company}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            {clients.length === 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)', fontSize: '0.9rem', marginTop: '1rem', background: 'rgba(245,158,11,0.1)', padding: '10px 14px', borderRadius: '8px' }}>
                                                    <AlertCircle size={16} /> Cannot create invoice. Please add a client in the Client Hub first.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Line Item Section */}
                                    <div style={{ background: 'color-mix(in srgb, var(--foreground) 3%, transparent)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid color-mix(in srgb, var(--foreground) 5%, transparent)' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--foreground)', opacity: 0.8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FileText size={18} /> Primary Line Item
                                        </h3>

                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label">Service / Product Description <span style={{ color: 'var(--primary)' }}>*</span></label>
                                            <input ref={descRef} className="form-input" placeholder="e.g. Website Design - Phase 1" />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Quantity</label>
                                                <input ref={qtyRef} className="form-input" type="number" placeholder="1" defaultValue={1} />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Unit Rate ($) <span style={{ color: 'var(--primary)' }}>*</span></label>
                                                <input ref={priceRef} className="form-input" type="number" placeholder="0.00" step="0.01" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Info Section */}
                                    <div style={{ background: 'color-mix(in srgb, var(--foreground) 3%, transparent)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid color-mix(in srgb, var(--foreground) 5%, transparent)' }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Additional Notes & Terms</label>
                                            <input ref={notesRef} className="form-input" placeholder="Payment due within 30 days. Wire transfer details..." />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Slide-over Footer Actions */}
                            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)', background: 'color-mix(in srgb, var(--foreground) 2%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowCreate(false)}
                                    style={{ background: 'transparent', border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)', color: 'var(--foreground)' }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn btn-primary"
                                    onClick={handleCreate}
                                    disabled={creating || clients.length === 0}
                                    whileHover={clients.length > 0 ? { scale: 1.02, boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)' } : {}}
                                    whileTap={clients.length > 0 ? { scale: 0.98 } : {}}
                                    style={{ padding: '0.75rem 2rem', borderRadius: '30px' }}
                                >
                                    {creating ? <Loader2 size={18} className="animate-spin" /> : <FilePlus2 size={18} />}
                                    {creating ? "Generating Document..." : "Finalize & Draft Invoice"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {previewInvoice && (
                    <motion.div
                        key="invoice-preview-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                        style={{ zIndex: 100000 }}
                        onClick={() => setPreviewInvoice(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-emerald-400" />

                            <div className="p-6 pb-0 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{previewInvoice.number}</h2>
                                    <p className="text-[var(--text-secondary)] mt-1">{clientName(previewInvoice.client_id)}</p>
                                </div>
                                <button
                                    onClick={() => setPreviewInvoice(null)}
                                    className="p-2 -mr-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 text-sm text-[var(--text-secondary)]">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="flex items-center gap-2"><Clock size={16} className="text-emerald-400" /> Issued</span>
                                        <span className="text-white font-medium">
                                            {previewInvoice.issue_date && !isNaN(new Date(previewInvoice.issue_date).getTime())
                                                ? new Date(previewInvoice.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="flex items-center gap-2"><AlertCircle size={16} className="text-amber-400" /> Due</span>
                                        <span className="text-white font-medium">
                                            {previewInvoice.due_date && !isNaN(new Date(previewInvoice.due_date).getTime())
                                                ? new Date(previewInvoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[var(--primary)]" /> Status</span>
                                        <span className="text-white font-medium">{getDisplayStatus(previewInvoice)}</span>
                                    </div>
                                </div>

                                <div className="mt-8 p-4 bg-white/5 rounded-xl flex justify-between items-center">
                                    <span className="uppercase tracking-wider text-xs font-bold text-white/50">Total Amount</span>
                                    <span className="text-xl font-bold text-emerald-400">
                                        {formatCurrency(previewInvoice.total)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 pt-0 flex gap-3">
                                <button
                                    onClick={() => {
                                        setPreviewInvoice(null);
                                        handleDownload(previewInvoice.id, previewInvoice.number);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    <Download size={18} /> Export PDF
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
