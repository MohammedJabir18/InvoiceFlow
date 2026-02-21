import { useState, ReactNode } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
    Building2,
    CreditCard,
    Database,
    UploadCloud,
    CheckCircle2,
    Save,
    Upload,
    Sparkles,
    ChevronRight,
    FileText,
    HardDrive,
    AlertTriangle,
    Loader2,
    Globe,
    Mail,
    Phone,
    MapPin,
    ShieldCheck
} from "lucide-react";

// --- Types ---
interface SectionHeader {
    id: string;
    icon: any;
    title: string;
    desc: string;
}

// --- Components ---

/**
 * SpotlightCard
 * A card with a glowing spotlight effect that follows the mouse cursor.
 */
function SpotlightCard({ children, className = "", spotlightColor = "var(--primary)" }: { children: ReactNode; className?: string; spotlightColor?: string }) {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    return (
        <div
            className={`group relative border border-[var(--premium-border)] bg-[var(--premium-bg)] overflow-hidden rounded-2xl ${className}`}
            onMouseMove={handleMouseMove}
        >
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              color-mix(in srgb, ${spotlightColor} 15%, transparent),
              transparent 80%
            )
          `,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
}

function PremiumInput({ label, type = "text", placeholder, defaultValue, rows, icon: Icon }: { label: string; type?: string; placeholder?: string; defaultValue?: string; rows?: number; icon?: any }) {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!defaultValue);

    return (
        <motion.div 
            className="premium-input-container group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
                {rows ? (
                    <textarea
                        className="premium-input-field premium-textarea w-full bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-xl px-4 pt-6 pb-2 text-[var(--foreground)] placeholder-transparent focus:outline-none focus:bg-[var(--premium-bg-hover)] transition-all resize-none"
                        placeholder={placeholder}
                        defaultValue={defaultValue}
                        rows={rows}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChange={(e) => setHasValue(e.target.value.length > 0)}
                        style={focused ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary), 0 0 15px color-mix(in srgb, var(--primary) 20%, transparent)' } : {}}
                    />
                ) : (
                    <div className="relative flex items-center">
                        <input
                            type={type}
                            className={`premium-input-field w-full bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-xl px-4 pt-6 pb-2 text-[var(--foreground)] placeholder-transparent focus:outline-none focus:bg-[var(--premium-bg-hover)] transition-all ${Icon ? 'pl-11' : ''}`}
                            placeholder={placeholder}
                            defaultValue={defaultValue}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            onChange={(e) => setHasValue(e.target.value.length > 0)}
                            style={focused ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary), 0 0 15px color-mix(in srgb, var(--primary) 20%, transparent)' } : {}}
                        />
                        {Icon && (
                            <Icon 
                                size={18} 
                                className={`absolute left-3.5 top-1/2 -translate-y-[calc(50%-4px)] transition-colors duration-300 ${focused ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} 
                            />
                        )}
                    </div>
                )}
                <label 
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                        focused || hasValue 
                            ? `top-2 text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] ${Icon ? 'left-11' : 'left-4'}` 
                            : `top-4 text-sm text-[var(--text-muted)] ${Icon ? 'left-11' : 'left-4'}`
                    }`}
                >
                    {label}
                </label>
            </div>
        </motion.div>
    );
}

function PremiumSelect({ label, options, defaultValue, icon: Icon }: { label: string; options: { value: string; label: string }[]; defaultValue: string; icon?: any }) {
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!defaultValue);

    return (
        <motion.div 
            className="premium-input-container group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            <div className={`relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
                <div className="relative flex items-center">
                    <select
                        className={`premium-input-field w-full bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-xl px-4 pt-6 pb-2 text-[var(--foreground)] appearance-none focus:outline-none focus:bg-[var(--premium-bg-hover)] transition-all cursor-pointer ${Icon ? 'pl-11' : ''}`}
                        defaultValue={defaultValue}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onChange={(e) => setHasValue(e.target.value.length > 0)}
                        style={focused ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary), 0 0 15px color-mix(in srgb, var(--primary) 20%, transparent)' } : {}}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="bg-[var(--background)] text-[var(--foreground)] py-2">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {Icon && (
                        <Icon 
                            size={18} 
                            className={`absolute left-3.5 top-1/2 -translate-y-[calc(50%-4px)] transition-colors duration-300 ${focused ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} 
                        />
                    )}
                    <ChevronRight 
                        size={16} 
                        className={`absolute right-4 top-1/2 -translate-y-[calc(50%-4px)] pointer-events-none transition-all duration-300 rotate-90 text-[var(--text-muted)] ${focused ? 'text-[var(--primary)]' : ''}`} 
                    />
                </div>
                <label 
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${
                        focused || hasValue 
                            ? `top-2 text-[10px] uppercase tracking-wider font-bold text-[var(--primary)] ${Icon ? 'left-11' : 'left-4'}` 
                            : `top-4 text-sm text-[var(--text-muted)] ${Icon ? 'left-11' : 'left-4'}`
                    }`}
                >
                    {label}
                </label>
            </div>
        </motion.div>
    );
}

