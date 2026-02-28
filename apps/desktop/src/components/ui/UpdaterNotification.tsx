import React, { useEffect, useState } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, RefreshCw, X, Stars } from 'lucide-react';

export const UpdaterNotification: React.FC = () => {
    const [updateInfo, setUpdateInfo] = useState<Update | null>(null);
    const [status, setStatus] = useState<'idle' | 'downloading' | 'ready'>('idle');
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const update = await check();
                if (update && update.available) {
                    setUpdateInfo(update);
                    setVisible(true);
                }
            } catch (error) {
                console.error('Failed to check for updates:', error);
            }
        };

        // Check for updates shortly after app stablizes
        const timer = setTimeout(checkForUpdates, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleUpdate = async () => {
        if (!updateInfo) return;

        try {
            setStatus('downloading');
            let downloaded = 0;
            let contentLength = 0;

            await updateInfo.downloadAndInstall((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength || 0;
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength;
                        if (contentLength > 0) {
                            setProgress(Math.round((downloaded / contentLength) * 100));
                        }
                        break;
                    case 'Finished':
                        setStatus('ready');
                        setProgress(100);
                        break;
                }
            });

            setStatus('ready');
        } catch (error) {
            console.error('Failed to download update:', error);
            setStatus('idle');
            // Ideally, show an error toast here
        }
    };

    const handleRelaunch = async () => {
        await relaunch();
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 right-6 z-50 w-96 backdrop-blur-xl bg-black/60 border border-brand-primary/20 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.15)] overflow-hidden"
                >
                    {/* Animated background glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent opacity-50"></div>

                    {/* Close button (only shown when idle) */}
                    {status === 'idle' && (
                        <button
                            onClick={() => setVisible(false)}
                            className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-brand-primary/10 rounded-xl border border-brand-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                            {status === 'idle' && <Stars className="w-6 h-6 text-brand-primary animate-pulse" />}
                            {status === 'downloading' && <RefreshCw className="w-6 h-6 text-brand-primary animate-spin" />}
                            {status === 'ready' && <CheckCircle className="w-6 h-6 text-green-400" />}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-white font-medium text-lg tracking-wide">
                                {status === 'ready' ? 'Ready to Install' : 'Update Available'}
                            </h3>

                            <div className="mt-1 text-sm text-white/60 leading-relaxed font-light">
                                {status === 'idle' && (
                                    <>
                                        Version <span className="text-brand-primary font-mono bg-brand-primary/10 px-1 py-0.5 rounded">{updateInfo?.version}</span> is ready!
                                        Experience the latest features and optimizations.
                                    </>
                                )}
                                {status === 'downloading' && 'Downloading high-performance assets...'}
                                {status === 'ready' && 'InvoiceFlow ecosystem is primed for relaunch.'}
                            </div>

                            {/* Progress Bar */}
                            {status === 'downloading' && (
                                <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-brand-secondary to-brand-primary shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ ease: "linear" }}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-5 flex items-center gap-3">
                                {status === 'idle' && (
                                    <>
                                        <button
                                            onClick={handleUpdate}
                                            className="flex-1 bg-gradient-to-r from-brand-secondary/80 to-brand-primary/80 hover:from-brand-secondary hover:to-brand-primary text-black font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)]"
                                        >
                                            <Download className="w-4 h-4" />
                                            Ignite Download
                                        </button>
                                    </>
                                )}

                                {status === 'ready' && (
                                    <button
                                        onClick={handleRelaunch}
                                        className="flex-1 bg-white hover:bg-gray-100 text-black font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Relaunch Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
