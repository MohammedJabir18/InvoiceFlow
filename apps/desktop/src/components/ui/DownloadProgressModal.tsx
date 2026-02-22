import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { openPdf } from '../../lib/api';

interface DownloadProgressModalProps {
    isOpen: boolean;
    status: 'idle' | 'initializing' | 'rendering' | 'generating' | 'complete' | 'error';
    invoiceNumber: string;
    path: string | null;
    error: string | null;
    onClose: () => void;
}

export function DownloadProgressModal({ isOpen, status, invoiceNumber, path, error, onClose }: DownloadProgressModalProps) {
    const steps = [
        { id: 'initializing', label: 'Initializing Engine' },
        { id: 'rendering', label: 'Rendering Template' },
        { id: 'generating', label: 'Generating PDF' }
    ];

    const getStepState = (stepId: string) => {
        if (status === 'complete') return 'done';
        if (status === 'error') return 'done'; // Skip showing active if errored out early

        const currentIndex = steps.findIndex(s => s.id === status);
        const thisIndex = steps.findIndex(s => s.id === stepId);

        if (thisIndex < currentIndex) return 'done';
        if (thisIndex === currentIndex) return 'active';
        return 'waiting';
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#020617]/70 backdrop-blur-2xl"
                        onClick={() => (status === 'complete' || status === 'error') && onClose()}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="relative w-full max-w-sm bg-[#0a0f1a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 overflow-hidden shadow-[0_0_120px_rgba(56,189,248,0.15)]"
                    >
                        {/* Dynamic Top Glow */}
                        <motion.div
                            animate={{
                                opacity: status === 'complete' ? [0.2, 0.5, 0.2] : status === 'error' ? 0.3 : [0.1, 0.3, 0.1],
                                backgroundColor: status === 'complete' ? "rgba(16, 185, 129, 0.3)" : status === 'error' ? "rgba(239, 68, 68, 0.3)" : "rgba(56, 189, 248, 0.3)"
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 blur-[80px] pointer-events-none rounded-full"
                        />

                        {/* Animated Border Sweep (Optimized for GPU) */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none rounded-3xl border border-sky-500/20"
                            animate={{
                                boxShadow: status === 'complete' ? "0 0 60px rgba(16,185,129,0.1) inset, 0 0 40px rgba(16,185,129,0.05)" : status === 'error' ? "0 0 60px rgba(239,68,68,0.1) inset, 0 0 40px rgba(239,68,68,0.05)" : ["0 0 20px rgba(56,189,248,0.02) inset, 0 0 10px rgba(56,189,248,0)", "0 0 40px rgba(56,189,248,0.1) inset, 0 0 30px rgba(56,189,248,0.05)", "0 0 20px rgba(56,189,248,0.02) inset, 0 0 10px rgba(56,189,248,0)"],
                                borderColor: status === 'complete' ? "rgba(16,185,129,0.3)" : status === 'error' ? "rgba(239,68,68,0.3)" : ["rgba(56,189,248,0.1)", "rgba(56,189,248,0.3)", "rgba(56,189,248,0.1)"]
                            }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">

                            {/* Icon Container with Nested Rings */}
                            <motion.div
                                layout
                                className="relative w-24 h-24 mb-6 flex items-center justify-center"
                            >
                                {/* Outer spinning ring */}
                                {status !== 'complete' && status !== 'error' && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 rounded-full border border-dashed border-sky-500/30"
                                    />
                                )}

                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-600/20 border border-sky-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.2)] backdrop-blur-md">
                                    {status === 'complete' ? (
                                        <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }}>
                                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                                        </motion.div>
                                    ) : status === 'error' ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                                            <XCircle className="w-8 h-8 text-red-400" />
                                        </motion.div>
                                    ) : (
                                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                                            <Loader2 className="w-8 h-8 text-sky-400" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Header Text */}
                            <motion.h2 layout className="text-2xl font-bold text-white mb-2 tracking-tight">
                                {status === 'complete' ? 'Export Successful' : status === 'error' ? 'Export Failed' : 'Exporting PDF'}
                            </motion.h2>
                            <motion.p layout className="text-sm text-slate-400 mb-8 max-w-[280px]">
                                {status === 'complete'
                                    ? `Invoice ${invoiceNumber} has been securely saved to your local drive.`
                                    : status === 'error'
                                        ? error
                                        : `Please wait while we generate a high-quality print layout.`}
                            </motion.p>

                            {/* Progress Steps List */}
                            <AnimatePresence mode="popLayout">
                                {status !== 'complete' && status !== 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
                                        className="w-full flex flex-col gap-5 bg-black/40 rounded-2xl p-5 border border-white/5 backdrop-blur-xl relative overflow-hidden"
                                    >
                                        {/* Subtle background gradient inside steps box */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                        {steps.map((step, idx) => {
                                            const state = getStepState(step.id);
                                            return (
                                                <div key={step.id} className="flex items-center gap-4 relative z-10">
                                                    <div className="relative flex items-center justify-center w-6 h-6">
                                                        <AnimatePresence mode="wait">
                                                            {state === 'done' ? (
                                                                <motion.div
                                                                    key="done"
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"
                                                                >
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                                                </motion.div>
                                                            ) : state === 'active' ? (
                                                                <motion.div
                                                                    key="active"
                                                                    className="w-5 h-5 rounded-full border-2 border-sky-500 border-t-transparent animate-spin"
                                                                />
                                                            ) : (
                                                                <motion.div
                                                                    key="waiting"
                                                                    className="w-2 h-2 rounded-full bg-slate-700"
                                                                />
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <span className={`text-sm tracking-wide font-medium transition-colors duration-300 ${state === 'active' ? 'text-white' : state === 'done' ? 'text-slate-400' : 'text-slate-700'}`}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Complete State Actions */}
                            <AnimatePresence>
                                {status === 'complete' && path && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className="w-full flex flex-col gap-3 mt-4"
                                    >
                                        <button
                                            onClick={() => openPdf(path)}
                                            className="group w-full flex items-center justify-center py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] active:scale-[0.98]"
                                        >
                                            <FileText className="w-4 h-4 mr-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                            Open Document
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all active:scale-[0.98] border border-white/5 hover:border-white/10"
                                        >
                                            Dismiss
                                        </button>
                                    </motion.div>
                                )}

                                {/* Error State Actions */}
                                {status === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-full mt-4"
                                    >
                                        <button
                                            onClick={onClose}
                                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all active:scale-[0.98] border border-white/10 group flex items-center justify-center"
                                        >
                                            <XCircle className="w-4 h-4 mr-2 text-slate-400 group-hover:text-white transition-colors" />
                                            Cancel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
