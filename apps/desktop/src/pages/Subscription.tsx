import { useState } from "react";
import { Check, ShieldCheck, Zap, Sparkles, Key, AlertCircle, ArrowRight } from "lucide-react";
import { useSubscriptionStore, SUBSCRIPTION_PLANS, type SubscriptionTier } from "../store/subscriptionStore";
import { motion } from "framer-motion";

export function Subscription() {
    const {
        currentPlan,
        billingCycle,
        status,
        renewalDate,
        invoicesCreatedThisMonth,
        licenseKey,
        switchPlan,
        setBillingCycle,
        activateLicense
    } = useSubscriptionStore();

    const [inputKey, setInputKey] = useState("");
    const [keyMessage, setKeyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleKeySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputKey.trim()) return;
        const ok = activateLicense(inputKey);
        if (ok) {
            setKeyMessage({ type: "success", text: "License activated successfully! Plan updated." });
            setInputKey("");
        } else {
            setKeyMessage({ type: "error", text: "Invalid license format. Must start with IF- (e.g. IF-PRO-2026)" });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 text-white pb-16">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            COMMERCIAL LICENSING
                        </span>
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {status.toUpperCase()} SUBSCRIPTION
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                        Subscription & Plans
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Manage your client plan tier, license keys, and feature allowances.
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center bg-[#131d31] p-1 rounded-xl border border-white/10 self-start md:self-auto">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            billingCycle === "monthly"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("annual")}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            billingCycle === "annual"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                : "text-gray-400 hover:text-white"
                        }`}
                    >
                        <span>Annual</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold rounded-full">
                            Save 20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Active Subscription Summary Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#131d31] to-[#0f172a] border border-blue-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="text-blue-400" size={20} />
                        <span className="text-xs uppercase font-bold tracking-wider text-blue-300">
                            Current Active Subscription
                        </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-2xl font-black text-white">{currentPlan.name}</h2>
                        <span className="text-sm text-gray-400">
                            ({billingCycle === "annual" ? "Annual Billed" : "Monthly Billed"})
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 max-w-xl">
                        Next scheduled billing date: <span className="text-gray-200 font-mono font-medium">{renewalDate}</span>.
                        License Key: <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{licenseKey}</span>
                    </p>
                </div>

                {/* Quota Meter */}
                <div className="bg-[#0b0f19] border border-white/10 rounded-xl p-4 min-w-[240px]">
                    <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400 font-medium">Invoices Issued (Month)</span>
                        <span className="font-bold text-white font-mono">
                            {invoicesCreatedThisMonth} / {currentPlan.invoicesLimit === "unlimited" ? "∞" : currentPlan.invoicesLimit}
                        </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{
                                width: currentPlan.invoicesLimit === "unlimited" ? "35%" : `${Math.min(100, (invoicesCreatedThisMonth / Number(currentPlan.invoicesLimit)) * 100)}%`
                            }}
                        />
                    </div>
                    <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between">
                        <span>Tabby BNPL: {currentPlan.hasTabby ? "Enabled" : "Disabled"}</span>
                        <span>Reports: {currentPlan.hasMonthlyReports ? "Full" : "Basic"}</span>
                    </div>
                </div>
            </div>

            {/* Pricing Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isCurrent = currentPlan.tier === plan.tier;
                    const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                                isCurrent
                                    ? "bg-gradient-to-b from-[#192742] to-[#121a2c] border-blue-500/60 shadow-2xl shadow-blue-500/10 ring-1 ring-blue-500/40"
                                    : "bg-[#111927]/80 hover:bg-[#151f32] border-white/10 shadow-lg"
                            }`}
                        >
                            {/* Top Badge */}
                            {plan.badge && (
                                <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-600 text-white shadow-md shadow-blue-500/40">
                                    {plan.badge}
                                </span>
                            )}

                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{plan.description}</p>
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="mb-6 flex items-baseline gap-1">
                                    <span className="text-3xl md:text-4xl font-black text-white">
                                        {plan.currency}{price}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">/ month</span>
                                    {billingCycle === "annual" && (
                                        <span className="text-[10px] text-emerald-400 font-mono ml-2">
                                            billed yearly
                                        </span>
                                    )}
                                </div>

                                <div className="h-px bg-white/10 mb-6" />

                                {/* Features List */}
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                                            <div className="p-0.5 rounded-full bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
                                                <Check size={12} className="stroke-[3]" />
                                            </div>
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Plan Action */}
                            <button
                                onClick={() => switchPlan(plan.tier)}
                                disabled={isCurrent}
                                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    isCurrent
                                        ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 cursor-default"
                                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-98"
                                }`}
                            >
                                {isCurrent ? (
                                    <>
                                        <Check size={14} />
                                        <span>Current Active Plan</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap size={14} className="fill-current" />
                                        <span>Switch to {plan.name}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* License Key Activation Section */}
            <div className="p-6 rounded-2xl bg-[#111927] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Key size={18} className="text-amber-400" />
                        <h3 className="text-sm font-bold text-white">Client License Key Activation</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        To provision or upgrade an offline/commercial client instance, enter your issued license key.
                        Example keys: <code className="text-blue-400 bg-black/40 px-1 py-0.5 rounded">IF-PRO-2026</code> or <code className="text-blue-400 bg-black/40 px-1 py-0.5 rounded">IF-ENTERPRISE-2026</code>.
                    </p>
                </div>

                <form onSubmit={handleKeySubmit} className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        placeholder="IF-PRO-XXXX-XXXX"
                        className="px-3.5 py-2.5 rounded-xl bg-[#0b0f19] border border-white/15 text-white text-xs font-mono placeholder:text-gray-500 outline-none focus:border-blue-500 w-full md:w-64"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-blue-500/25"
                    >
                        Activate
                    </button>
                </form>
            </div>

            {keyMessage && (
                <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                    keyMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                    <AlertCircle size={16} />
                    <span>{keyMessage.text}</span>
                </div>
            )}
        </div>
    );
}
