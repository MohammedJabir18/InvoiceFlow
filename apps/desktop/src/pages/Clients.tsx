import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Users,
    Mail,
    Building2,
    MoreHorizontal,
    X,
    Trash2,
    Loader2,
} from "lucide-react";
import { getClients, createClient, deleteClient, type ClientResponse } from "../lib/api";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export function Clients() {
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);

    // Form refs
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const companyRef = useRef<HTMLInputElement>(null);

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
        } catch (err) {
            console.error("Failed to fetch clients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCreate = async () => {
        const name = nameRef.current?.value?.trim();
        if (!name) return;

        setCreating(true);
        try {
            await createClient({
                name,
                email: emailRef.current?.value?.trim() || null,
                company: companyRef.current?.value?.trim() || null,
            });
            setShowCreate(false);
            await fetchClients();
        } catch (err) {
            console.error("Failed to create client:", err);
            alert("Failed to create client. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) return;
        try {
            await deleteClient(id);
            await fetchClients();
            setMenuId(null);
        } catch (err) {
            console.error("Failed to delete client:", err);
            alert("Failed to delete client. It may have invoices attached.");
        }
    };

    const filtered = clients.filter(
        (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.email || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>Clients</h1>
                    <p className="page-header-subtitle">{clients.length} registered clients</p>
                </div>
                <div className="page-header-actions">
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                        <Plus size={16} /> Add Client
                    </button>
                </div>
            </div>

            <div className="page-content">
                {/* Search */}
                <div style={{ position: "relative", maxWidth: 400, marginBottom: "var(--space-6)" }}>
                    <Search
                        size={16}
                        style={{
                            position: "absolute",
                            left: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-tertiary)",
                        }}
                    />
                    <input
                        className="form-input"
                        placeholder="Search clients..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: 36 }}
                    />
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="empty-state">
                        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent-primary)" }} />
                        <p className="empty-state-desc">Loading clients...</p>
                    </div>
                )}

                {/* Client Cards Grid */}
                {!loading && (
                    <motion.div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                            gap: "var(--space-5)",
                        }}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filtered.map((client) => (
                            <motion.div
                                key={client.id}
                                className="card card-glow"
                                variants={cardVariants}
                                style={{ cursor: "pointer", position: "relative" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                                    <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
                                        {/* Avatar */}
                                        <div
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: "var(--radius-md)",
                                                background: "var(--accent-gradient)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontWeight: 700,
                                                fontSize: "var(--text-lg)",
                                                color: "white",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
                                                {client.name}
                                            </div>
                                            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                                                {client.company || "No company"}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            style={{ height: 30, width: 30 }}
                                            onClick={() => setMenuId(menuId === client.id ? null : client.id)}
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {menuId === client.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                    style={{
                                                        position: "absolute",
                                                        right: 0,
                                                        top: "100%",
                                                        marginTop: 4,
                                                        background: "var(--bg-primary)",
                                                        border: "1px solid var(--border-subtle)",
                                                        borderRadius: "var(--radius-md)",
                                                        padding: "var(--space-1)",
                                                        minWidth: 140,
                                                        zIndex: 50,
                                                        boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                                                    }}
                                                >
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{
                                                            width: "100%",
                                                            justifyContent: "flex-start",
                                                            color: "var(--danger)",
                                                            fontSize: "var(--text-sm)",
                                                            height: 36,
                                                        }}
                                                        onClick={() => handleDelete(client.id)}
                                                    >
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
                                    <Mail size={14} />
                                    <span>{client.email || "No email"}</span>
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "var(--space-6)",
                                        paddingTop: "var(--space-4)",
                                        borderTop: "1px solid var(--border-subtle)",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginBottom: 2 }}>
                                            Company
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                                            {client.company || "—"}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <Users size={28} />
                        </div>
                        <h3 className="empty-state-title">No clients found</h3>
                        <p className="empty-state-desc">Add your first client to start creating invoices.</p>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            <Plus size={16} /> Add Client
                        </button>
                    </div>
                )}
            </div>

            {/* Create Client Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            className="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2>Add New Client</h2>
                                <button className="btn btn-ghost btn-icon" onClick={() => setShowCreate(false)}>
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Client Name *</label>
                                    <input ref={nameRef} className="form-input" placeholder="John Doe / Company Name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input ref={emailRef} className="form-input" type="email" placeholder="billing@company.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company</label>
                                    <input ref={companyRef} className="form-input" placeholder="Company Inc." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    {creating ? "Adding..." : "Add Client"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
