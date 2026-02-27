import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Save, Share, Loader2, Check, FileClock, X, RefreshCw } from "lucide-react";
import { InvoiceEditor, type InvoiceEditorRef } from "../components/editor/InvoiceEditor";
import { useNavigate } from "react-router-dom";
import { createInvoice, getClients, type ClientResponse } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function Editor() {
    const navigate = useNavigate();
    const editorRef = useRef<InvoiceEditorRef>(null);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState("Draft");

    // Draft State
    const [draftData, setDraftData] = useState<any>(null);
    const [showDraftModal, setShowDraftModal] = useState(false);

    useEffect(() => {
        getClients()
            .then(setClients)
            .catch((err) => console.error("Failed to load clients:", err));

        // Check for drafts
        const savedDraft = localStorage.getItem("invoice_draft");
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                const parsedNotes = parsed.notes ? JSON.parse(parsed.notes) : null;
                const hasProjectDetailsChanges = parsedNotes?.projectDetails?.some((detail: any) => detail.value !== "");

                // Check if the draft actually has meaningful changes compared to a brand new one
                const hasChanges =
                    parsed.clientId !== "" ||
                    (parsed.items && parsed.items.length > 0 && (parsed.items[0].description !== "" || parsed.items[0].unit_price > 0)) ||
                    parsed.invoiceNumber !== null ||
                    parsed.status !== "Draft" ||
                    hasProjectDetailsChanges;

                if (hasChanges) {
                    setDraftData(parsed);
                    setShowDraftModal(true);
                } else {
                    // It's basically an empty draft, just silently drop it
                    localStorage.removeItem("invoice_draft");
                }
            } catch (e) {
                console.error("Failed to parse draft", e);
                localStorage.removeItem("invoice_draft");
            }
        }
    }, []);

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
            const invoiceNumber = await createInvoice({
                invoice_number: data.invoiceNumber,
                client_id: data.clientId,
                items: data.items,
                notes: data.notes || null,
                status: status,
                issue_date: data.issueDate,
                due_date: data.dueDate
            });
            setSaved(true);
            localStorage.removeItem("invoice_draft");
            setTimeout(() => {
                navigate("/invoices");
            }, 1200);
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
        if (!showDraftModal && !saved) {
            localStorage.setItem("invoice_draft", JSON.stringify(data));
        }
    };

    return (
        <div className="flex flex-col h-screen w-full relative">
            <AnimatePresence>
                {showDraftModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-[var(--surface)] border border-[var(--premium-border)] rounded-2xl shadow-2xl shadow-black overflow-hidden relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />

                            <div className="p-8 pb-6 text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                                    <FileClock className="text-amber-500" size={32} />
                                </div>

                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Unfinished Business</h3>
                                <p className="text-[var(--text-muted)] text-sm mb-8 leading-relaxed">
                                    We found an unsaved invoice draft from your last session. Would you like to resume where you left off, or start a new invoice?
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleDraftChoice(true)}
                                        className="w-full relative overflow-hidden group rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 px-4 font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] hover:shadow-amber-500/40"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        <div className="relative flex items-center justify-center gap-2">
                                            <RefreshCw size={18} /> Resume Draft
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleDraftChoice(false)}
                                        className="w-full py-3 px-4 rounded-xl font-medium text-[var(--text-muted)] hover:text-white hover:bg-[var(--premium-bg)] border border-transparent hover:border-[var(--premium-border)] transition-all"
                                    >
                                        Start Fresh
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDraftChoice(true)}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toolbar */}
            <div className="h-16 border-b border-white/5 bg-[var(--surface)]/50 backdrop-blur-md flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-white/5 text-[var(--foreground)] opacity-70 hover:opacity-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="h-6 w-[1px] bg-white/10" />
                    <span className="font-semibold text-[var(--foreground)]">New Invoice</span>

                    {/* Status Selector Badge */}
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-1 py-1 border border-white/10 ml-2">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            disabled={saved}
                            className={`text-xs font-bold px-3 py-1 rounded-full transition-all cursor-pointer outline-none appearance-none ${status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400' :
                                status === 'Pending' ? 'bg-amber-500/20 text-amber-400' :
                                    status === 'Cancelled' ? 'bg-red-500/20 text-red-400' :
                                        'bg-gray-500/20 text-gray-300'
                                }`}
                        >
                            <option value="Draft" className="bg-[#1e293b] text-white">Draft</option>
                            <option value="Pending" className="bg-[#1e293b] text-white">Pending</option>
                            <option value="Sent" className="bg-[#1e293b] text-white">Sent</option>
                            <option value="Paid" className="bg-[#1e293b] text-white">Paid</option>
                            <option value="Cancelled" className="bg-[#1e293b] text-white">Cancelled</option>
                        </select>
                    </div>

                    {saved && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 font-mono ml-2">
                            Saved ✓
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-medium hover:brightness-110 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saved ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--foreground)] transition-colors">
                        <Share size={20} />
                    </button>
                </div>
            </div>

            {/* Editor Canvas Area */}
            <div className="flex-1 overflow-y-auto bg-black/50 relative">
                {!showDraftModal && (
                    <InvoiceEditor
                        ref={editorRef}
                        clients={clients}
                        initialData={draftData}
                        onChange={handleEditorChange}
                    />
                )}

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
            </div>
        </div>
    );
}
