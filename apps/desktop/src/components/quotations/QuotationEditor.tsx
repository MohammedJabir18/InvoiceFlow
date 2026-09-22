import { useState } from "react";
import { X, Plus, Trash2, Save, FileCheck2, Calendar, User, DollarSign } from "lucide-react";
import { type ClientResponse, type FullQuotation, createQuotation, updateQuotation } from "../../lib/api";

interface QuotationEditorProps {
    clients: ClientResponse[];
    initialData?: FullQuotation | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

interface ItemRow {
    id: string;
    description: string;
    unit: string;
    quantity: number;
    unit_price: number;
}

export function QuotationEditor({ clients, initialData, isOpen, onClose, onSaved }: QuotationEditorProps) {
    const isEdit = Boolean(initialData);

    const [number, setNumber] = useState(initialData?.number || `QUO-${new Date().getFullYear()}-00${Math.floor(Math.random() * 90 + 10)}`);
    const [clientId, setClientId] = useState(initialData?.client_id || (clients[0]?.id || ""));
    const [status, setStatus] = useState(initialData?.status || "Draft");
    const [issueDate, setIssueDate] = useState(initialData?.issue_date || new Date().toISOString().split("T")[0]);
    const [validUntil, setValidUntil] = useState(
        initialData?.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
    );
    const [terms, setTerms] = useState(
        initialData?.terms || "This quotation is valid for 30 days. Payment terms: 50% deposit upon acceptance, 50% upon completion."
    );

    const [items, setItems] = useState<ItemRow[]>(() => {
        if (initialData?.items && initialData.items.length > 0) {
            return initialData.items.map((it, idx) => ({
                id: it.id || `item-${idx + 1}`,
                description: it.description,
                unit: it.unit || "project",
                quantity: typeof it.quantity === "string" ? parseFloat(it.quantity) || 1 : it.quantity,
                unit_price: typeof it.unit_price === "string" ? parseFloat(it.unit_price) || 0 : it.unit_price
            }));
        }
        return [
            { id: "item-1", description: "Design & Architectural Implementation", unit: "project", quantity: 1, unit_price: 2500 }
        ];
    });

    const [saving, setSaving] = useState(false);

    if (!isOpen) return null;

    const handleAddItem = () => {
        setItems([
            ...items,
            { id: `item-${Date.now()}`, description: "", unit: "hrs", quantity: 1, unit_price: 150 }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof ItemRow, val: any) => {
        const next = [...items];
        next[index] = { ...next[index], [field]: val };
        setItems(next);
    };

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            alert("Please select a client.");
            return;
        }
        if (items.every(it => !it.description.trim())) {
            alert("Please provide at least one item description.");
            return;
        }

        setSaving(true);
        try {
            if (isEdit && initialData) {
                await updateQuotation({
                    id: initialData.id,
                    client_id: clientId,
                    items: items.map(it => ({
                        description: it.description,
                        quantity: it.quantity,
                        unit: it.unit,
                        unit_price: it.unit_price
                    })),
                    status,
                    issue_date: issueDate,
                    valid_until: validUntil,
                    terms
                });
            } else {
                await createQuotation({
                    number,
                    client_id: clientId,
                    items: items.map(it => ({
                        description: it.description,
                        quantity: it.quantity,
                        unit: it.unit,
                        unit_price: it.unit_price
                    })),
                    status,
                    issue_date: issueDate,
                    valid_until: validUntil,
                    terms
                });
            }
            onSaved();
            onClose();
        } catch (err) {
            console.error("Failed to save quotation:", err);
            alert("Failed to save quotation.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white my-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f172a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <FileCheck2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">
                                {isEdit ? `Edit Quotation: ${initialData?.number}` : "Create New Quotation / Estimate"}
                            </h2>
                            <p className="text-xs text-gray-400">Formal pricing proposal with validity terms</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                    {/* Top Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                Quotation Number
                            </label>
                            <input
                                type="text"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs font-mono text-white focus:border-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                Client Recipient
                            </label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select a client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.company ? `(${c.company})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                Issue Date
                            </label>
                            <input
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs font-mono text-white focus:border-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                Valid Until (Expiry Date)
                            </label>
                            <input
                                type="date"
                                value={validUntil}
                                onChange={(e) => setValidUntil(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs font-mono text-white focus:border-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Status Select */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                            Quotation Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full sm:w-1/2 px-3.5 py-2 rounded-xl bg-[#0b0f19] border border-white/10 text-xs text-white focus:border-blue-500 outline-none cursor-pointer"
                        >
                            <option value="Draft">Draft (Internal)</option>
                            <option value="Sent">Sent to Client</option>
                            <option value="Accepted">Accepted by Client</option>
                            <option value="Declined">Declined</option>
                            <option value="Converted">Converted to Invoice</option>
                        </select>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                Scope & Deliverables
                            </span>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                            >
                                <Plus size={14} />
                                <span>Add Item</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            {items.map((it, idx) => (
                                <div
                                    key={it.id}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-[#0b0f19] border border-white/5 rounded-xl"
                                >
                                    <input
                                        type="text"
                                        placeholder="Deliverable description..."
                                        value={it.description}
                                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-gray-500 outline-none"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Unit (hrs/days)"
                                        value={it.unit}
                                        onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                                        className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-center text-gray-300 outline-none"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Qty"
                                        value={it.quantity}
                                        onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 1)}
                                        className="w-16 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-center font-bold text-white outline-none"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Rate"
                                        value={it.unit_price}
                                        onChange={(e) => handleItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                                        className="w-24 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-right text-white outline-none"
                                    />
                                    <div className="w-24 text-right font-bold text-xs font-mono text-emerald-400 self-center">
                                        ${(it.quantity * it.unit_price).toFixed(2)}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(idx)}
                                        disabled={items.length <= 1}
                                        className="p-1.5 text-gray-500 hover:text-rose-400 disabled:opacity-30 transition-colors self-center"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subtotal Display */}
                    <div className="flex justify-end pt-2 border-t border-white/10">
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block">Total Quotation Value:</span>
                            <span className="text-xl font-black text-white font-mono">${subtotal.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                            Terms & Proposal Conditions
                        </label>
                        <textarea
                            rows={3}
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-white/10 text-xs text-gray-300 focus:border-blue-500 outline-none leading-relaxed"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                        >
                            <Save size={15} />
                            <span>{saving ? "Saving..." : isEdit ? "Update Quotation" : "Save Quotation"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
