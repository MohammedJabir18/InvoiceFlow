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
    Briefcase,
    ArrowRight
} from "lucide-react";
import { getClients, createClient, deleteClient, type ClientResponse } from "../lib/api";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, type: 'spring', bounce: 0.4 } },
};

export function Clients() {
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
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

    // A simple hash function to generate a consistent gradient hue for avatars based on name
    const getHue = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 360);
    };

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Area */}
            <motion.div
                className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Client Hub</h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>Manage your professional network. <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{clients.length} Active Connections</span></p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center">
                    <div className="relative w-full sm:w-[300px]">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)] opacity-60"
                        />
                        <input
                            className="form-input glass-panel w-full"
                            placeholder="Search by name, company, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ paddingLeft: '44px', borderRadius: 'var(--radius-xl)', height: '3rem', border: '1px solid rgba(255,255,255,0.08)' }}
                        />
                    </div>
                    <motion.button
                        className="btn btn-primary glass-panel"
                        onClick={() => setShowCreate(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ height: '3rem', padding: '0 1.5rem', borderRadius: 'var(--radius-xl)' }}
                    >
                        <Plus size={18} /> New Client
                    </motion.button>
                </div>
            </motion.div>

            {/* Content Area */}
            <div className="page-content">
                {/* Loading State */}
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
                                <Loader2 size={36} style={{ color: "var(--primary)" }} />
                            </motion.div>
                            <p style={{ marginTop: '1.5rem', color: 'var(--text-tertiary)', fontSize: '1.1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Synchronizing Data</p>
                        </motion.div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <motion.div
                            key="grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                                gap: "1.5rem",
                            }}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {filtered.map((client) => {
                                const hue = getHue(client.name);
                                return (
                                    <motion.div
                                        key={client.id}
                                        className="glass-panel"
                                        variants={cardVariants}
                                        onMouseEnter={() => setHoveredId(client.id)}
                                        onMouseLeave={() => { setHoveredId(null); setMenuId(null); }}
                                        style={{
                                            position: "relative",
                                            borderRadius: 'var(--radius-2xl)',
                                            padding: '1.75rem',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transformStyle: 'preserve-3d'
                                        }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                    >
                                        {/* Card Ambient Glow Line */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, hsl(${hue}, 80%, 60%), transparent)`, opacity: 0.5 }} />

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                                            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                                {/* Premium Avatar */}
                                                <div
                                                    style={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: "1rem",
                                                        background: `linear-gradient(135deg, hsl(${hue}, 80%, 60%), hsl(${(hue + 40) % 360}, 80%, 50%))`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: 800,
                                                        fontSize: "1.5rem",
                                                        color: "white",
                                                        flexShrink: 0,
                                                        boxShadow: `0 8px 20px -5px hsl(${hue}, 80%, 60%, 0.5)`,
                                                        border: '1px solid rgba(255,255,255,0.2)'
                                                    }}
                                                >
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--foreground)", letterSpacing: '-0.01em' }}>
                                                        {client.name}
                                                    </div>
                                                    <div style={{ fontSize: "0.85rem", color: "var(--primary)", display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                        <Briefcase size={12} /> {client.company || "Independent"}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Context Menu Actions */}
                                            <div style={{ position: "relative" }}>
                                                <motion.button
                                                    className="btn btn-ghost btn-icon"
                                                    style={{ height: 36, width: 36, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}
                                                    onClick={(e) => { e.stopPropagation(); setMenuId(menuId === client.id ? null : client.id); }}
                                                    whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </motion.button>

                                                <AnimatePresence>
                                                    {menuId === client.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            transition={{ duration: 0.2, type: 'spring' }}
                                                            style={{
                                                                position: "absolute",
                                                                right: 0,
                                                                top: "100%",
                                                                marginTop: 8,
                                                                background: "rgba(15, 23, 42, 0.95)",
                                                                backdropFilter: "blur(20px)",
                                                                border: "1px solid rgba(255,255,255,0.1)",
                                                                borderRadius: "var(--radius-lg)",
                                                                padding: "0.5rem",
                                                                minWidth: 160,
                                                                zIndex: 50,
                                                                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                                                            }}
                                                        >
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{
                                                                    width: "100%",
                                                                    justifyContent: "flex-start",
                                                                    color: "var(--color-soft-coral)",
                                                                    fontSize: "0.9rem",
                                                                    gap: '10px'
                                                                }}
                                                                onClick={(e) => handleDelete(client.id, e)}
                                                            >
                                                                <Trash2 size={16} /> Delete Client
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                    <Mail size={12} />
                                                </div>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.email || "No email provided"}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                                                    <Building2 size={12} />
                                                </div>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.company || "—"}</span>
                                            </div>
                                        </div>

                                        {/* Hover Overlay Action */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: hoveredId === client.id ? 1 : 0 }}
                                            style={{ position: 'absolute', bottom: '1.75rem', right: '1.75rem', pointerEvents: 'none' }}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'var(--obsidian-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(45,212,191,0.4)' }}>
                                                <ArrowRight size={16} />
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel"
                            style={{ padding: '6rem 2rem', textAlign: 'center', borderRadius: 'var(--radius-2xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Users size={48} style={{ color: 'var(--foreground)' }} />
                            </div>
                            <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {search ? "No matches found" : "Your network is empty"}
                            </h3>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                                {search
                                    ? `We couldn't find any clients matching "${search}". Try a different keyword.`
                                    : "Start building your professional network. Add your first client to unlock the full potential of InvoiceFlow."}
                            </p>
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '30px' }}>
                                <Plus size={20} /> {search ? "Clear Search" : "Add Your First Client"}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Create Client Premium Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        style={{ position: 'fixed', inset: 0, background: 'color-mix(in srgb, var(--background) 80%, transparent)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                        onClick={() => setShowCreate(false)}
                    >
                        <motion.div
                            className="glass-panel"
                            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40, rotateX: -10 }}
                            transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                            style={{ width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', perspective: '1000px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ padding: '2rem 2.5rem', borderBottom: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)', position: 'relative' }}>
                                {/* Background ambient glow for modal header */}
                                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '100%', background: 'radial-gradient(circle, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 70%)', zIndex: 0 }} />

                                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 0 10px var(--primary)' }} />
                                            New Connection
                                        </h2>
                                        <p style={{ color: 'var(--foreground)', opacity: 0.7, fontSize: '0.9rem', marginTop: '4px' }}>Add a new client to your workspace.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCreate(false)}
                                        style={{ width: 36, height: 36, borderRadius: '50%', background: 'color-mix(in srgb, var(--foreground) 5%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)', opacity: 0.8, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 10%, transparent)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'color-mix(in srgb, var(--foreground) 5%, transparent)'}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'color-mix(in srgb, var(--foreground) 3%, transparent)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Client / Contact Name <span style={{ color: 'var(--primary)' }}>*</span></label>
                                    <div style={{ position: 'relative' }}>
                                        <Users size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground)', opacity: 0.5 }} />
                                        <input ref={nameRef} className="form-input" placeholder="e.g. Sarah Connor" style={{ paddingLeft: '44px' }} autoFocus />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Billing Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground)', opacity: 0.5 }} />
                                        <input ref={emailRef} className="form-input" type="email" placeholder="billing@client.com" style={{ paddingLeft: '44px' }} />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Company / Organization</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building2 size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--foreground)', opacity: 0.5 }} />
                                        <input ref={companyRef} className="form-input" placeholder="e.g. Cyberdyne Systems" style={{ paddingLeft: '44px' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid color-mix(in srgb, var(--foreground) 10%, transparent)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'color-mix(in srgb, var(--foreground) 2%, transparent)' }}>
                                <button className="btn btn-secondary" onClick={() => setShowCreate(false)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground)' }}>
                                    Cancel
                                </button>
                                <motion.button
                                    className="btn btn-primary"
                                    onClick={handleCreate}
                                    disabled={creating}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ padding: '0.75rem 2rem', borderRadius: '30px' }}
                                >
                                    {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                    {creating ? "Provisioning..." : "Add Client"}
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
