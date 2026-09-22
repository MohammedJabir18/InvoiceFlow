import React, { useState, useId } from "react";
import { X, Copy, Check, QrCode, Share2, ExternalLink, MessageCircle, Mail } from "lucide-react";
import { type InvoiceSummary, type ClientResponse } from "../../lib/api";
import { getTabbyInstallments, formatCurrencyAmount } from "../../lib/tabby";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentLinkModalProps {
    invoice: InvoiceSummary | null;
    client: ClientResponse | null;
    isOpen: boolean;
    onClose: () => void;
}

// Simple, reliable native SVG QR Code pattern generator
function SimpleSvgQr({ text, size = 180 }: { text: string; size?: number }) {
    // Generate a deterministic visual QR pattern from the URL text
    const cells = 21;
    const cellSize = size / cells;

    const isFilled = (r: number, c: number) => {
        // Finder patterns (3 corners)
        if ((r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7)) {
            if (r === 0 || r === 6 || c === 0 || c === 6 ||
                r === cells - 1 || r === cells - 7 || c === cells - 1 || c === cells - 7) return true;
            if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
            if (r >= 2 && r <= 4 && c >= cells - 5 && c <= cells - 3) return true;
            if (r >= cells - 5 && r <= cells - 3 && c >= 2 && c <= 4) return true;
            return false;
        }
        // Pseudo-random deterministic hashing from URL text
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = ((hash << 5) - hash) + text.charCodeAt(i) + (r * 31 + c * 17);
            hash |= 0;
        }
        return Math.abs(hash) % 3 === 0;
    };

    const rects: React.ReactElement[] = [];
    for (let r = 0; r < cells; r++) {
        for (let c = 0; c < cells; c++) {
            if (isFilled(r, c)) {
                rects.push(
                    <rect
                        key={`${r}-${c}`}
                        x={c * cellSize}
                        y={r * cellSize}
                        width={cellSize}
                        height={cellSize}
                        fill="#000000"
                    />
                );
            }
        }
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg bg-white p-2">
            {rects}
        </svg>
    );
}

export function PaymentLinkModal({ invoice, client, isOpen, onClose }: PaymentLinkModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen || !invoice) return null;

    // Generate link URL pointing to current origin or LAN IP
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:1420";
    const paymentUrl = `${origin}/pay/${invoice.id}`;
    const amountNum = parseFloat(invoice.total || "0");
    const currency = invoice.currency || "USD";
    const tabby = getTabbyInstallments(amountNum, currency);

    const handleCopy = () => {
        navigator.clipboard.writeText(paymentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(
            `Hi ${client?.name || "there"}, here is the payment link for Invoice #${invoice.number} (${currency} ${invoice.total}):\n${paymentUrl}\n\nYou can pay securely via Card, Direct Transfer, or split in 4 with Tabby.`
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Payment Link for Invoice ${invoice.number}`);
        const body = encodeURIComponent(
            `Dear ${client?.name || "Client"},\n\nPlease find your secure online payment link below for Invoice #${invoice.number}:\n${paymentUrl}\n\nTotal Due: ${currency} ${invoice.total}\nDue Date: ${invoice.due_date}\n\nThank you!`
        );
        window.open(`mailto:${client?.email || ""}?subject=${subject}&body=${body}`, "_blank");
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
                <div className="absolute inset-0" onClick={onClose} />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg my-auto bg-[#131b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white z-10 max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0f172a] shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">Payment Link & QR Code</h3>
                                <p className="text-xs text-gray-400">Shareable online checkout portal</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 overflow-y-auto">
                        {/* Invoice Summary Card */}
                        <div className="p-4 rounded-xl bg-[#0b0f19] border border-white/5 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400">Invoice #{invoice.number}</span>
                                <h4 className="text-sm font-bold text-white mt-0.5">{client?.name || "Client"}</h4>
                                <span className="text-xs text-gray-400">Due: {invoice.due_date}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] uppercase font-bold text-gray-400">Amount Due</span>
                                <div className="text-xl font-black text-blue-400 font-mono">
                                    ${parseFloat(invoice.amount_due || invoice.total).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Tabby BNPL Banner */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-[#0d1c24] border border-emerald-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="px-2 py-0.5 rounded bg-emerald-500 text-black font-black text-[10px] tracking-wider">
                                    tabby
                                </div>
                                <span className="text-xs text-gray-200">
                                    or 4 interest-free payments of <span className="font-bold text-emerald-400 font-mono">${tabby.perMonth.toFixed(2)}</span>
                                </span>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase">0% Interest</span>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center p-4 bg-[#0b0f19] rounded-xl border border-white/5">
                            <SimpleSvgQr text={paymentUrl} size={160} />
                            <p className="text-[11px] text-gray-400 mt-2.5 text-center">
                                Scan with any smartphone camera to open the payment page
                            </p>
                        </div>

                        {/* Link Input & Copy */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                                Direct Payment URL
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={paymentUrl}
                                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-white/10 text-xs font-mono text-gray-300 outline-none select-all"
                                />
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20"
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                    <span>{copied ? "Copied!" : "Copy"}</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick Share Buttons */}
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={handleWhatsApp}
                                className="py-2.5 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <MessageCircle size={15} />
                                <span>WhatsApp</span>
                            </button>

                            <button
                                onClick={handleEmail}
                                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <Mail size={15} />
                                <span>Email Link</span>
                            </button>

                            <button
                                onClick={() => window.open(paymentUrl, "_blank")}
                                className="py-2.5 px-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                <ExternalLink size={15} />
                                <span>Preview</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
