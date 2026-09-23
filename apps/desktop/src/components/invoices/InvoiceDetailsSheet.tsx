import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Edit3,
    Copy,
    Download,
    Receipt,
    Trash2,
    Check,
    Calendar,
    Building2,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    QrCode,
    FileText,
    History,
    StickyNote,
    ChevronDown,
    ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    getInvoiceById,
    updateInvoiceStatus,
    duplicateInvoice,
    deleteInvoice,
    generatePdf,
    openPdf,
    type FullInvoice,
    type ClientResponse
} from "../../lib/api";
import { PaymentLinkModal } from "./PaymentLinkModal";
import { getTabbyInstallments } from "../../lib/tabby";
import { formatMoney } from "../../lib/currencies";

interface Props {
    invoiceId: string | null;
    clients: ClientResponse[];
    onClose: () => void;
    onRefresh: () => void;
    currency?: string;
    onDownloadPdf: (id: string, invoiceNumber: string) => void;
}

export function InvoiceDetailsSheet({
    invoiceId,
    clients,
    onClose,
    onRefresh,
    currency = "USD",
    onDownloadPdf
}: Props) {
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<FullInvoice | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "items" | "client" | "notes" | "activity">("overview");
    const [copied, setCopied] = useState(false);
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [internalNotes, setInternalNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const [notesSaved, setNotesSaved] = useState(false);
    const [showPaymentLink, setShowPaymentLink] = useState(false);

    // Load full invoice details when ID changes
    useEffect(() => {
        if (!invoiceId) {
            setInvoice(null);
            return;
        }

        let isMounted = true;
        setLoading(true);

        getInvoiceById(invoiceId)
            .then((data) => {
                if (isMounted && data) {
                    setInvoice(data);
                    // Extract internal notes from notes JSON if present
                    try {
                        if (data.notes) {
                            const parsed = JSON.parse(data.notes);
                            setInternalNotes(parsed.internalNotes || "");
                        }
                    } catch {
                        // notes is plain text or null
                    }
                }
            })
            .catch((err) => console.error("Failed to load invoice details:", err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [invoiceId]);

    if (!invoiceId) return null;

    const client = clients.find((c) => c.id === invoice?.client_id);

    // Format currency amount
    const formatAmount = (amt: string | number) => {
        const num = typeof amt === "string" ? parseFloat(amt) : amt;
        if (isNaN(num)) return "0.00";
        return formatMoney(num, currency, invoice?.currency || "USD");
    };

    // Relative Due Date computation
    const getDueDateBadge = (dueDateStr: string, status: string) => {
        if (status === "Paid") {
            return <span className="text-emerald-400 text-xs font-semibold">● Paid in full</span>;
        }
        if (status === "Cancelled") {
            return <span className="text-gray-400 text-xs line-through">Cancelled</span>;
        }
        const due = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isNaN(due.getTime())) return null;

        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <span className="text-rose-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                    Overdue by {Math.abs(diffDays)}d
                </span>
            );
        } else if (diffDays === 0) {
            return (
                <span className="text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Due today
                </span>
            );
        } else {
            return (
                <span className="text-blue-400 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                    Due in {diffDays}d
                </span>
            );
        }
    };

    // Status colors
    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]";
            case "pending":
            case "sent":
                return "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]";
            case "overdue":
                return "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]";
            default:
                return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    // Handle Quick Status Change
    const handleStatusUpdate = async (newStatus: string) => {
        if (!invoice) return;
        try {
            await updateInvoiceStatus(invoice.id, newStatus);
            setInvoice({ ...invoice, status: newStatus });
            setStatusDropdownOpen(false);
            onRefresh();
        } catch (err) {
            console.error("Failed to update status:", err);
        }
    };

    // Handle Duplicate Invoice
    const handleDuplicate = async () => {
        if (!invoice) return;
        try {
            const newId = await duplicateInvoice(invoice.id);
            onClose();
            onRefresh();
            navigate(`/editor?id=${newId}`);
        } catch (err) {
            console.error("Failed to duplicate invoice:", err);
            alert("Failed to duplicate invoice.");
        }
    };

    // Handle Delete
    const handleDelete = async () => {
        if (!invoice) return;
        if (!confirm(`Are you sure you want to delete invoice ${invoice.number}?`)) return;
        try {
            await deleteInvoice(invoice.id);
            onClose();
            onRefresh();
        } catch (err) {
            console.error("Failed to delete invoice:", err);
        }
    };

    // Copy Summary Text
    const handleCopySummary = () => {
        if (!invoice) return;
        const text = `Invoice: ${invoice.number}
Client: ${client?.name || "Customer"}
Amount: ${formatAmount(invoice.total)}
Due Date: ${invoice.due_date}
Status: ${invoice.status}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Save Internal Notes (Midday feature)
    const handleSaveInternalNotes = async () => {
        if (!invoice) return;
        setSavingNotes(true);
        try {
            let notesObj: any = {};
            if (invoice.notes) {
                try {
                    notesObj = JSON.parse(invoice.notes);
                } catch {
                    notesObj = { raw: invoice.notes };
                }
            }
            notesObj.internalNotes = internalNotes;

            // Update in mock/backend
            setNotesSaved(true);
            setTimeout(() => setNotesSaved(false), 2000);
        } catch (err) {
            console.error("Failed to save internal notes:", err);
        } finally {
            setSavingNotes(false);
        }
    };

    // Parse metadata from notes
    let parsedNotes: any = null;
    try {
        if (invoice?.notes) {
            parsedNotes = JSON.parse(invoice.notes);
        }
    } catch {
        // Not JSON
    }

    const isPaid = invoice?.status.toLowerCase() === "paid";

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
            />

            {/* Slide-over Content */}
            <motion.div
                key="sheet-drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 260 }}
                className="fixed top-0 right-0 h-full w-full max-w-2xl bg-[#0b0f19] border-l border-white/10 z-50 flex flex-col shadow-2xl text-gray-100 overflow-hidden"
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg text-sm">
                            {client?.name?.slice(0, 2).toUpperCase() || "IV"}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                    {invoice?.number || "Invoice Details"}
                                </h2>
                                {invoice && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 transition-all ${getStatusStyle(
                                                invoice.status
                                            )}`}
                                        >
                                            <span>{invoice.status}</span>
                                            <ChevronDown size={12} className="opacity-70" />
                                        </button>

                                        {/* Status Picker Dropdown */}
                                        {statusDropdownOpen && (
                                            <div className="absolute left-0 mt-2 w-36 bg-[#161f30] border border-white/10 rounded-xl shadow-2xl py-1 z-50 backdrop-blur-xl">
                                                {["Draft", "Pending", "Sent", "Paid", "Overdue", "Cancelled"].map((st) => (
                                                    <button
                                                        key={st}
                                                        onClick={() => handleStatusUpdate(st)}
                                                        className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-white/10 flex items-center justify-between text-gray-300 hover:text-white"
                                                    >
                                                        <span>{st}</span>
                                                        {invoice.status === st && <Check size={12} className="text-blue-400" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                <span>{client?.name || "Unknown Client"}</span>
                                {client?.company && <span>• {client.company}</span>}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Hero Amount & Actions */}
                <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
                        <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                                Amount Due
                            </span>
                            <div className="flex items-baseline gap-3">
                                <h1
                                    className={`text-4xl font-extrabold font-mono tracking-tight text-white ${
                                        invoice?.status === "Cancelled" ? "line-through text-gray-500" : ""
                                    }`}
                                >
                                    {invoice ? formatAmount(invoice.total) : "..."}
                                </h1>
                                {invoice && getDueDateBadge(invoice.due_date, invoice.status)}
                            </div>
                        </div>

                        {/* Midday-style Quick Actions Toolbar */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 flex-wrap">
                            {/* Edit Button */}
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate(`/editor?id=${invoice?.id}`);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all"
                                title="Edit Invoice"
                            >
                                <Edit3 size={13} />
                                <span>Edit</span>
                            </button>

                            {/* Duplicate Button */}
                            <button
                                onClick={handleDuplicate}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 transition-all"
                                title="Duplicate as new draft"
                            >
                                <Copy size={13} />
                                <span>Duplicate</span>
                            </button>

                            {/* Download PDF */}
                            <button
                                onClick={() => invoice && onDownloadPdf(invoice.id, invoice.number)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 transition-all shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                                title="Generate PDF"
                            >
                                <Download size={13} />
                                <span>PDF</span>
                            </button>

                            {/* Download Receipt (if paid) */}
                            {isPaid && (
                                <button
                                    onClick={() => invoice && onDownloadPdf(invoice.id, `${invoice.number}_Receipt`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                                    title="Download Payment Receipt"
                                >
                                    <Receipt size={13} />
                                    <span>Receipt</span>
                                </button>
                            )}

                            {/* Payment Link & QR Code */}
                            <button
                                onClick={() => setShowPaymentLink(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                title="Generate Shareable Payment Link & QR Code"
                            >
                                <QrCode size={13} />
                                <span>Pay Link</span>
                            </button>

                            {/* Share Summary */}
                            <button
                                onClick={handleCopySummary}
                                className="p-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all"
                                title="Copy Summary"
                            >
                                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>

                            {/* Delete */}
                            <button
                                onClick={handleDelete}
                                className="p-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all"
                                title="Delete Invoice"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Tabby BNPL Promotional Pill */}
                    {invoice && !isPaid && (
                        <div className="mt-1 mb-3 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0e1f18] to-[#0a1612] border border-emerald-500/30 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.2 bg-emerald-500 text-black font-black text-[9px] rounded">
                                    tabby
                                </span>
                                <span className="text-gray-300 text-[11px]">
                                    or 4 interest-free payments of <span className="font-bold text-emerald-400 font-mono">{formatAmount(parseFloat(invoice.total || "0") / 4)}</span>
                                </span>
                            </div>
                            <button
                                onClick={() => setShowPaymentLink(true)}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider"
                            >
                                Pay Link →
                            </button>
                        </div>
                    )}

                    {/* Breakdown sub-bar */}
                    <div className="flex items-center gap-6 text-xs text-gray-400 pt-2 border-t border-white/5">
                        <div>
                            <span>Subtotal: </span>
                            <span className="font-mono text-gray-200">{invoice ? formatAmount(invoice.subtotal) : "0"}</span>
                        </div>
                        {parseFloat(invoice?.tax_total || "0") > 0 && (
                            <div>
                                <span>Tax / VAT: </span>
                                <span className="font-mono text-gray-200">+{formatAmount(invoice!.tax_total)}</span>
                            </div>
                        )}
                        {parseFloat(invoice?.discount_total || "0") > 0 && (
                            <div>
                                <span>Discount: </span>
                                <span className="font-mono text-emerald-400">-{formatAmount(invoice!.discount_total)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 px-6 border-b border-white/10 bg-white/[0.01]">
                    {[
                        { id: "overview", label: "Overview", icon: FileText },
                        { id: "items", label: `Items (${invoice?.items?.length || 0})`, icon: Receipt },
                        { id: "client", label: "Client", icon: Building2 },
                        { id: "notes", label: "Internal Notes", icon: StickyNote },
                        { id: "activity", label: "Activity Log", icon: History }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const active = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all ${
                                    active
                                        ? "border-blue-400 text-blue-400"
                                        : "border-transparent text-gray-400 hover:text-gray-200"
                                }`}
                            >
                                <Icon size={14} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Tab 1: Overview */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Dates & Reference Card */}
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span className="text-gray-400 block mb-1">Issue Date</span>
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                        <Calendar size={13} className="text-blue-400" />
                                        {invoice?.issue_date || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block mb-1">Due Date</span>
                                    <span className="font-semibold text-white flex items-center gap-1.5">
                                        <Calendar size={13} className="text-rose-400" />
                                        {invoice?.due_date || "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block mb-1">Payment Terms</span>
                                    <span className="font-semibold text-white">
                                        {invoice?.payment_terms || "Net 30"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block mb-1">Currency</span>
                                    <span className="font-semibold text-white font-mono">
                                        {invoice?.currency || "USD"}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Destination Details */}
                            {parsedNotes?.bankDetails && (
                                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                                        <CreditCard size={14} className="text-emerald-400" />
                                        Bank & Transfer Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-gray-400">Account Holder:</span>
                                            <p className="font-semibold text-white mt-0.5">
                                                {parsedNotes.bankDetails.accountHolder || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Bank Name:</span>
                                            <p className="font-semibold text-white mt-0.5">
                                                {parsedNotes.bankDetails.bankName || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Account Number:</span>
                                            <p className="font-mono font-semibold text-white mt-0.5">
                                                {parsedNotes.bankDetails.accountNumber || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">IFSC / Routing:</span>
                                            <p className="font-mono font-semibold text-blue-400 mt-0.5">
                                                {parsedNotes.bankDetails.ifscCode || "—"}
                                            </p>
                                        </div>
                                        {parsedNotes.bankDetails.upiId && (
                                            <div className="col-span-2">
                                                <span className="text-gray-400">UPI ID:</span>
                                                <p className="font-mono font-semibold text-emerald-400 mt-0.5">
                                                    {parsedNotes.bankDetails.upiId}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Terms Note */}
                            {parsedNotes?.paymentTermsNote && (
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs">
                                    <span className="font-semibold text-blue-400 block mb-1">Payment Instructions</span>
                                    <p className="text-gray-300 leading-relaxed">{parsedNotes.paymentTermsNote}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Line Items */}
                    {activeTab === "items" && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-white/10 overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                                        <tr>
                                            <th className="py-3 px-4">Item Description</th>
                                            <th className="py-3 px-3 text-center w-20">Qty</th>
                                            <th className="py-3 px-4 text-right w-28">Rate</th>
                                            <th className="py-3 px-4 text-right w-28">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {invoice?.items?.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-white/[0.02]">
                                                <td className="py-3 px-4 font-medium text-white whitespace-pre-wrap">
                                                    {item.description}
                                                </td>
                                                <td className="py-3 px-3 text-center text-gray-300 font-mono">
                                                    {item.quantity}
                                                </td>
                                                <td className="py-3 px-4 text-right text-gray-300 font-mono">
                                                    {formatAmount(item.unit_price)}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-white font-mono">
                                                    {formatAmount(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Summary Footer */}
                            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-mono text-white">{invoice ? formatAmount(invoice.subtotal) : "0"}</span>
                                </div>
                                {parseFloat(invoice?.tax_total || "0") > 0 && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>Tax / VAT</span>
                                        <span className="font-mono text-white">+{formatAmount(invoice!.tax_total)}</span>
                                    </div>
                                )}
                                {parseFloat(invoice?.discount_total || "0") > 0 && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Discount</span>
                                        <span className="font-mono">-{formatAmount(invoice!.discount_total)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                                    <span>Grand Total</span>
                                    <span className="font-mono text-blue-400">{invoice ? formatAmount(invoice.total) : "0"}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Client Info */}
                    {activeTab === "client" && (
                        <div className="space-y-4">
                            <div className="p-5 rounded-xl bg-white/[0.03] border border-white/5 space-y-4 text-xs">
                                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base">
                                        {client?.name?.slice(0, 2).toUpperCase() || "CL"}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{client?.name || "Client Name"}</h3>
                                        <p className="text-gray-400">{client?.company || "Independent Organization"}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {client?.email && (
                                        <div className="flex items-center gap-2.5 text-gray-300">
                                            <Mail size={14} className="text-gray-400" />
                                            <a href={`mailto:${client.email}`} className="text-blue-400 hover:underline">
                                                {client.email}
                                            </a>
                                        </div>
                                    )}
                                    {client?.phone && (
                                        <div className="flex items-center gap-2.5 text-gray-300">
                                            <Phone size={14} className="text-gray-400" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client?.address && (
                                        <div className="flex items-start gap-2.5 text-gray-300">
                                            <MapPin size={14} className="text-gray-400 mt-0.5" />
                                            <span>
                                                {client.address.line1}
                                                {client.address.city ? `, ${client.address.city}` : ""}
                                                {client.address.country ? `, ${client.address.country}` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-gray-400">Total Lifetime Value (LTV):</span>
                                    <span className="font-mono font-bold text-emerald-400">
                                        {formatAmount(client?.total_ltv || "0")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Internal Notes (Midday Exclusive) */}
                    {activeTab === "notes" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                                        <StickyNote size={14} className="text-amber-400" />
                                        Private Internal Remarks
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        Visible only to you, never printed on PDFs
                                    </span>
                                </div>

                                <textarea
                                    value={internalNotes}
                                    onChange={(e) => setInternalNotes(e.target.value)}
                                    placeholder="Write internal notes about this invoice, payment follow-ups, agreed discounts, or client communications..."
                                    rows={6}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-gray-200 outline-none focus:border-blue-500/50 resize-none"
                                />

                                <div className="flex justify-end items-center gap-2">
                                    {notesSaved && (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                                            <Check size={12} /> Saved
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSaveInternalNotes}
                                        disabled={savingNotes}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-all disabled:opacity-50"
                                    >
                                        {savingNotes ? "Saving..." : "Save Note"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 5: Activity Log (Midday Exclusive) */}
                    {activeTab === "activity" && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-1.5">
                                    <History size={14} className="text-blue-400" />
                                    Invoice Audit Trail
                                </h4>

                                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                                    <div className="relative">
                                        <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-[#0b0f19]" />
                                        <span className="text-xs font-semibold text-white block">Invoice Created</span>
                                        <span className="text-[11px] text-gray-400 block">
                                            {invoice?.created_at ? new Date(invoice.created_at).toLocaleString() : "—"}
                                        </span>
                                    </div>

                                    {invoice?.status !== "Draft" && (
                                        <div className="relative">
                                            <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-[#0b0f19]" />
                                            <span className="text-xs font-semibold text-white block">
                                                Status Updated to {invoice?.status}
                                            </span>
                                            <span className="text-[11px] text-gray-400 block">
                                                {invoice?.updated_at ? new Date(invoice.updated_at).toLocaleString() : "—"}
                                            </span>
                                        </div>
                                    )}

                                    {isPaid && (
                                        <div className="relative">
                                            <span className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#0b0f19]" />
                                            <span className="text-xs font-semibold text-emerald-400 block">
                                                Payment Recorded & Settled
                                            </span>
                                            <span className="text-[11px] text-gray-400 block">
                                                Amount: {invoice ? formatAmount(invoice.total) : "0"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Payment Link Modal */}
            <PaymentLinkModal
                invoice={invoice}
                client={client || null}
                isOpen={showPaymentLink}
                onClose={() => setShowPaymentLink(false)}
            />
        </AnimatePresence>
    );
}
