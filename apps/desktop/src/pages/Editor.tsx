import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Check, FileClock, X, RefreshCw } from "lucide-react";
import { InvoiceEditor, type InvoiceEditorRef } from "../components/editor/InvoiceEditor";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    createInvoice,
    updateInvoice,
    getInvoiceById,
    getClients,
    type ClientResponse,
    type FullInvoice
} from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function Editor() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editInvoiceId = searchParams.get("id");

    const editorRef = useRef<InvoiceEditorRef>(null);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loadingInvoice, setLoadingInvoice] = useState(Boolean(editInvoiceId));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState("Draft");
    const [existingInvoice, setExistingInvoice] = useState<FullInvoice | null>(null);

    // Draft State (for New Invoices)
    const [draftData, setDraftData] = useState<any>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);

    useEffect(() => {
        getClients()
            .then(setClients)
            .catch((err) => console.error("Failed to load clients:", err));

        // If editing an existing invoice, fetch its data
        if (editInvoiceId) {
            setLoadingInvoice(true);
            getInvoiceById(editInvoiceId)
                .then((inv) => {
                    if (inv) {
                        setExistingInvoice(inv);
                        setStatus(inv.status);
                    }
                })
                .catch((err) => console.error("Failed to load invoice for editing:", err))
                .finally(() => setLoadingInvoice(false));
        } else {
            // Check for drafts only in new invoice mode
            const savedDraft = localStorage.getItem("invoice_draft");
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    const parsedNotes = parsed.notes ? JSON.parse(parsed.notes) : null;
                    const hasProjectDetailsChanges = parsedNotes?.projectDetails?.some((detail: any) => detail.value !== "");

                    const hasChanges =
                        (parsed.clientId && parsed.clientId !== "") ||
                        (parsed.items && parsed.items.length > 0 && (parsed.items[0].description !== "" || parsed.items[0].unit_price > 0)) ||
                        parsed.invoiceNumber !== null ||
                        hasProjectDetailsChanges;

                    if (hasChanges) {
                        setDraftData(parsed);
                        setShowDraftModal(true);
                    } else {
                        localStorage.removeItem("invoice_draft");
                    }
                } catch {
                    localStorage.removeItem("invoice_draft");
                }
            }
        }
    }, [editInvoiceId]);

    const handleSave = async () => {
        if (!editorRef.current) return;
        const data = editorRef.current.getData();

        if (!data.clientId) {
            alert("Please select a client before saving.");
            return;
        }
        if (data.items.length === 0 || data.items.every((i) => !i.description)) {
            alert("Please add at least one line item.");
            return;
        }

        setSaving(true);
        try {
            if (editInvoiceId) {
                // Update Existing Invoice
                await updateInvoice({
                    id: editInvoiceId,
                    client_id: data.clientId,
                    items: data.items,
                    notes: data.notes || null,
                    status: status,
                    issue_date: data.issueDate,
                    due_date: data.dueDate,
                });
            } else {
                // Create New Invoice
                await createInvoice({
                    invoice_number: data.invoiceNumber,
                    client_id: data.clientId,
                    items: data.items,
                    notes: data.notes || null,
                    status: status,
                    issue_date: data.issueDate,
                    due_date: data.dueDate,
                });
                localStorage.removeItem("invoice_draft");
            }

            setSaved(true);
            setTimeout(() => {
                navigate("/invoices");
            }, 1000);
        } catch (err) {
            console.error("Save failed:", err);
            alert("Failed to save invoice. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDraftChoice = (resume: boolean) => {
        if (!resume) {
            localStorage.removeItem("invoice_draft");
            setDraftData(null);
        }
        setShowDraftModal(false);
    };

    const handleEditorChange = (data: any) => {
        if (!editInvoiceId && !showDraftModal && !saved) {
            localStorage.setItem("invoice_draft", JSON.stringify(data));
        }
    };

    return (
        <div className="flex flex-col h-screen w-full relative">
            {/* Draft Recovery Modal */}
            <AnimatePresence>
                {showDraftModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-[#161f30] border border-white/10 rounded-2xl shadow-2xl p-6 relative text-white"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                                    <FileClock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Unsaved Draft Detected</h3>
                                    <p className="text-xs text-gray-400">
                                        We found an unfinished invoice session from earlier.
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs text-gray-300 mb-6 leading-relaxed">
                                Would you like to resume where you left off, or start fresh with a clean document?
                            </p>

                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => handleDraftChoice(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Discard & Start Fresh
                                </button>
                                <button
                                    onClick={() => handleDraftChoice(true)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Resume Draft
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Command Bar */}
            <header className="h-16 border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/invoices")}
                        className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Back to Invoices"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <span>{editInvoiceId ? `Edit Invoice: ${existingInvoice?.number || "..."}` : "Create New Invoice"}</span>
                            {editInvoiceId && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                    Edit Mode
                                </span>
                            )}
                        </h1>
                        <p className="text-[11px] text-gray-400">
                            {editInvoiceId
                                ? "Update line items, tax settings, or terms"
                                : "Changes auto-saved to local memory"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Status Selector */}
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs">
                        <span className="text-gray-400">Status:</span>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-transparent text-white font-semibold outline-none cursor-pointer"
                        >
                            <option value="Draft" className="bg-[#1e293b]">Draft</option>
                            <option value="Pending" className="bg-[#1e293b]">Pending</option>
                            <option value="Sent" className="bg-[#1e293b]">Sent</option>
                            <option value="Paid" className="bg-[#1e293b]">Paid</option>
                            <option value="Overdue" className="bg-[#1e293b]">Overdue</option>
                            <option value="Cancelled" className="bg-[#1e293b]">Cancelled</option>
                        </select>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || saved || loadingInvoice}
                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg ${
                            saved
                                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-95"
                        } disabled:opacity-50`}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : saved ? (
                            <>
                                <Check size={14} />
                                <span>Saved Successfully</span>
                            </>
                        ) : (
                            <>
                                <Save size={14} />
                                <span>{editInvoiceId ? "Update Invoice" : "Save Invoice"}</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Editor Canvas Area */}
            <main className="flex-1 overflow-y-auto bg-[#0b0f19]">
                {loadingInvoice ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <InvoiceEditor
                        key={editInvoiceId ? (existingInvoice?.id || "loading") : (draftData ? "draft" : "new")}
                        ref={editorRef}
                        clients={clients}
                        initialData={editInvoiceId ? existingInvoice : draftData}
                        onChange={handleEditorChange}
                    />
                )}
            </main>
        </div>
    );
}
