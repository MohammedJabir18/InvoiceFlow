import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

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
    address: Address;
    tax_id?: string | null;
    logo_path?: string | null;
    default_currency: string;
    default_payment_terms: string;
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

export const useSettingsStore = create<SettingsState>((set) => ({
    profile: null,
    bankDetails: null,
    isLoading: true,
    error: null,

    fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await invoke<BusinessProfile>('get_settings');
            set({ profile: data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch settings:", error);
            set({ error: String(error), isLoading: false });
        }
    },

    updateSettings: async (profile: BusinessProfile) => {
        set({ isLoading: true, error: null });
        try {
            await invoke('save_settings', { profile });
            set({ profile, isLoading: false });
        } catch (error) {
            console.error("Failed to save settings:", error);
            set({ error: String(error), isLoading: false });
        }
    },

    fetchBankDetails: async () => {
        try {
            const data: string | null = await invoke('get_bank_details');
            if (data) {
                set({ bankDetails: JSON.parse(data) });
            }
        } catch (error) {
            console.error("Failed to fetch bank details:", error);
        }
    },

    updateBankDetails: async (details: BankDetails) => {
        try {
            await invoke('save_bank_details', { jsonData: JSON.stringify(details) });
            set({ bankDetails: details });
        } catch (error) {
            console.error("Failed to save bank details:", error);
        }
    }
}));
