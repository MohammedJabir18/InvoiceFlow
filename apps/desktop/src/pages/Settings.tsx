import { motion } from "framer-motion";
import {
    Building2,
    Globe,
    CreditCard,
    Palette,
    Shield,
    Database,
} from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export function Settings() {
    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p className="page-header-subtitle">Configure your InvoiceFlow workspace.</p>
                </div>
            </div>

            <motion.div
                className="page-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Business Profile */}
                <motion.div className="card" variants={itemVariants} style={{ marginBottom: "var(--space-6)" }}>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-6)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-primary)" }}>
                            <Building2 size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Business Profile</h3>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>Your company information shown on invoices</p>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)" }}>
                        <div className="form-group">
                            <label className="form-label">Business Name</label>
                            <input className="form-input" placeholder="Your Company" defaultValue="" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="hello@company.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone</label>
                            <input className="form-input" type="tel" placeholder="+1 234 567 890" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tax ID / VAT</label>
                            <input className="form-input" placeholder="XX-XXXXXXX" />
                        </div>
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Address</label>
                            <input className="form-input" placeholder="123 Business St, City, Country" />
                        </div>
                    </div>
                </motion.div>

                {/* Invoice Defaults */}
                <motion.div className="card" variants={itemVariants} style={{ marginBottom: "var(--space-6)" }}>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-6)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success)" }}>
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Invoice Defaults</h3>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>Default values for new invoices</p>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-5)" }}>
                        <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select className="form-input" defaultValue="USD">
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="AED">AED (د.إ)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Terms</label>
                            <select className="form-input" defaultValue="Net30">
                                <option value="DueOnReceipt">Due on Receipt</option>
                                <option value="Net15">Net 15</option>
                                <option value="Net30">Net 30</option>
                                <option value="Net60">Net 60</option>
                                <option value="Net90">Net 90</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Invoice Prefix</label>
                            <input className="form-input" placeholder="INV" defaultValue="INV" />
                        </div>
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Default Notes</label>
                            <input className="form-input" placeholder="Thank you for your business!" />
                        </div>
                    </div>
                </motion.div>

                {/* Data & Storage */}
                <motion.div className="card" variants={itemVariants}>
                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-6)" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--warning-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--warning)" }}>
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 600 }}>Data & Storage</h3>
                            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>Your data is stored locally on this device</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "var(--space-4)" }}>
                        <button className="btn btn-secondary">
                            <Database size={16} /> Export Data
                        </button>
                        <button className="btn btn-danger">
                            Reset Database
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}
