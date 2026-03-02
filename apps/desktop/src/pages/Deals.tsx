import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Activity, Target, BrainCircuit, RefreshCw } from "lucide-react";
import { getClients, getDealsByClient, generateDealInsights, type ClientResponse, type Deal, type DealInsights } from "../lib/api";
import { AILoadingState } from "../components/ui/AILoadingState";
import { TypewriterReveal } from "../components/ui/TypewriterReveal";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } },
};

export function Deals() {
    const [clients, setClients] = useState<ClientResponse[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loadingDeals, setLoadingDeals] = useState(false);

    // AI State Map
    const [aiProcessing, setAiProcessing] = useState<Record<string, boolean>>({});

    useEffect(() => {
        (async () => {
            try {
                const data = await getClients();
                setClients(data);
                if (data.length > 0) {
                    handleClientSelect(data[0].id);
                }
            } catch (err) {
                console.error("Failed to fetch clients:", err);
            } finally {
                setLoadingClients(false);
            }
        })();
    }, []);

    const handleClientSelect = async (clientId: string) => {
        setSelectedClient(clientId);
        setLoadingDeals(true);
        try {
            const clientDeals = await getDealsByClient(clientId);
            setDeals(clientDeals);
        } catch (err) {
            console.error("Failed to fetch deals:", err);
        } finally {
            setLoadingDeals(false);
        }
    };

    const handleAnalyze = async (dealId: string) => {
        setAiProcessing(prev => ({ ...prev, [dealId]: true }));
        try {
            // Simulate 2-3 seconds of fake network latency for the "Thinking UI" to show
            const simWait = new Promise(resolve => setTimeout(resolve, 3000));
            const insightsRes = generateDealInsights(dealId);

            const [insights] = await Promise.all([insightsRes, simWait]);

            // Update the local state
            setDeals(prevDeals => prevDeals.map(d =>
                d.id === dealId ? { ...d, ai_lead_score: insights.ai_lead_score, next_suggested_action: insights.next_suggested_action } : d
            ));
        } catch (err) {
            console.error("AI Analysis failed:", err);
        } finally {
            setAiProcessing(prev => ({ ...prev, [dealId]: false }));
        }
    };

    const formatCurrency = (amount: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount));
    };

    // UI Helpers
    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-secondary";
        if (score >= 80) return "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]";
        if (score >= 50) return "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]";
        return "text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]";
    };

    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <motion.div
                className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div>
                    <h1 className="text-gradient flex items-center gap-3" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        <BrainCircuit className="w-8 h-8 text-electric-violet" /> Intelligence
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '1.1rem' }}>AI-driven deal momentum & recommended actions.</p>
                </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar: Client Selection */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white tracking-tight ml-2 border-b border-white/10 pb-2">Connections</h3>

                    {loadingClients ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {clients.map(client => (
                                <motion.button
                                    key={client.id}
                                    onClick={() => handleClientSelect(client.id)}
                                    className={`text-left p-4 rounded-xl border transition-all ${selectedClient === client.id ? 'bg-primary/10 border-primary/30 shadow-[0_0_20px_rgba(45,212,191,0.1)]' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <h4 className={`font-semibold ${selectedClient === client.id ? 'text-white' : 'text-gray-300'}`}>{client.name}</h4>
                                    {client.company && <p className="text-xs text-gray-500 mt-1">{client.company}</p>}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Area: Deals Display */}
                <div className="w-full lg:w-2/3">
                    <AnimatePresence mode="wait">
                        {loadingDeals ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center p-20">
                                <Loader2 className="w-8 h-8 animate-spin text-electric-violet" />
                            </motion.div>
                        ) : deals.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel text-center p-16 rounded-2xl border border-white/5">
                                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-300">No active deals found</h3>
                                <p className="text-gray-500 mt-2">There are no commercial opportunities tracked for this client.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="deals-grid"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col gap-6"
                            >
                                {deals.map(deal => (
                                    <motion.div key={deal.id} variants={itemVariants} className="glass-panel rounded-2xl p-6 border border-white/10 relative overflow-hidden group">

                                        {/* Ambient Background Gradient based on AI status */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-electric-violet/5 to-cyan-glow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            {/* Deal Core Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-white tracking-tight">{deal.title}</h3>
                                                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-white/10 text-gray-300 border border-white/10">
                                                        {deal.status}
                                                    </span>
                                                </div>
                                                <p className="text-2xl font-mono font-medium text-cyan-glow drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]">
                                                    {formatCurrency(deal.value)}
                                                </p>
                                            </div>

                                            {/* Action Trigger */}
                                            <div className="shrink-0 flex items-center justify-end">
                                                {!aiProcessing[deal.id] && !deal.ai_lead_score && (
                                                    <motion.button
                                                        onClick={() => handleAnalyze(deal.id)}
                                                        className="relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm tracking-wide text-white transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] border border-electric-violet/50 hover:border-cyan-glow/50"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        {/* Animated BG */}
                                                        <span className="absolute inset-0 bg-gradient-to-r from-electric-violet via-[#4c1d95] to-cyan-glow bg-[length:200%_auto] animate-gradient-xy opacity-80" />
                                                        <span className="relative flex items-center gap-2">
                                                            <Sparkles className="w-4 h-4" /> Synthesize Insights
                                                        </span>
                                                    </motion.button>
                                                )}

                                                {deal.ai_lead_score && !aiProcessing[deal.id] && (
                                                    <motion.button
                                                        onClick={() => handleAnalyze(deal.id)}
                                                        className="text-gray-500 hover:text-white flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-white/10 transition-colors"
                                                        title="Re-analyze"
                                                    >
                                                        <RefreshCw className="w-4 h-4" /> Refresh
                                                    </motion.button>
                                                )}
                                            </div>
                                        </div>

                                        {/* AI Insights Area */}
                                        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 min-h-[140px]">
                                            <AnimatePresence mode="wait">
                                                {aiProcessing[deal.id] ? (
                                                    <motion.div
                                                        key="thinking"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                    >
                                                        <AILoadingState />
                                                    </motion.div>
                                                ) : deal.ai_lead_score !== null ? (
                                                    <motion.div
                                                        key="insights"
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="flex flex-col md:flex-row items-center gap-6 rounded-xl bg-black/40 p-6 border border-electric-violet/20 shadow-[inset_0_0_20px_rgba(124,58,237,0.05)]"
                                                    >
                                                        {/* Score Ring */}
                                                        <div className="shrink-0 flex flex-col items-center">
                                                            <div className="relative w-20 h-20 flex items-center justify-center bg-black rounded-full border border-white/10 shadow-lg">
                                                                {/* Glowing stroke mimicking radial progress */}
                                                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                                    <circle cx="40" cy="40" r="38" className="stroke-white/10 fill-none" strokeWidth="4" />
                                                                    <motion.circle
                                                                        cx="40" cy="40" r="38"
                                                                        className={`fill-none ${getScoreColor(deal.ai_lead_score).split(' ')[0]}`}
                                                                        strokeWidth="4"
                                                                        strokeDasharray="239"
                                                                        initial={{ strokeDashoffset: 239 }}
                                                                        animate={{ strokeDashoffset: 239 - (239 * deal.ai_lead_score) / 100 }}
                                                                        transition={{ duration: 2, ease: "easeOut" }}
                                                                        strokeLinecap="round"
                                                                    />
                                                                </svg>
                                                                <span className={`text-2xl font-bold font-mono ${getScoreColor(deal.ai_lead_score)}`}>
                                                                    {deal.ai_lead_score}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-3">Momentum</span>
                                                        </div>

                                                        {/* Suggestion Typewriter */}
                                                        <div className="flex-1 w-full relative">
                                                            <div className="flex items-center gap-2 mb-2 text-electric-violet">
                                                                <Activity className="w-4 h-4" />
                                                                <span className="text-xs font-bold uppercase tracking-wider">Suggested Action</span>
                                                            </div>
                                                            <p className="text-gray-200 text-sm leading-relaxed">
                                                                <TypewriterReveal text={deal.next_suggested_action || "Awaiting further interaction data to form a strategic hypothesis."} delay={0.2} />
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="flex items-center justify-center p-6 bg-black/20 rounded-xl border border-dashed border-white/10">
                                                        <p className="text-sm tracking-wide text-gray-500 font-medium">Click synthesize to parse historical CRM interactions.</p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
