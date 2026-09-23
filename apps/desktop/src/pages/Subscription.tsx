import { useState } from "react";
import { Check, ShieldCheck, Zap, Sparkles, Key, AlertCircle, ArrowRight } from "lucide-react";
import { useSubscriptionStore, SUBSCRIPTION_PLANS, type SubscriptionTier } from "../store/subscriptionStore";
import { useSettingsStore } from "../store/settingsStore";
import { formatMoney } from "../lib/currencies";
import { motion } from "framer-motion";
import { SpotlightButton } from "../components/ui/SpotlightButton";

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

    const profile = useSettingsStore(state => state.profile);
    const activeCurrency = profile?.default_currency || "USD";

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
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            COMMERCIAL LICENSING
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold tracking-wide">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                            {status.toUpperCase()} SUBSCRIPTION
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white daylight:text-slate-900">
                        Subscription & Tier Plans
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Scale your commercial billing capabilities, unlock high-frequency Tabby BNPL, and lift limits.
                    </p>
                </div>

                {/* Billing Cycle Toggle */}
                <div className="flex items-center bg-[#0D0F15] daylight:bg-slate-100 p-1 rounded-xl border border-white/10 daylight:border-slate-200 self-start md:self-auto shadow-sm">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            billingCycle === "monthly"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white daylight:text-slate-600 daylight:hover:text-slate-900"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("annual")}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            billingCycle === "annual"
                                ? "bg-blue-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white daylight:text-slate-600 daylight:hover:text-slate-900"
                        }`}
                    >
                        <span>Annual</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/25">
                            Save 20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Active Subscription Summary Banner */}
            <div className="doppelrand-chassis p-[1px] shadow-sm">
                <div className="doppelrand-core p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0D0F15] daylight:bg-white">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-blue-400" size={20} />
                            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                                Current Active Subscription
                            </span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-2xl md:text-3xl font-black text-white daylight:text-slate-900 tracking-tight">{currentPlan.name}</h2>
                            <span className="text-xs text-slate-400 font-mono font-medium">
                                ({billingCycle === "annual" ? "Annual Billed" : "Monthly Billed"})
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-xl">
                            Next scheduled billing date: <span className="text-slate-200 daylight:text-slate-800 font-mono font-semibold">{renewalDate}</span>.
                            {" "}License Key: <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{licenseKey}</span>
                        </p>
                    </div>

                    {/* Quota Meter */}
                    <div className="bg-black/30 daylight:bg-slate-50 border border-white/10 daylight:border-slate-200 rounded-xl p-4 min-w-[260px] shadow-sm">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-400 font-medium">Invoices Issued (Month)</span>
                            <span className="font-bold text-white daylight:text-slate-900 font-mono">
                                {invoicesCreatedThisMonth} / {currentPlan.invoicesLimit === "unlimited" ? "∞" : currentPlan.invoicesLimit}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 daylight:bg-slate-200 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                style={{
                                    width: currentPlan.invoicesLimit === "unlimited" ? "35%" : `${Math.min(100, (invoicesCreatedThisMonth / Number(currentPlan.invoicesLimit)) * 100)}%`
                                }}
                            />
                        </div>
                        <div className="mt-2.5 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                            <span>Tabby BNPL: <span className={currentPlan.hasTabby ? "text-emerald-400 font-bold" : "text-slate-500"}>{currentPlan.hasTabby ? "Enabled" : "Disabled"}</span></span>
                            <span>Reports: <span className="text-blue-400 font-bold">{currentPlan.hasMonthlyReports ? "Full Pro" : "Basic"}</span></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUBSCRIPTION_PLANS.map((plan) => {
                    const isCurrent = currentPlan.tier === plan.tier;
                    const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
                    const formattedPrice = formatMoney(price, activeCurrency, "USD");
                    const isPro = plan.tier === "pro";

                    return (
                        <div
                            key={plan.id}
                            className={`doppelrand-chassis p-[1px] transition-all duration-200 relative ${
                                isCurrent
                                    ? "border-blue-500/50 shadow-[0_4px_20px_rgba(37,99,235,0.2)]"
                                    : isPro
                                    ? "border-white/20 shadow-md"
                                    : "shadow-sm"
                            }`}
                        >
                            <div className="doppelrand-core p-6 flex flex-col justify-between h-full relative overflow-hidden bg-[#0D0F15] daylight:bg-white">
                                {/* Top Badge */}
                                {plan.badge && (
                                    <span className="absolute top-4 right-4 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-600 text-white shadow-sm tracking-wider">
                                        {plan.badge}
                                    </span>
                                )}

                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-extrabold text-white daylight:text-slate-900 tracking-tight">{plan.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6 flex items-baseline gap-1.5">
                                        <span className="text-3xl md:text-4xl font-mono font-black text-white daylight:text-slate-900 tracking-tight">
                                            {formattedPrice}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">/ month</span>
                                        {billingCycle === "annual" && (
                                            <span className="text-[10px] text-emerald-400 font-mono ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                                billed yearly
                                            </span>
                                        )}
                                    </div>

                                    <div className="h-px bg-white/10 daylight:bg-slate-200 mb-6" />

                                    {/* Features List */}
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 daylight:text-slate-700">
                                                <div className="p-0.5 rounded-full bg-blue-500/20 text-blue-400 mt-0.5 shrink-0">
                                                    <Check size={12} className="stroke-[3]" />
                                                </div>
                                                <span className="leading-snug">{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Plan Action */}
                                {isCurrent ? (
                                    <div className="w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                        <Check size={14} className="stroke-[3]" />
                                        <span>Current Active Plan</span>
                                    </div>
                                ) : (
                                    <SpotlightButton
                                        onClick={() => switchPlan(plan.tier)}
                                        variant={isPro ? "white" : "secondary"}
                                        size="md"
                                        className="w-full justify-center"
                                        icon={<Zap size={14} className="fill-current" />}
                                    >
                                        Switch to {plan.name}
                                    </SpotlightButton>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* License Key Activation Section */}
            <div className="doppelrand-chassis p-[1px] shadow-sm">
                <div className="doppelrand-core p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0D0F15] daylight:bg-white">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <Key size={18} className="text-amber-400" />
                            <h3 className="text-sm font-bold text-white daylight:text-slate-900 tracking-tight">Client License Key Activation</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            To provision or upgrade an offline/commercial client instance, enter your issued license key.
                            Example keys: <code className="text-blue-400 bg-white/5 daylight:bg-slate-100 border border-white/10 daylight:border-slate-200 px-1.5 py-0.5 rounded font-mono">IF-PRO-2026</code> or <code className="text-blue-400 bg-white/5 daylight:bg-slate-100 border border-white/10 daylight:border-slate-200 px-1.5 py-0.5 rounded font-mono">IF-ENTERPRISE-2026</code>.
                        </p>
                    </div>

                    <form onSubmit={handleKeySubmit} className="flex items-center gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            placeholder="IF-PRO-XXXX-XXXX"
                            className="px-3.5 py-2.5 rounded-xl bg-[#08090C] daylight:bg-slate-50 border border-white/15 daylight:border-slate-200 text-white daylight:text-slate-900 text-xs font-mono placeholder:text-slate-500 outline-none focus:border-blue-500 w-full md:w-64 transition-colors"
                        />
                        <SpotlightButton
                            type="submit"
                            variant="primary"
                            size="sm"
                        >
                            Activate
                        </SpotlightButton>
                    </form>
                </div>
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
