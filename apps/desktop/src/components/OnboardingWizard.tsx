import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Building2,
    CreditCard,
    Wallet,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { useSettingsStore, BusinessProfile, BankDetails } from "../store/settingsStore";

interface OnboardingWizardProps {
    onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Local state for the wizard
    const [profileData, setProfileData] = useState<Partial<BusinessProfile>>({
        name: "",
        email: "",
        phone: "",
        address: {
            line1: "",
            city: "",
            postal_code: "",
            country: ""
        },
        default_currency: "USD",
        default_payment_terms: "Net30"
    });

    const [bankData, setBankData] = useState<BankDetails>({
        accountHolder: "",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branch: "",
        upiId: ""
    });

    const updateSettings = useSettingsStore(state => state.updateSettings);
    const updateBankDetails = useSettingsStore(state => state.updateBankDetails);
    const profile = useSettingsStore(state => state.profile);

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleSkip = () => {
        localStorage.setItem('has_skipped_onboarding', 'true');
        onComplete();
    };

    const handleSaveAndComplete = async () => {
        setIsSaving(true);
        try {
            if (profile) {
                const completeProfile: BusinessProfile = {
                    ...profile,
                    name: profileData.name || "My Company",
                    email: profileData.email || null,
                    phone: profileData.phone || null,
                    address: {
                        ...profile.address,
                        ...profileData.address
                    },
                    default_currency: profileData.default_currency || "USD",
                    default_payment_terms: profileData.default_payment_terms || "Net30"
                };
                await updateSettings(completeProfile);
            }
            await updateBankDetails(bankData);

            // Advance to success step
            setStep(4);

            // Wait 2 seconds then trigger onComplete to close wizard
            setTimeout(() => {
                onComplete();
            }, 2500);

        } catch (error) {
            console.error("Failed setting up account:", error);
            setIsSaving(false);
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
        })
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--background)] overflow-hidden">
            {/* Animated Ambient Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)]/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)]/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl px-6">

                {/* Progress Indicators */}
                {step > 0 && step < 4 && (
                    <div className="flex justify-center gap-3 mb-12">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className={`h-1 rounded-full ${i <= step ? 'bg-[var(--primary)]' : 'bg-[var(--premium-border)]'}`}
                                // width animation
                                animate={{ width: i === step ? 40 : 16 }}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                )}

                <AnimatePresence mode="wait" custom={1}>
                    {/* STEP 0: Welcome */}
                    {step === 0 && (
                        <motion.div
                            key="step-0"
                            custom={1}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                                className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(45,212,191,0.4)] relative"
                            >
                                <Sparkles size={40} className="text-white relative z-10" />
                                <div className="absolute inset-0 bg-white/20 blur-xl rounded-3xl" />
                            </motion.div>

                            <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-6 tracking-tight">
                                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]">InvoiceFlow</span>
                            </h1>
                            <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto mb-12">
                                Let's get your business set up. We'll configure your profile, invoicing defaults, and payment details so you can start billing immediately.
                            </p>

                            <button
                                onClick={handleNext}
                                className="group relative overflow-hidden bg-[var(--foreground)] text-[var(--background)] font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all shadow-2xl"
                            >
                                <span className="relative z-10 flex items-center gap-2 text-lg">
                                    Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 1: Business Profile */}
                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            custom={1}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-[var(--background)] rounded-2xl">
                                    <Building2 size={24} className="text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Business Profile</h2>
                                    <p className="text-[var(--text-muted)]">Your company identity on invoices.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Nexus Dynamics LLC"
                                        value={profileData.name}
                                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Support Email</label>
                                        <input
                                            type="email"
                                            placeholder="hello@company.com"
                                            value={profileData.email || ""}
                                            onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Business Phone</label>
                                        <input
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={profileData.phone || ""}
                                            onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Primary Address</label>
                                    <input
                                        type="text"
                                        placeholder="123 Business Avenue, City, State, Zip"
                                        value={profileData.address?.line1}
                                        onChange={e => setProfileData({ ...profileData, address: { ...profileData.address!, line1: e.target.value } })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[var(--premium-border)]">
                                <button onClick={handleBack} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors">Back</button>
                                <div className="flex items-center gap-4">
                                    <button onClick={handleSkip} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors px-4 py-2 rounded-xl">Skip for now</button>
                                    <button
                                        onClick={handleNext}
                                        disabled={!profileData.name}
                                        className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-500 transition-colors disabled:opacity-50"
                                    >
                                        Continue <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: Invoicing Defaults */}
                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            custom={1}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-[var(--background)] rounded-2xl">
                                    <CreditCard size={24} className="text-secondary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Invoicing Defaults</h2>
                                    <p className="text-[var(--text-muted)]">Global defaults for new invoices.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Default Currency</label>
                                    <select
                                        value={profileData.default_currency}
                                        onChange={e => setProfileData({ ...profileData, default_currency: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    >
                                        <option value="USD">USD - US Dollar ($)</option>
                                        <option value="EUR">EUR - Euro (€)</option>
                                        <option value="GBP">GBP - British Pound (£)</option>
                                        <option value="INR">INR - Indian Rupee (₹)</option>
                                        <option value="JPY">JPY - Japanese Yen (¥)</option>
                                        <option value="CAD">CAD - Canadian Dollar ($)</option>
                                        <option value="AUD">AUD - Australian Dollar ($)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Default Payment Terms</label>
                                    <select
                                        value={profileData.default_payment_terms}
                                        onChange={e => setProfileData({ ...profileData, default_payment_terms: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    >
                                        <option value="DueOnReceipt">Due on Receipt</option>
                                        <option value="Net15">Net 15 Days</option>
                                        <option value="Net30">Net 30 Days</option>
                                        <option value="Net60">Net 60 Days</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[var(--premium-border)]">
                                <button onClick={handleBack} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors">Back</button>
                                <div className="flex items-center gap-4">
                                    <button onClick={handleSkip} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors px-4 py-2 rounded-xl">Skip for now</button>
                                    <button
                                        onClick={handleNext}
                                        className="bg-[var(--primary)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-teal-500 transition-colors"
                                    >
                                        Continue <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3: Bank Details */}
                    {step === 3 && (
                        <motion.div
                            key="step-3"
                            custom={1}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-[var(--background)] rounded-2xl">
                                    <Wallet size={24} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[var(--foreground)]">Bank Details</h2>
                                    <p className="text-[var(--text-muted)]">Where should clients send payments?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={bankData.accountHolder}
                                        onChange={e => setBankData({ ...bankData, accountHolder: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="XXXX XXXX XXXX"
                                            value={bankData.accountNumber}
                                            onChange={e => setBankData({ ...bankData, accountNumber: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">IFSC / Routing</label>
                                        <input
                                            type="text"
                                            placeholder="IFSC0001234"
                                            value={bankData.ifscCode}
                                            onChange={e => setBankData({ ...bankData, ifscCode: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-[var(--text-muted)] mb-2 tracking-wider">Bank Name</label>
                                    <input
                                        type="text"
                                        placeholder="Global Secure Bank"
                                        value={bankData.bankName}
                                        onChange={e => setBankData({ ...bankData, bankName: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--premium-border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-12 pt-6 border-t border-[var(--premium-border)]">
                                <button disabled={isSaving} onClick={handleBack} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors">Back</button>
                                <div className="flex items-center gap-4">
                                    <button disabled={isSaving} onClick={handleSkip} className="text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-colors px-4 py-2 rounded-xl">Skip for now</button>
                                    <button
                                        onClick={handleSaveAndComplete}
                                        disabled={isSaving}
                                        className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(45,212,191,0.3)] disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <><Loader2 size={18} className="animate-spin" /> Finalizing...</>
                                        ) : (
                                            <><CheckCircle2 size={18} /> Complete Setup</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: Success */}
                    {step === 4 && (
                        <motion.div
                            key="step-4"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                                className="w-32 h-32 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                            >
                                <CheckCircle2 size={64} className="text-white" />
                            </motion.div>

                            <h1 className="text-4xl md:text-5xl font-black text-[var(--foreground)] mb-6 tracking-tight">
                                You're All Set!
                            </h1>
                            <p className="text-lg text-[var(--text-muted)] max-w-lg mx-auto">
                                InvoiceFlow is ready. Prepare strictly professional, Awwwards-tier invoices for your clients.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
