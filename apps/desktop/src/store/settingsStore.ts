import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../lib/api';

export interface Address {
    line1: string;
    line2?: string | null;
    city: string;
    state?: string | null;
    postal_code: string;
    country: string;
}

export interface BusinessProfile {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address: Address;
    tax_id?: string | null;
    logo_path?: string | null;
    logo_url?: string | null;
    default_currency: string;
    default_payment_terms: string;
    bank_details?: {
        bank_name?: string;
        account_holder?: string;
        account_number?: string;
        routing_number?: string;
        branch?: string;
        upi_id?: string;
    } | null;

    // Preferences
    theme_preference: "system" | "dark" | "light";
    pdf_export_dir?: string | null;

    created_at: string;
    updated_at: string;
}

export interface BankDetails {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch: string;
    upiId: string;
}

const DEFAULT_PROFILE: BusinessProfile = {
    id: 'bp-001',
    name: 'InvoiceFlow Labs',
    email: 'hello@invoiceflow.io',
    phone: '+1 (555) 234-5678',
    address: {
        line1: '100 Silicon Way',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94107',
        country: 'United States'
    },
    tax_id: 'US-TAX-892144',
    logo_path: null,
    default_currency: 'INR',
    default_payment_terms: 'Net30',
    theme_preference: 'system',
    pdf_export_dir: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

const DEFAULT_BANK_DETAILS: BankDetails = {
    accountHolder: 'InvoiceFlow Labs',
    accountNumber: '501004589231',
    ifscCode: 'HDFC0001234',
    bankName: 'Commercial Business Bank',
    branch: 'Downtown Branch',
    upiId: 'billing@okhdfcbank'
};

interface SettingsState {
    profile: BusinessProfile | null;
    bankDetails: BankDetails | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchSettings: () => Promise<void>;
    updateSettings: (profile: BusinessProfile) => Promise<void>;
    fetchBankDetails: () => Promise<void>;
    updateBankDetails: (details: BankDetails) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    profile: null,
    bankDetails: null,
    isLoading: true,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null });
        if (isTauri()) {
            try {
                const data = await invoke<BusinessProfile>('get_settings');
                set({ profile: data, isLoading: false });
                return;
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            }
        }
        const saved = localStorage.getItem('invoiceflow_profile');
        set({ profile: saved ? JSON.parse(saved) : DEFAULT_PROFILE, isLoading: false });
    },

    updateSettings: async (profile: BusinessProfile) => {
        set({ isLoading: true, error: null });
        if (isTauri()) {
            try {
                await invoke('save_settings', { profile });
                localStorage.setItem('invoiceflow_profile', JSON.stringify(profile));
                set({ profile, isLoading: false });
                return;
            } catch (error) {
                console.error("Failed to save settings:", error);
                set({ error: String(error), isLoading: false });
                throw error;
            }
        }
        localStorage.setItem('invoiceflow_profile', JSON.stringify(profile));
        set({ profile, isLoading: false });
    },

    fetchBankDetails: async () => {
        if (isTauri()) {
            try {
                const data: string | null = await invoke('get_bank_details');
                if (data) {
                    set({ bankDetails: JSON.parse(data) });
                    return;
                }
            } catch (error) {
                console.error("Failed to fetch bank details:", error);
            }
        }
        const saved = localStorage.getItem('invoiceflow_bank_details');
        let details: BankDetails = saved ? JSON.parse(saved) : DEFAULT_BANK_DETAILS;
        // Dynamically sanitize legacy hardcoded developer name if present in localStorage
        if (details && (details.accountHolder === 'Mohammed Jabir' || details.upiId === 'jabir@upi')) {
            const currentProfile = get().profile;
            details = {
                ...details,
                accountHolder: currentProfile?.name || 'InvoiceFlow Labs',
                upiId: 'billing@okhdfcbank'
            };
            localStorage.setItem('invoiceflow_bank_details', JSON.stringify(details));
        }
        set({ bankDetails: details });
    },

    updateBankDetails: async (details: BankDetails) => {
        if (isTauri()) {
            try {
                await invoke('save_bank_details', { jsonData: JSON.stringify(details) });
                localStorage.setItem('invoiceflow_bank_details', JSON.stringify(details));
                set({ bankDetails: details });
                return;
            } catch (error) {
                console.error("Failed to save bank details:", error);
                throw error;
            }
        }
        localStorage.setItem('invoiceflow_bank_details', JSON.stringify(details));
        set({ bankDetails: details });
    }
}));
