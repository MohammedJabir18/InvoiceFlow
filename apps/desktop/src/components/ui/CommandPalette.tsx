import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Sparkles, ArrowRight, Loader2, MapPin, Calculator, Presentation, FileText } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
// Note: We'll implement TypewriterReveal inside or as a utility
import { GlassCard } from './GlassCard';

interface ParsedIntent {
    action: 'CreateInvoice' | 'AddDeal' | 'Maps' | 'Summarize' | 'Unknown';
    message: String;
    payload: any | null;
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [intentResult, setIntentResult] = useState<ParsedIntent | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Global Keyboard Shortcut Listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K (Mac) or Ctrl+K (Windows)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }

            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setQuery('');
            setIntentResult(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsProcessing(true);
        setIntentResult(null);

        try {
            // Call the Rust Tauri Bridge
            const result: ParsedIntent = await invoke('process_nl_command', { query });
            setIntentResult(result);
            // Give the user a moment to read the parsing success UI, then route
            setTimeout(() => {
                setIsOpen(false);
                switch (result.action) {
                    case 'CreateInvoice':
                        // Pre-fill logic can be added here using a Zustand store
                        navigate('/editor', { state: { draft: result.payload } });
                        break;
                    case 'AddDeal':
                        navigate('/deals', { state: { draftContact: result.payload } });
                        break;
                    case 'Maps':
                        // Optional routing hook, maybe open a modal or new window
                        break;
                    case 'Summarize':
                        navigate('/dashboard');
                        break;
                    default:
                        break;
                }
            }, 2500);

        } catch (error) {
            console.error("AI Error:", error);
            setIntentResult({
                action: 'Unknown',
                message: 'Neural link disconnected. Could not parse request.',
                payload: null
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const getActionIcon = (action?: string) => {
        switch (action) {
            case 'CreateInvoice': return <FileText className="w-5 h-5 text-indigo-400" />;
            case 'AddDeal': return <Presentation className="w-5 h-5 text-emerald-400" />;
            case 'Maps': return <MapPin className="w-5 h-5 text-amber-400" />;
            case 'Summarize': return <Calculator className="w-5 h-5 text-blue-400" />;
            default: return <Sparkles className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop Blur overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 z-50 bg-black/40 dark:bg-black/60 backdrop-blur-md"
                    />

                    {/* The Palette Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                    >
                        <GlassCard className="overflow-hidden p-0 border border-white/20 dark:border-white/10 shadow-2xl shadow-indigo-500/10">
                            <form onSubmit={handleSubmit} className="relative">
                                <div className="flex items-center px-4 py-4">
                                    <Command className="w-6 h-6 text-indigo-500 mr-3" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ask InvoiceFlow to do anything..."
                                        className="w-full bg-transparent border-none outline-none text-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-light"
                                        autoComplete="off"
                                        spellCheck="false"
                                    />
                                    {isProcessing && (
                                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin absolute right-6" />
                                    )}
                                </div>

                                {/* the glowing bottom edge pulse when typing */}
                                <motion.div
                                    className="h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 absolute bottom-0 left-0 right-0"
                                    animate={{
                                        opacity: query.length > 0 ? [0.3, 0.8, 0.3] : 0.1,
                                        scaleX: query.length > 0 ? [0.9, 1, 0.9] : 1
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                />
                            </form>

                            {/* Suggestions / Results Area */}
                            <div className="border-t border-white/10 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 px-4 py-4 max-h-[60vh] overflow-y-auto">

                                <AnimatePresence mode="wait">
                                    {intentResult ? (
                                        <motion.div
                                            key="result"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="flex items-start gap-4 p-3 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10"
                                        >
                                            <div className="p-2 rounded-lg bg-white/50 dark:bg-black/40 border border-white/20 dark:border-white/5">
                                                {getActionIcon(intentResult.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                    Intent Parsed: {intentResult.action}
                                                </h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                                    {intentResult.message}
                                                </p>

                                                {intentResult.payload && (
                                                    <div className="mt-3 p-3 bg-gray-100/50 dark:bg-black/40 rounded-lg border border-gray-200/50 dark:border-white/5 font-mono text-xs text-gray-500 dark:text-gray-400 overflow-x-auto">
                                                        <pre>{JSON.stringify(intentResult.payload, null, 2)}</pre>
                                                    </div>
                                                )}
                                            </div>
                                            <button className="p-2 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="suggestions"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-2"
                                        >
                                            <p className="text-xs font-medium tracking-wider text-gray-500 dark:text-gray-500 uppercase px-2 mb-3">
                                                Suggested Actions
                                            </p>
                                            {['"Create a new invoice for ACME Corp"', '"Add a new Lead for Platform Redesign"', '"Summarize my revenue this month"'].map((suggestion, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setQuery(suggestion.replace(/"/g, ''))}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-all text-left"
                                                >
                                                    <Sparkles className="w-4 h-4 text-indigo-400/50" />
                                                    <span>{suggestion}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </GlassCard>

                        {/* Instruction hint */}
                        <div className="mt-4 text-center">
                            <span className="text-xs text-gray-500 font-mono tracking-widest uppercase">
                                Powered by AI &bull; Esc to cancel
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
