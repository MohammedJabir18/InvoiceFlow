import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Building2,
    Globe,
    CreditCard,
    Palette,
    Shield,
    Database,
    UploadCloud,
    CheckCircle2,
    Save
} from "lucide-react";

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    },
};

const sectionHeaders = [
    { id: 'profile', icon: Building2, title: 'Business Profile', desc: 'Your company identity' },
    { id: 'invoicing', icon: CreditCard, title: 'Invoicing Data', desc: 'Default terms & currencies' },
    { id: 'system', icon: Database, title: 'System & Data', desc: 'Storage and backups' },
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
        }, 1200);
    };

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div
                className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Workspace Settings</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>Configure your InvoiceFlow environment and defaults.</p>
                </div>

                <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary glass-panel"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', position: 'relative', overflow: 'hidden' }}
                >
                    <AnimatePresence mode="wait">
                        {isSaving ? (
                            <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                    <UploadCloud size={18} />
                                </motion.div>
                                Saving...
                            </motion.div>
                        ) : showSuccess ? (
                            <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-electric-teal)' }}>
                                <CheckCircle2 size={18} />
                                Saved
                            </motion.div>
                        ) : (
                            <motion.div key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} />
                                Save Changes
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12 items-start">
                {/* Navigation Sidebar */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="sticky top-8 flex flex-col gap-2 w-full"
                >
                    {sectionHeaders.map((sec) => (
                        <motion.button
                            key={sec.id}
                            onClick={() => setActiveSection(sec.id)}
                            className="glass-panel"
                            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem 1.25rem',
                                borderRadius: 'var(--radius-xl)',
                                border: activeSection === sec.id ? '1px solid var(--primary)' : '1px solid transparent',
                                background: activeSection === sec.id ? 'var(--surface)' : 'transparent',
                                color: activeSection === sec.id ? 'var(--foreground)' : 'var(--text-tertiary)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ color: activeSection === sec.id ? 'var(--primary)' : 'inherit' }}>
                                <sec.icon size={20} />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{sec.title}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{sec.desc}</div>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>

                {/* Settings Content Area */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-8 w-full"
                >
                    {activeSection === 'profile' && (
                        <motion.div key="profile" variants={itemVariants} className="glass-panel p-6 sm:p-10 rounded-2xl w-full">
                            <div className="mb-8 pb-6 border-b border-[var(--foreground)]/10">
                                <h2 className="text-2xl font-semibold flex items-center gap-3">
                                    <Building2 className="text-glow" style={{ color: 'var(--primary)' }} />
                                    Business Identity
                                </h2>
                                <p className="text-[var(--foreground)] opacity-70 mt-2">This information will be displayed on all generated invoices and reports.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Logo</label>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--surface), var(--obsidian-void))', border: '1px dashed rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Palette size={24} style={{ opacity: 0.5 }} />
                                        </div>
                                        <button className="btn btn-secondary glass-panel">Upload Logo Image</button>
                                    </div>
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Company Legal Name</label>
                                    <input className="form-input" placeholder="e.g. Nexus Dynamics LLC" defaultValue="" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Support Email</label>
                                    <input className="form-input" type="email" placeholder="hello@company.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Business Phone</label>
                                    <input className="form-input" type="tel" placeholder="+1 (555) 000-0000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tax ID / VAT Number</label>
                                    <input className="form-input" placeholder="XX-XXXXXXX" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Website</label>
                                    <input className="form-input" placeholder="https://example.com" />
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Headquarters Address</label>
                                    <textarea className="form-input" rows={3} placeholder="123 Business Avenue&#10;Suite 400&#10;City, State, Zip" style={{ resize: 'vertical' }} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'invoicing' && (
                        <motion.div key="invoicing" variants={itemVariants} className="glass-panel p-6 sm:p-10 rounded-2xl w-full">
                            <div className="mb-8 pb-6 border-b border-[var(--foreground)]/10">
                                <h2 className="text-2xl font-semibold flex items-center gap-3">
                                    <CreditCard className="text-glow" style={{ color: 'var(--primary)' }} />
                                    Invoicing Defaults
                                </h2>
                                <p className="text-[var(--foreground)] opacity-70 mt-2">Set the baseline settings for all new invoices created in the system.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="form-group">
                                    <label className="form-label">Default Currency</label>
                                    <select className="form-input" defaultValue="USD" style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                                        <option value="USD">USD - US Dollar ($)</option>
                                        <option value="EUR">EUR - Euro (€)</option>
                                        <option value="GBP">GBP - British Pound (£)</option>
                                        <option value="INR">INR - Indian Rupee (₹)</option>
                                        <option value="AED">AED - Emirati Dirham (د.إ)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment Terms</label>
                                    <select className="form-input" defaultValue="Net30" style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                                        <option value="DueOnReceipt">Due on Receipt</option>
                                        <option value="Net15">Net 15</option>
                                        <option value="Net30">Net 30</option>
                                        <option value="Net60">Net 60</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Invoice Prefix</label>
                                    <input className="form-input" placeholder="INV-" defaultValue="INV-" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Next Invoice Number</label>
                                    <input className="form-input" placeholder="1001" defaultValue="1001" type="number" />
                                </div>
                                <div className="form-group md:col-span-2">
                                    <label className="form-label">Default Footnote / Thank You Note</label>
                                    <textarea className="form-input" rows={2} placeholder="Thank you for your continued business!" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeSection === 'system' && (
                        <motion.div key="system" variants={itemVariants} className="glass-panel p-6 sm:p-10 rounded-2xl w-full">
                            <div className="mb-8 pb-6 border-b border-[var(--foreground)]/10">
                                <h2 className="text-2xl font-semibold flex items-center gap-3">
                                    <Database className="text-glow" style={{ color: 'var(--primary)' }} />
                                    System & Data Lifecycle
                                </h2>
                                <p className="text-[var(--foreground)] opacity-70 mt-2">Manage your local SQLite database and application data storage.</p>
                            </div>

                            <div className="flex flex-col gap-6 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[var(--foreground)]/5 rounded-xl border border-[var(--foreground)]/10">
                                    <div>
                                        <h4 className="font-semibold mb-1 text-lg">Export All Data</h4>
                                        <p className="text-sm text-[var(--foreground)] opacity-70">Download a complete JSON backup of your clients and invoices.</p>
                                    </div>
                                    <button className="btn btn-secondary glass-panel whitespace-nowrap">Export Backup</button>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-[var(--color-soft-coral)]/5 rounded-xl border border-[var(--color-soft-coral)]/10">
                                    <div>
                                        <h4 className="font-semibold mb-1 text-lg text-[var(--color-soft-coral)]">Danger Zone: Reset Database</h4>
                                        <p className="text-sm text-[var(--foreground)] opacity-70">Permanently erase all data on this device. This cannot be undone.</p>
                                    </div>
                                    <button className="btn btn-danger glass-panel whitespace-nowrap bg-transparent">
                                        <Shield size={16} /> Erase All Data
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
