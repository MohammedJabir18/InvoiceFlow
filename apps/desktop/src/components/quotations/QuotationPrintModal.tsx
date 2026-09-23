import { Printer, X, Download, CheckCircle, Calendar, Building, User, Mail } from "lucide-react";
import { type FullQuotation, type ClientResponse } from "../../lib/api";
import { useSettingsStore } from "../../store/settingsStore";
import { formatMoney } from "../../lib/currencies";
import { motion, AnimatePresence } from "framer-motion";

interface QuotationPrintModalProps {
    quotation: FullQuotation | null;
    client: ClientResponse | null;
    isOpen: boolean;
    onClose: () => void;
    onConvert?: (id: string) => void;
}

export function QuotationPrintModal({ quotation, client, isOpen, onClose, onConvert }: QuotationPrintModalProps) {
    const profile = useSettingsStore(state => state.profile);
    const currency = quotation?.currency || profile?.default_currency || "USD";

    if (!isOpen || !quotation) return null;

    const handlePrint = () => {
        window.print();
    };

    let parsedNotes: any = null;
    try {
        if (quotation.notes) {
            parsedNotes = typeof quotation.notes === "string" ? JSON.parse(quotation.notes) : quotation.notes;
        }
    } catch {
        // Plain string
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
                {/* Backdrop Click */}
                <div className="absolute inset-0" onClick={onClose} />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-4xl bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[94vh] z-10 overflow-hidden text-white"
                >
                    {/* Top Action Bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f172a] shrink-0 print:hidden">
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold uppercase">
                                Quotation Preview
                            </span>
                            <span className="font-bold text-sm text-white">{quotation.number}</span>
                        </div>

                        <div className="flex items-center gap-3">
                            {onConvert && quotation.status !== "Converted" && (
                                <button
                                    onClick={() => onConvert(quotation.id)}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                                >
                                    <CheckCircle size={15} />
                                    <span>Convert to Invoice</span>
                                </button>
                            )}

                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/25"
                            >
                                <Printer size={15} />
                                <span>Print Quotation</span>
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Printable Document Paper */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0b0f19] print:p-0 print:bg-white">
                        <div
                            id="quotation-print-area"
                            className="w-full max-w-[210mm] mx-auto bg-white text-gray-900 rounded-sm shadow-xl p-8 sm:p-12 print:shadow-none print:p-0 print:max-w-full font-sans border border-gray-200 print:border-none"
                        >
                            {/* Document Header */}
                            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-6">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950 uppercase">
                                        {profile?.name || "INVOICEFLOW CORP"}
                                    </h1>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                                        {profile?.address?.line1 || "Business Avenue, Suite 400"}, {profile?.address?.city || "Cyber City"}
                                        <br />
                                        Email: {profile?.email || "billing@invoiceflow.io"} | Phone: {profile?.phone || "+1 (555) 019-2834"}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <div className="inline-block bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded text-xs font-extrabold uppercase tracking-widest mb-1">
                                        FORMAL ESTIMATE / QUOTATION
                                    </div>
                                    <h2 className="text-xl font-bold font-mono text-gray-900">{quotation.number}</h2>
                                    <div className="text-xs text-gray-500 space-y-0.5 mt-1 font-mono">
                                        <p>Date: <span className="text-gray-900 font-semibold">{quotation.issue_date}</span></p>
                                        <p className="text-rose-600 font-bold">Valid Until: {quotation.valid_until}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Client Recipient & Overview */}
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-md border border-gray-200 mb-6 text-xs">
                                <div>
                                    <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                                        Prepared For:
                                    </span>
                                    <p className="text-sm font-bold text-gray-900">{client?.name || "Client Name"}</p>
                                    {client?.company && <p className="text-gray-600 font-medium">{client.company}</p>}
                                    {client?.email && <p className="text-blue-600">{client.email}</p>}
                                </div>

                                <div className="space-y-1">
                                    <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[10px] block mb-1">
                                        Quotation Status:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded font-bold text-xs ${
                                            quotation.status === "Accepted"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : quotation.status === "Converted"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-amber-100 text-amber-800"
                                        }`}>
                                            ● {quotation.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-[11px] mt-1">
                                        Currency: <span className="font-semibold text-gray-800">{quotation.currency}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <table className="w-full text-left text-xs mb-6 border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-gray-800 text-gray-700 uppercase tracking-wider text-[10px] font-bold">
                                        <th className="py-2.5 px-2">#</th>
                                        <th className="py-2.5 px-2">Scope / Deliverable Description</th>
                                        <th className="py-2.5 px-2 text-center">Unit</th>
                                        <th className="py-2.5 px-2 text-center">Qty</th>
                                        <th className="py-2.5 px-2 text-right">Unit Rate</th>
                                        <th className="py-2.5 px-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {quotation.items.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td className="py-3 px-2 font-mono text-gray-400">{idx + 1}</td>
                                            <td className="py-3 px-2 font-medium text-gray-900">{item.description}</td>
                                            <td className="py-3 px-2 text-center text-gray-500 font-mono">{item.unit || "unit"}</td>
                                            <td className="py-3 px-2 text-center text-gray-800 font-bold">{item.quantity}</td>
                                            <td className="py-3 px-2 text-right text-gray-700 font-mono">
                                                {formatMoney(item.unit_price, currency, currency)}
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-gray-950 font-mono">
                                                {formatMoney(item.amount, currency, currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Totals Breakdown */}
                            <div className="flex justify-end mb-8">
                                <div className="w-64 space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold text-gray-900 font-mono">{formatMoney(quotation.total, currency, currency)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Estimated Tax:</span>
                                        <span className="font-semibold text-gray-900 font-mono">{formatMoney(0, currency, currency)}</span>
                                    </div>
                                    <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-sm font-extrabold text-gray-950">
                                        <span>TOTAL ESTIMATE:</span>
                                        <span className="font-mono text-base text-blue-700">{formatMoney(quotation.total, currency, currency)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Scope Notes */}
                            <div className="border-t border-gray-200 pt-4 mb-8 text-xs text-gray-600 space-y-2">
                                <h4 className="font-bold text-gray-900 uppercase text-[10px] tracking-wider">
                                    Terms & Acceptance Conditions:
                                </h4>
                                <p className="leading-relaxed">{quotation.terms || "Standard proposal terms apply. Valid for 30 calendar days from issue date."}</p>
                                {parsedNotes?.deliveryTimeline && (
                                    <p className="font-medium text-gray-700">
                                        Estimated Delivery Timeline: {parsedNotes.deliveryTimeline}
                                    </p>
                                )}
                            </div>

                            {/* Signatures & Formal Acceptance */}
                            <div className="grid grid-cols-2 gap-8 border-t border-gray-300 pt-8 text-xs text-gray-700">
                                <div>
                                    <p className="font-bold text-gray-900 mb-10">Issued By (Authorized Signatory):</p>
                                    <div className="w-48 border-b border-gray-400 mb-1" />
                                    <p className="font-medium">{profile?.name || "Mohammed Jabir"}</p>
                                    <p className="text-gray-400 text-[10px]">Title: Managing Director / Contractor</p>
                                </div>

                                <div>
                                    <p className="font-bold text-gray-900 mb-10">Client Acceptance & Approval:</p>
                                    <div className="w-48 border-b border-gray-400 mb-1" />
                                    <p className="font-medium">Signature: ______________________</p>
                                    <p className="text-gray-400 text-[10px]">Date of Acceptance: ____________</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
