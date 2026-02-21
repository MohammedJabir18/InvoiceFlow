import { Plus, Trash2 } from "lucide-react";

export interface LineItem {
    id: number;
    description: string;
    quantity: number;
    price: number;
}

interface Props {
    items: LineItem[];
    onItemsChange: (items: LineItem[]) => void;
    notes: string;
    onNotesChange: (notes: string) => void;
}

export function TableBlock({ items, onItemsChange, notes, onNotesChange }: Props) {
    const addItem = () => {
        onItemsChange([...items, { id: Date.now(), description: "", quantity: 1, price: 0 }]);
    };

    const updateItem = (id: number, field: keyof LineItem, value: string | number) => {
        onItemsChange(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        onItemsChange(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    return (
        <div className="py-6 px-8 space-y-4">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[var(--secondary)] text-left text-xs font-bold text-[var(--secondary)] uppercase tracking-widest">
                        <th className="pb-2 w-[50%]">Description</th>
                        <th className="pb-2 w-[15%] text-right">Qty</th>
                        <th className="pb-2 w-[15%] text-right">Price</th>
                        <th className="pb-2 w-[15%] text-right">Amount</th>
                        <th className="pb-2 w-[5%]"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((item) => (
                        <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-2.5">
                                <input
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                    className="bg-transparent w-full outline-none text-[var(--foreground)] font-medium placeholder-white/20"
                                    placeholder="Item description..."
                                />
                            </td>
                            <td className="py-2.5 text-right">
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                                    className="bg-transparent w-full text-right outline-none text-[var(--foreground)] opacity-80"
                                />
                            </td>
                            <td className="py-2.5 text-right">
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                                    className="bg-transparent w-full text-right outline-none text-[var(--foreground)] opacity-80"
                                />
                            </td>
                            <td className="py-2.5 text-right font-mono text-[var(--foreground)]">
                                ${(item.quantity * item.price).toFixed(2)}
                            </td>
                            <td className="py-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => removeItem(item.id)} className="text-rose-400 hover:text-rose-300">
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <button
                onClick={addItem}
                className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] uppercase tracking-wider hover:text-[var(--secondary)] transition-colors"
            >
                <Plus size={14} /> Add Line Item
            </button>

            {/* Notes */}
            <div className="pt-4">
                <label className="text-xs font-bold text-[var(--secondary)] uppercase tracking-widest mb-2 block">Notes</label>
                <textarea
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    className="bg-transparent w-full outline-none text-[var(--foreground)] opacity-80 resize-none text-sm border border-white/5 rounded-lg p-3 placeholder-white/20"
                    placeholder="Payment instructions, thank you note..."
                    rows={2}
                />
            </div>

            {/* Totals */}
            <div className="flex justify-end pt-4">
                <div className="w-1/3 space-y-3">
                    <div className="flex justify-between text-sm text-[var(--foreground)] opacity-70">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--foreground)] opacity-70">
                        <span>Tax (10%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-[var(--foreground)] border-t border-white/10 pt-3">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
