import { useRef, useState, useEffect } from "react";
import { ArrowLeft, Save, Share, Loader2, Check } from "lucide-react";
import { InvoiceEditor, type InvoiceEditorRef } from "../components/editor/InvoiceEditor";
import { useNavigate } from "react-router-dom";
import { createInvoice, getClients, type ClientResponse } from "../lib/api";

export function Editor() {
    const navigate = useNavigate();
    const editorRef = useRef<InvoiceEditorRef>(null);
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [status, setStatus] = useState("Draft");

    useEffect(() => {
        getClients()
            .then(setClients)
            .catch((err) => console.error("Failed to load clients:", err));
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
                client_id: data.clientId,
                items: data.items,
                notes: data.notes || null,
                status: status,
                issue_date: data.issueDate,
                due_date: data.dueDate
            });
            setSaved(true);
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

    return (
        <div className="flex flex-col h-screen w-full">
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
                <InvoiceEditor ref={editorRef} clients={clients} />

                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
            </div>
        </div>
    );
}
