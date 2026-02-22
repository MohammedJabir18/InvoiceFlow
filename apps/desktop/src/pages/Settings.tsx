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
    ShieldCheck,
    X,
    QrCode,
    Wallet,
    Landmark,
    Hash,
    UserCircle2,
    Settings as SettingsIcon,
    Moon,
    Sun,
    Monitor,
    FolderOpen
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import { useSettingsStore, BusinessProfile, BankDetails } from "../store/settingsStore";

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

function PremiumInput({ label, type = "text", placeholder, value, onChange, rows, icon: Icon }: { label: string; type?: string; placeholder?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; rows?: number; icon?: any }) {
    const [focused, setFocused] = useState(false);
    const hasValue = !!value;

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
                        value={value || ''}
                        onChange={onChange}
                        rows={rows}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        style={focused ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary), 0 0 15px color-mix(in srgb, var(--primary) 20%, transparent)' } : {}}
                    />
                ) : (
                    <div className="relative flex items-center">
                        <input
                            type={type}
                            className={`premium-input-field w-full bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-xl px-4 pt-6 pb-2 text-[var(--foreground)] placeholder-transparent focus:outline-none focus:bg-[var(--premium-bg-hover)] transition-all ${Icon ? 'pl-11' : ''}`}
                            placeholder={placeholder}
                            value={value || ''}
                            onChange={onChange}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
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
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${focused || hasValue
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

function PremiumSelect({ label, options, value, onChange, icon: Icon }: { label: string; options: { value: string; label: string }[]; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; icon?: any }) {
    const [focused, setFocused] = useState(false);
    const hasValue = !!value;

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
                        value={value}
                        onChange={onChange}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
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
                    className={`absolute left-4 transition-all duration-300 pointer-events-none ${focused || hasValue
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
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch existing logo on mount
    useState(() => {
        invoke<string | null>('get_logo').then((data) => {
            if (data) setPreviewUrl(data);
        }).catch(console.error);
    });

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPreviewUrl(base64String);
            try {
                await invoke('save_logo', { base64Data: base64String });
            } catch (error) {
                console.error("Failed to save logo:", error);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        try {
            await invoke('delete_logo');
        } catch (error) {
            console.error("Failed to delete logo:", error);
        }
    };

    return (
        <div
            className={`group relative w-24 h-24 rounded-2xl overflow-hidden cursor-pointer bg-[var(--premium-bg)] border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-[var(--primary)] bg-[var(--premium-bg-hover)] scale-105' : 'border-[var(--premium-border)] hover:border-[var(--primary)] hover:bg-[var(--premium-bg-hover)]'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('logo-upload-input')?.click()}
        >
            <input
                id="logo-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="Logo" className="w-full h-full object-cover" />

                    {/* Hover Overlay for Remove */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                        <button
                            onClick={handleRemove}
                            className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                    </motion.div>
                </>
            ) : (
                <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <motion.div
                            animate={{ y: isHovered || isDragging ? -2 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Upload size={20} className={`transition-colors duration-300 ${(isHovered || isDragging) ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                        </motion.div>
                        <span className={`text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${(isHovered || isDragging) ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                            {isDragging ? 'Drop' : 'Upload'}
                        </span>
                    </div>

                    {/* Animated background gradient on hover */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: 'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)'
                        }}
                    />
                </>
            )}
        </div>
    );
}

function QRUpload() {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Fetch existing QR on mount
    useState(() => {
        invoke<string | null>('get_qr').then((data) => {
            if (data) setPreviewUrl(data);
        }).catch(console.error);
    });

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPreviewUrl(base64String);
            try {
                await invoke('save_qr', { base64Data: base64String });
            } catch (error) {
                console.error("Failed to save QR:", error);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemove = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        try {
            await invoke('delete_qr');
        } catch (error) {
            console.error("Failed to delete QR:", error);
        }
    };

    return (
        <div
            className={`group relative w-32 h-32 rounded-2xl overflow-hidden cursor-pointer bg-[var(--premium-bg)] border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-[var(--primary)] bg-[var(--premium-bg-hover)] scale-105' : 'border-[var(--premium-border)] hover:border-[var(--primary)] hover:bg-[var(--premium-bg-hover)]'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('qr-upload-input')?.click()}
        >
            <input
                id="qr-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {previewUrl ? (
                <>
                    <img src={previewUrl} alt="QR Code" className="w-full h-full object-cover" />

                    {/* Hover Overlay for Remove */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
                    >
                        <button
                            onClick={handleRemove}
                            className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>
                    </motion.div>
                </>
            ) : (
                <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
                        <motion.div
                            animate={{ y: isHovered || isDragging ? -2 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <QrCode size={24} className={`transition-colors duration-300 ${(isHovered || isDragging) ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                        </motion.div>
                        <span className={`text-[10px] font-medium uppercase tracking-wide transition-colors duration-300 ${(isHovered || isDragging) ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                            {isDragging ? 'Drop QR' : 'Upload QR'}
                        </span>
                    </div>

                    {/* Animated background gradient on hover */}
                    <motion.div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: 'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 20%, transparent) 0%, transparent 70%)'
                        }}
                    />
                </>
            )}
        </div>
    );
}

// --- Main Page Component ---

const sectionHeaders: SectionHeader[] = [
    { id: 'preferences', icon: SettingsIcon, title: 'App Preferences', desc: 'Theme & Export' },
    { id: 'profile', icon: Building2, title: 'Business Profile', desc: 'Identity & Contact Info' },
    { id: 'invoicing', icon: CreditCard, title: 'Invoicing Data', desc: 'Currencies & Taxes' },
    { id: 'payments', icon: Wallet, title: 'Payments & Bank', desc: 'Accounts & QR Codes' },
    { id: 'system', icon: Database, title: 'System & Data', desc: 'Backup & Reset' },
];

export function Settings() {
    const [activeSection, setActiveSection] = useState('preferences');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const profile = useSettingsStore(state => state.profile);
    const bankDetails = useSettingsStore(state => state.bankDetails);
    const updateSettings = useSettingsStore(state => state.updateSettings);
    const updateBankDetails = useSettingsStore(state => state.updateBankDetails);

    // Fetch initial data
    useState(() => {
        useSettingsStore.getState().fetchBankDetails();
    });

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        try {
            await updateSettings(profile);
            if (bankDetails) {
                await updateBankDetails(bankDetails);
            } else {
                // Save empty bank details structure to signify no details initially
                await updateBankDetails({
                    accountHolder: "", accountNumber: "", ifscCode: "", bankName: "", branch: "", upiId: ""
                });
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save settings:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateField = (field: keyof BusinessProfile, value: string) => {
        if (!profile) return;
        useSettingsStore.setState({ profile: { ...profile, [field]: value } });
    };

    const handleUpdateAddress = (field: keyof BusinessProfile['address'], value: string) => {
        if (!profile) return;
        useSettingsStore.setState({ profile: { ...profile, address: { ...profile.address, [field]: value } } });
    };

    const handleUpdateBankField = (field: keyof BankDetails, value: string) => {
        const currentDetails = bankDetails || { accountHolder: "", accountNumber: "", ifscCode: "", bankName: "", branch: "", upiId: "" };
        useSettingsStore.setState({ bankDetails: { ...currentDetails, [field]: value } });
    };

    const handleSelectPdfExportDir = async () => {
        try {
            const selectedPath = await open({
                directory: true,
                multiple: false,
                title: "Select PDF Export Location"
            });
            if (selectedPath) {
                handleUpdateField('pdf_export_dir', selectedPath as string);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
        }
    };

    if (!profile) {
        return (
            <div className="flex-1 min-h-screen bg-[var(--background)] p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-[var(--primary)]" size={48} />
            </div>
        );
    }

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
                            className={`group relative flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${activeSection === sec.id
                                ? 'bg-[var(--premium-bg-hover)] border border-[var(--premium-border)]'
                                : 'hover:bg-[var(--premium-bg)] border border-transparent'
                                }`}
                        >
                            <div className={`p-2 rounded-lg transition-all duration-300 ${activeSection === sec.id
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
                        {activeSection === 'preferences' && (
                            <motion.div
                                key="preferences"
                                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <SpotlightCard className="p-8 md:p-10 mb-8">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--premium-border)]">
                                        <div className="p-3 bg-[var(--premium-bg)] rounded-xl border border-[var(--premium-border)]">
                                            <SettingsIcon size={24} className="text-indigo-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">Global Preferences</h2>
                                            <p className="text-sm text-[var(--text-muted)]">Application appearance and behaviors</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2">
                                            <h4 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                                <Sun size={18} className="text-[var(--primary)]" />
                                                Theme Interface
                                            </h4>
                                            <div className="flex bg-[var(--premium-bg)] border border-[var(--premium-border)] rounded-xl p-1 w-full max-w-md">
                                                {[
                                                    { id: 'system', icon: Monitor, label: 'System' },
                                                    { id: 'dark', icon: Moon, label: 'Dark' },
                                                    { id: 'light', icon: Sun, label: 'Light' }
                                                ].map(theme => {
                                                    const isActive = profile.theme_preference === theme.id;
                                                    return (
                                                        <button
                                                            key={theme.id}
                                                            onClick={() => handleUpdateField('theme_preference', theme.id)}
                                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden ${isActive ? 'text-[var(--background)]' : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--premium-bg-hover)]'}`}
                                                        >
                                                            {isActive && (
                                                                <motion.div
                                                                    layoutId="theme-active"
                                                                    className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-teal-500 rounded-lg shadow-md"
                                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                                />
                                                            )}
                                                            <span className="relative z-10 flex items-center gap-2">
                                                                <theme.icon size={16} />
                                                                {theme.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 mt-4">
                                            <h4 className="font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
                                                <FolderOpen size={18} className="text-[var(--primary)]" />
                                                Default PDF Export Location
                                            </h4>

                                            <div className="flex gap-4">
                                                <div className="flex-1 relative">
                                                    <PremiumInput
                                                        label="Save Invoices To"
                                                        icon={HardDrive}
                                                        placeholder="C:\Users\JohnDoe\Documents\Invoices"
                                                        value={profile.pdf_export_dir || ''}
                                                        onChange={(e) => handleUpdateField('pdf_export_dir', e.target.value)}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleSelectPdfExportDir}
                                                    className="shrink-0 group relative overflow-hidden bg-[var(--premium-bg)] border border-[var(--premium-border)] hover:border-[var(--primary)] text-[var(--foreground)] font-bold py-3 px-6 rounded-xl shadow-sm transition-all h-[56px] mt-1 flex items-center gap-2"
                                                >
                                                    <FolderOpen size={18} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                                                    Browse...
                                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent z-0" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                                Leave blank to use the application's internal data directory.
                                            </p>
                                        </div>

                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        )}
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
                                                    Upload your brand mark. <br />Recommended: 400x400px transparent PNG.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2"
                                                    onClick={() => document.getElementById('logo-upload-input')?.click()}
                                                >
                                                    <Upload size={12} />
                                                    Browse Files
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <PremiumInput
                                                label="Company Legal Name"
                                                icon={ShieldCheck}
                                                placeholder="e.g. Nexus Dynamics LLC"
                                                value={profile.name}
                                                onChange={(e) => handleUpdateField('name', e.target.value)}
                                            />
                                        </div>

                                        <PremiumInput
                                            label="Support Email"
                                            icon={Mail}
                                            type="email"
                                            placeholder="hello@company.com"
                                            value={profile.email || ''}
                                            onChange={(e) => handleUpdateField('email', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Business Phone"
                                            icon={Phone}
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={profile.phone || ''}
                                            onChange={(e) => handleUpdateField('phone', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Website / Address Line 2"
                                            icon={Globe}
                                            placeholder="Suite 100"
                                            value={profile.address.line2 || ''}
                                            onChange={(e) => handleUpdateAddress('line2', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Tax ID / VAT"
                                            icon={FileText}
                                            placeholder="XX-XXXXXXX"
                                            value={profile.tax_id || ''}
                                            onChange={(e) => handleUpdateField('tax_id', e.target.value)}
                                        />

                                        <div className="md:col-span-2">
                                            <PremiumInput
                                                label="Primary Address"
                                                icon={MapPin}
                                                placeholder="123 Business Avenue&#10;City, State, Zip"
                                                rows={3}
                                                value={profile.address.line1}
                                                onChange={(e) => handleUpdateAddress('line1', e.target.value)}
                                            />
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
                                                { value: "INR", label: "INR - Indian Rupee (₹)" },
                                                { value: "JPY", label: "JPY - Japanese Yen (¥)" },
                                                { value: "CAD", label: "CAD - Canadian Dollar ($)" },
                                                { value: "AUD", label: "AUD - Australian Dollar ($)" },
                                            ]}
                                            value={profile.default_currency}
                                            onChange={(e) => handleUpdateField('default_currency', e.target.value)}
                                        />
                                        <PremiumSelect
                                            label="Payment Terms"
                                            options={[
                                                { value: "DueOnReceipt", label: "Due on Receipt" },
                                                { value: "Net15", label: "Net 15 Days" },
                                                { value: "Net30", label: "Net 30 Days" },
                                                { value: "Net60", label: "Net 60 Days" },
                                            ]}
                                            value={profile.default_payment_terms}
                                            onChange={(e) => handleUpdateField('default_payment_terms', e.target.value)}
                                        />
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        )}

                        {activeSection === 'payments' && (
                            <motion.div
                                key="payments"
                                initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
                                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                                exit={{ opacity: 0, filter: "blur(10px)", y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <SpotlightCard className="p-8 md:p-10">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-[var(--premium-border)]">
                                        <div className="p-3 bg-[var(--premium-bg)] rounded-xl border border-[var(--premium-border)]">
                                            <Landmark size={24} className="text-emerald-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-[var(--foreground)]">Bank Account Details</h2>
                                            <p className="text-sm text-[var(--text-muted)]">Shown on your invoices</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="md:col-span-2 flex flex-col sm:flex-row gap-8 items-start sm:items-center p-4 rounded-2xl bg-[var(--premium-bg)] border border-[var(--premium-border)]">
                                            <QRUpload />
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-[var(--foreground)] mb-1">Scan to Pay QR Code</h4>
                                                <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                                                    Upload your UPI or Bank QR Code. <br />Shown at the bottom of the invoice.
                                                </p>
                                                <button
                                                    type="button"
                                                    className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] hover:text-[var(--foreground)] transition-colors flex items-center gap-2"
                                                    onClick={() => document.getElementById('qr-upload-input')?.click()}
                                                >
                                                    <Upload size={12} />
                                                    Browse Image
                                                </button>
                                            </div>
                                        </div>

                                        <PremiumInput
                                            label="Account Holder Name"
                                            icon={UserCircle2}
                                            placeholder="John Doe"
                                            value={bankDetails?.accountHolder || ''}
                                            onChange={(e) => handleUpdateBankField('accountHolder', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Account Number"
                                            icon={Hash}
                                            placeholder="XXXX XXXX XXXX"
                                            value={bankDetails?.accountNumber || ''}
                                            onChange={(e) => handleUpdateBankField('accountNumber', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="IFSC Code / Routing Number"
                                            icon={ShieldCheck}
                                            placeholder="IFSC0001234"
                                            value={bankDetails?.ifscCode || ''}
                                            onChange={(e) => handleUpdateBankField('ifscCode', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Bank Name"
                                            icon={Landmark}
                                            placeholder="Global Secure Bank"
                                            value={bankDetails?.bankName || ''}
                                            onChange={(e) => handleUpdateBankField('bankName', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="Branch Name"
                                            icon={MapPin}
                                            placeholder="Downtown Branch"
                                            value={bankDetails?.branch || ''}
                                            onChange={(e) => handleUpdateBankField('branch', e.target.value)}
                                        />
                                        <PremiumInput
                                            label="UPI ID"
                                            icon={Phone}
                                            placeholder="username@bank"
                                            value={bankDetails?.upiId || ''}
                                            onChange={(e) => handleUpdateBankField('upiId', e.target.value)}
                                        />
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
