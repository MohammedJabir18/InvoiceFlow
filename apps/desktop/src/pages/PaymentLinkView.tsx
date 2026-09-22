import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    CreditCard,
    Building2,
    ShieldCheck,
    CheckCircle2,
    Copy,
    Check,
    Lock,
    ExternalLink,
    ArrowLeft,
    Calendar,
    FileText,
    Download
} from "lucide-react";
import { getInvoiceById, getClients, updateInvoiceStatus, type FullInvoice, type ClientResponse } from "../lib/api";
import { getTabbyInstallments, createTabbySession } from "../lib/tabby";
import { useSettingsStore } from "../store/settingsStore";
import { motion } from "framer-motion";

export function PaymentLinkView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const profile = useSettingsStore(state => state.profile);
    const bankDetails = useSettingsStore(state => state.bankDetails);

    const [invoice, setInvoice] = useState<FullInvoice | null>(null);
    const [client, setClient] = useState<ClientResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeMethod, setActiveMethod] = useState<"tabby" | "card" | "bank">("tabby");
    const [processing, setProcessing] = useState(false);
    const [paidSuccess, setPaidSuccess] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        Promise.all([getInvoiceById(id), getClients()])
            .then(([inv, clientsList]) => {
                if (inv) {
                    setInvoice(inv);
                    if (inv.status === "Paid") setPaidSuccess(true);
                    const foundClient = clientsList.find(c => c.id === inv.client_id);
                    if (foundClient) setClient(foundClient);
                }
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-white">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white p-4 text-center">
                <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
                <p className="text-xs text-gray-400 mb-4">This payment link may have expired or is invalid.</p>
                <button
                    onClick={() => navigate("/invoices")}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                    Back to InvoiceFlow
                </button>
            </div>
        );
    }

    const totalNum = parseFloat(invoice.total || "0");
    const currency = invoice.currency || "USD";
    const tabby = getTabbyInstallments(totalNum, currency);

    const handleCopy = (val: string, field: string) => {
        navigator.clipboard.writeText(val);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleSimulatePayment = async () => {
        setProcessing(true);
        setTimeout(async () => {
            await updateInvoiceStatus(invoice.id, "Paid");
            setProcessing(false);
            setPaidSuccess(true);
        }, 1200);
    };

    const handleTabbyCheckout = async () => {
        setProcessing(true);
        const session = await createTabbySession({
            invoiceId: invoice.number,
            amount: totalNum,
            currency: currency,
            buyerName: client?.name || "Customer",
            buyerEmail: client?.email || undefined
        });

        setTimeout(async () => {
            await updateInvoiceStatus(invoice.id, "Paid");
            setProcessing(false);
            setPaidSuccess(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen w-full flex-1 bg-[#0b0f19] text-white flex flex-col items-center justify-center p-3 sm:p-6 py-10 selection:bg-blue-600">
            {/* Top Security Header */}
            <div className="w-full max-w-xl flex items-center justify-between mb-4 px-2 text-xs text-gray-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <ShieldCheck size={16} />
                    <span>256-Bit SSL Encrypted Checkout</span>
                </div>
                <div className="flex items-center gap-1">
                    <Lock size={12} />
                    <span>Powered by InvoiceFlow</span>
                </div>
            </div>

            {/* Main Checkout Container */}
            <div className="w-full max-w-xl bg-[#111927] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Brand / Invoice Banner */}
                <div className="p-6 bg-gradient-to-br from-[#16233b] to-[#0f172a] border-b border-white/10">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                                {profile?.name || "INVOICEFLOW CLIENT"}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                                Invoice #{invoice.number}
                            </h1>
                            <p className="text-xs text-gray-400 mt-1">
                                Issued to: <span className="text-gray-200 font-medium">{client?.name || "Client"}</span>
                                {client?.company && ` • ${client.company}`}
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Due</span>
                            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                                ${parseFloat(invoice.total).toFixed(2)}
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono">Due: {invoice.due_date}</span>
                        </div>
                    </div>
                </div>

                {/* Paid State Overlay */}
                {paidSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 text-center space-y-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 className="text-xl font-black text-white">Payment Completed!</h2>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                            Thank you! Your payment of <strong className="text-white">${parseFloat(invoice.total).toFixed(2)}</strong> for Invoice #{invoice.number} has been settled and verified.
                        </p>
                        <div className="p-4 rounded-xl bg-[#0b0f19] border border-white/10 max-w-sm mx-auto text-xs space-y-1 font-mono text-gray-300">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Transaction ID:</span>
                                <span>TXN-{Date.now().toString().slice(-8)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Settled On:</span>
                                <span>{new Date().toISOString().split("T")[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment Status:</span>
                                <span className="text-emerald-400 font-bold">PAID IN FULL</span>
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
                        >
                            <Download size={15} />
                            <span>Download Official Receipt</span>
                        </button>
                    </motion.div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Payment Method Selector */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <button
                                    onClick={() => setActiveMethod("tabby")}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all relative ${
                                        activeMethod === "tabby"
                                            ? "bg-gradient-to-b from-[#142921] to-[#0c1815] border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50"
                                            : "bg-[#0b0f19] border-white/10 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    <span className="px-1.5 py-0.2 bg-emerald-500 text-black font-black text-[9px] rounded">
                                        tabby
                                    </span>
                                    <span className="text-xs font-bold">Pay in 4</span>
                                    <span className="text-[9px] text-emerald-400 font-mono">0% Interest</span>
                                </button>

                                <button
                                    onClick={() => setActiveMethod("card")}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                        activeMethod === "card"
                                            ? "bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50"
                                            : "bg-[#0b0f19] border-white/10 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    <CreditCard size={18} />
                                    <span className="text-xs font-bold">Card</span>
                                    <span className="text-[9px] text-gray-500">Visa / MC</span>
                                </button>

                                <button
                                    onClick={() => setActiveMethod("bank")}
                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                                        activeMethod === "bank"
                                            ? "bg-purple-600/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/50"
                                            : "bg-[#0b0f19] border-white/10 text-gray-400 hover:text-white"
                                    }`}
                                >
                                    <Building2 size={18} />
                                    <span className="text-xs font-bold">Transfer</span>
                                    <span className="text-[9px] text-gray-500">Bank / UPI</span>
                                </button>
                            </div>
                        </div>

                        {/* Method 1: Tabby BNPL */}
                        {activeMethod === "tabby" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0d211a] to-[#0a1612] border border-emerald-500/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-black font-black text-xs">
                                            tabby
                                        </span>
                                        <span className="text-xs font-bold text-emerald-400">
                                            Split into 4 interest-free payments
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-300 leading-relaxed mb-4">
                                        Pay 25% today, and the rest in 3 equal monthly installments. No hidden fees, no interest.
                                    </p>

                                    {/* 4 Installment Schedule */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                                        {tabby.schedule.map((sch, i) => (
                                            <div key={i} className="p-2.5 rounded-lg bg-black/40 border border-emerald-500/20">
                                                <span className="text-[10px] text-gray-400 block">{sch.date}</span>
                                                <span className="font-mono font-bold text-emerald-400 text-sm">
                                                    ${sch.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleTabbyCheckout}
                                    disabled={processing}
                                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                                >
                                    <span>{processing ? "Connecting to Tabby..." : `Pay 1st Installment of $${tabby.perMonth.toFixed(2)} with Tabby`}</span>
                                </button>
                            </motion.div>
                        )}

                        {/* Method 2: Credit / Debit Card */}
                        {activeMethod === "card" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="space-y-3 p-4 rounded-xl bg-[#0b0f19] border border-white/5 text-xs">
                                    <div>
                                        <label className="text-gray-400 block mb-1 font-semibold">Cardholder Name</label>
                                        <input
                                            type="text"
                                            defaultValue={client?.name || "Mohammed Jabir"}
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-gray-400 block mb-1 font-semibold">Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="4532 •••• •••• 8920"
                                            defaultValue="4532 8901 2345 6789"
                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-gray-400 block mb-1 font-semibold">Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM / YY"
                                                defaultValue="08/28"
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-center outline-none focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-gray-400 block mb-1 font-semibold">CVC / CVV</label>
                                            <input
                                                type="password"
                                                placeholder="•••"
                                                defaultValue="342"
                                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-center outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSimulatePayment}
                                    disabled={processing}
                                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50"
                                >
                                    <span>{processing ? "Authorizing Card..." : `Pay $${parseFloat(invoice.total).toFixed(2)} Securely`}</span>
                                </button>
                            </motion.div>
                        )}

                        {/* Method 3: Direct Bank / UPI Transfer */}
                        {activeMethod === "bank" && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-4 rounded-xl bg-[#0b0f19] border border-white/5 text-xs space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-gray-400">Account Holder:</span>
                                        <span className="font-bold text-white">{bankDetails?.accountHolder || "Mohammed Jabir"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-gray-400">Bank Name:</span>
                                        <span className="font-bold text-white">{bankDetails?.bankName || "HDFC Bank / Emirates NBD"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                        <span className="text-gray-400">Account / IBAN:</span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-white">
                                            <span>{bankDetails?.accountNumber || "AE07033123456789012"}</span>
                                            <button
                                                onClick={() => handleCopy(bankDetails?.accountNumber || "AE07033123456789012", "acc")}
                                                className="text-gray-400 hover:text-blue-400"
                                            >
                                                {copiedField === "acc" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Routing / IFSC / SWIFT:</span>
                                        <div className="flex items-center gap-1 font-mono font-bold text-white">
                                            <span>{bankDetails?.ifscCode || "EBNBAEADXXX"}</span>
                                            <button
                                                onClick={() => handleCopy(bankDetails?.ifscCode || "EBNBAEADXXX", "ifsc")}
                                                className="text-gray-400 hover:text-blue-400"
                                            >
                                                {copiedField === "ifsc" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSimulatePayment}
                                    disabled={processing}
                                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50"
                                >
                                    <span>{processing ? "Confirming Wire Transfer..." : "I Have Transferred Funds"}</span>
                                </button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
