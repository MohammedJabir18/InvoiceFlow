import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Globe } from "lucide-react";
import { useSettingsStore } from "../store/settingsStore";
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from "../lib/currencies";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
    compact?: boolean;
}

export function CurrencySelector({ compact = false }: Props) {
    const profile = useSettingsStore((state) => state.profile);
    const updateSettings = useSettingsStore((state) => state.updateSettings);

    const activeCurrencyCode = profile?.default_currency || "USD";
    const activeCurrency = getCurrencyInfo(activeCurrencyCode);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const filteredCurrencies = SUPPORTED_CURRENCIES.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.symbol.toLowerCase().includes(q)
        );
    });

    const handleSelect = (code: string) => {
        if (profile) {
            updateSettings({
                ...profile,
                default_currency: code,
            });
        } else {
            // If profile is not yet loaded, save to local storage
            const savedProfile = localStorage.getItem("invoiceflow_profile");
            const parsed = savedProfile ? JSON.parse(savedProfile) : {};
            parsed.default_currency = code;
            localStorage.setItem("invoiceflow_profile", JSON.stringify(parsed));
        }
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                data-testid="currency-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Change currency"
                className={`flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 hover:bg-black/35 px-3 py-1.5 text-xs font-bold text-white transition-all backdrop-blur-md shadow-sm active:scale-95 ${
                    compact ? "h-8 px-2 text-[11px]" : "h-9"
                }`}
            >
                <span className="text-sm leading-none">{activeCurrency.flag}</span>
                <span className="font-mono tracking-tight">{activeCurrency.code}</span>
                <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">
                    ({activeCurrency.symbol})
                </span>
                <ChevronDown
                    size={13}
                    className={`text-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 max-w-[90vw] rounded-2xl bg-[#111927] border border-white/15 p-2 shadow-2xl z-50 backdrop-blur-xl overflow-hidden text-white"
                    >
                        {/* Search Input */}
                        <div className="relative mb-2">
                            <Search
                                size={14}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search 50+ currencies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-[#0b0f19] border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Currency List */}
                        <div className="max-h-64 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 pr-1">
                            {filteredCurrencies.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-400 italic">
                                    No currencies matching "{searchQuery}"
                                </div>
                            ) : (
                                filteredCurrencies.map((curr) => {
                                    const isSelected = curr.code === activeCurrency.code;
                                    return (
                                        <button
                                            key={curr.code}
                                            data-currency-option={curr.code}
                                            type="button"
                                            onClick={() => handleSelect(curr.code)}
                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left ${
                                                isSelected
                                                    ? "bg-blue-600/20 text-blue-300 font-bold border border-blue-500/30"
                                                    : "hover:bg-white/5 text-gray-300"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">{curr.flag}</span>
                                                <div>
                                                    <span className="font-mono font-bold text-white mr-1.5">
                                                        {curr.code}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-normal">
                                                        {curr.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-mono text-gray-400 font-bold">
                                                    {curr.symbol}
                                                </span>
                                                {isSelected && <Check size={14} className="text-blue-400" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="pt-2 mt-1 border-t border-white/10 px-2 flex items-center justify-between text-[10px] text-gray-500">
                            <span>50+ Global ISO Currencies</span>
                            <span className="text-emerald-400 font-medium">Real-time Rates</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