function LogoUpload() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="group relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer bg-[var(--premium-bg)] border-2 border-dashed border-[var(--premium-border)] hover:border-[var(--primary)] hover:bg-[var(--premium-bg-hover)] transition-all duration-300"
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                <motion.div
                    animate={{ y: isHovered ? -2 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Upload size={20} className={`transition-colors duration-300 ${isHovered ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                </motion.div>
                <span className={`text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${isHovered ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                    Upload
                </span>
            </div>
            
            {/* Animated background gradient on hover */}
            <motion.div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                    background: 'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)'
                }}
            />
        </div>
    );
}

// --- Main Page Component ---

const sectionHeaders: SectionHeader[] = [
    { id: 'profile', icon: Building2, title: 'Business Profile', desc: 'Identity & Contact Info' },
    { id: 'invoicing', icon: CreditCard, title: 'Invoicing Data', desc: 'Currencies & Taxes' },
    { id: 'system', icon: Database, title: 'System & Data', desc: 'Backup & Reset' },
];

export function Settings() {
    const [activeSection, setActiveSection] = useState('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }, 1500);
    };

    return (
        <div className="pb-20 max-w-7xl mx-auto px-6">
            {/* Header Section */}
            <motion.div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12 mt-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <div className="p-1.5 rounded-lg bg-[rgba(45,212,191,0.1)] border border-[rgba(45,212,191,0.2)]">
                            <Sparkles size={14} className="text-[var(--primary)]" />
                        </div>
                        <span className="text-xs font-bold tracking-[0.15em] uppercase text-[var(--primary)] opacity-90">Workspace Configuration</span>
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--foreground)] mb-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--text-muted)]">Settings</span>
                    </h1>
                    <p className="text-lg text-[var(--text-muted)] max-w-lg">Manage your organization's identity, preferences, and data retention policies.</p>
                </div>

                <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px color-mix(in srgb, var(--primary) 30%, transparent)" }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden group bg-gradient-to-br from-[var(--primary)] to-teal-600 text-[var(--background)] font-bold py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(45,212,191,0.2)] transition-all"
                >
                    <div className="relative z-10 flex items-center gap-2">
                        <AnimatePresence mode="wait">
                            {isSaving ? (
                                <motion.div
                                    key="saving"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Saving...</span>
                                </motion.div>
                            ) : showSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>Saved!</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="save"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Shine Effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent z-0" />
                </motion.button>
            </motion.div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start">
                
                {/* Navigation Sidebar */}
                <div className="sticky top-8 flex flex-col gap-2">
                    {sectionHeaders.map((sec, index) => (
                        <motion.button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className={`group relative flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${
                                activeSection === sec.id 
                                    ? 'bg-[var(--premium-bg-hover)] border border-[var(--premium-border)]' 
                                    : 'hover:bg-[var(--premium-bg)] border border-transparent'
                            }`}
                        >
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                                activeSection === sec.id 
                                    ? 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] shadow-[0_0_15px_rgba(45,212,191,0.3)]' 
                                    : 'bg-[var(--premium-bg)] text-[var(--text-muted)] group-hover:text-[var(--foreground)]'
                            }`}>
                                <sec.icon size={20} className={activeSection === sec.id ? 'text-[var(--background)]' : ''} />
                            </div>
                            <div className="flex-1">
                                <div className={`text-sm font-semibold transition-colors ${activeSection === sec.id ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)] group-hover:text-[var(--foreground)]'}`}>
                                    {sec.title}
                                </div>
                                <div className="text-[11px] text-[var(--text-low)] truncate max-w-[120px]">
                                    {sec.desc}
                                </div>
                            </div>
                            
                            {/* Active Indicator Pill */}
                            {activeSection === sec.id && (
                                <motion.div 
                                    layoutId="activePill"
                                    className="absolute left-0 w-1 h-8 bg-[var(--primary)] rounded-r-full"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[600px]">
                    <AnimatePresence mode="wait">
                        {activeSection === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <SpotlightCard className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--premium-border)]">
                                        <div className="p-3 bg-[var(--premium-bg)] rounded-xl border border-[var(--premium-border)]">
                                            <Building2 size={24} className="text-[var(--primary)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">Business Identity</h2>
                                            <p className="text-sm text-[var(--text-muted)]">Visible on all generated documents</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-8 items-start sm:items-center p-4 rounded-2xl bg-[var(--premium-bg)] border border-[var(--premium-border)]">
                                            <LogoUpload />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-[var(--foreground)] mb-1">Company Logo</h4>
                                                <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                                                    Upload your brand mark. <br/>Recommended: 400x400px transparent PNG.
                                                </p>
                                                <button className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2">
                                                    <Upload size={12} />
                                                    Browse Files
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <PremiumInput label="Company Legal Name" icon={ShieldCheck} placeholder="e.g. Nexus Dynamics LLC" defaultValue="Nexus Dynamics" />
                                        </div>
                                        
                                        <PremiumInput label="Support Email" icon={Mail} type="email" placeholder="hello@company.com" />
                                        <PremiumInput label="Business Phone" icon={Phone} type="tel" placeholder="+1 (555) 000-0000" />
                                        <PremiumInput label="Website" icon={Globe} placeholder="https://example.com" />
                                        <PremiumInput label="Tax ID / VAT" icon={FileText} placeholder="XX-XXXXXXX" />
                                        
                                        <div className="md:col-span-2">
                                            <PremiumInput label="Headquarters Address" icon={MapPin} placeholder="123 Business Avenue&#10;Suite 400&#10;City, State, Zip" rows={3} />
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        )}

                        {activeSection === 'invoicing' && (
                            <motion.div
                                key="invoicing"
                                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <SpotlightCard className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--premium-border)]">
                                        <div className="p-3 bg-[var(--premium-bg)] rounded-xl border border-[var(--premium-border)]">
                                            <CreditCard size={24} className="text-[var(--secondary)]" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">Invoicing Defaults</h2>
                                            <p className="text-sm text-[var(--text-muted)]">Global settings for new invoices</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <PremiumSelect
                                            label="Default Currency"
                                            icon={CreditCard}
                                            options={[
                                                { value: "USD", label: "USD - US Dollar ($)" },
                                                { value: "EUR", label: "EUR - Euro (€)" },
                                                { value: "GBP", label: "GBP - British Pound (£)" },
                                            ]}
                                            defaultValue="USD"
                                        />
                                        <PremiumSelect
                                            label="Payment Terms"
                                            options={[
                                                { value: "DueOnReceipt", label: "Due on Receipt" },
                                                { value: "Net15", label: "Net 15 Days" },
                                                { value: "Net30", label: "Net 30 Days" },
                                            ]}
                                            defaultValue="Net30"
                                        />
                                        <PremiumInput label="Invoice Prefix" placeholder="INV-" defaultValue="INV-" />
                                        <PremiumInput label="Next Number" type="number" placeholder="1001" defaultValue="1001" />
                                        
                                        <div className="md:col-span-2">
                                            <PremiumInput label="Default Footnote" placeholder="Thank you for your business..." rows={2} />
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        )}

                        {activeSection === 'system' && (
                            <motion.div
                                key="system"
                                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <SpotlightCard className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--premium-border)]">
                                        <div className="p-3 bg-[var(--premium-bg)] rounded-xl border border-[var(--premium-border)]">
                                            <Database size={24} className="text-sky-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">System & Data</h2>
                                            <p className="text-sm text-[var(--text-muted)]">Local storage management</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="group p-6 rounded-xl bg-gradient-to-r from-[rgba(45,212,191,0.05)] to-transparent border border-[var(--premium-border)] hover:border-[var(--primary)] transition-all">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-lg bg-teal-500/10 text-[var(--primary)]">
                                                        <UploadCloud size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-[var(--foreground)]">Export Data</h4>
                                                        <p className="text-xs text-[var(--text-muted)]">Download a full JSON backup.</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)] hover:text-[var(--background)] transition-all">
                                                    Export
                                                </button>
                                            </div>
                                        </div>

                                        <div className="group p-6 rounded-xl bg-gradient-to-r from-[rgba(244,63,94,0.05)] to-transparent border border-[var(--premium-border)] hover:border-red-500/30 transition-all">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 rounded-lg bg-red-500/10 text-red-500">
                                                        <AlertTriangle size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-red-500">Danger Zone</h4>
                                                        <p className="text-xs text-[var(--text-muted)]">Irreversible data loss.</p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-red-500 border border-red-500/30 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                                    Reset DB
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
