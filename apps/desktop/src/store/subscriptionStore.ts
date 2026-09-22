import { create } from "zustand";

export type SubscriptionTier = "starter" | "pro" | "enterprise";
export type BillingCycle = "monthly" | "annual";

export interface PlanFeature {
    name: string;
    included: boolean;
}

export interface SubscriptionPlan {
    id: SubscriptionTier;
    tier: SubscriptionTier;
    name: string;
    badge?: string;
    monthlyPrice: number;
    annualPrice: number;
    currency: string;
    invoicesLimit: number | "unlimited";
    quotesLimit: number | "unlimited";
    clientsLimit: number | "unlimited";
    hasTabby: boolean;
    hasPaymentLinks: boolean;
    hasMonthlyReports: boolean;
    hasWhiteLabel: boolean;
    description: string;
    features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: "starter",
        tier: "starter",
        name: "Starter Solo",
        monthlyPrice: 19,
        annualPrice: 15,
        currency: "$",
        invoicesLimit: 30,
        quotesLimit: 15,
        clientsLimit: 20,
        hasTabby: false,
        hasPaymentLinks: true,
        hasMonthlyReports: false,
        hasWhiteLabel: false,
        description: "Ideal for freelancers and solo contractors getting started.",
        features: [
            "Up to 30 Invoices / month",
            "Up to 15 Quotations / month",
            "Standard PDF & Print Engine",
            "Mobile Phone & Desktop Access",
            "Client Contact Directory",
            "Email Support"
        ]
    },
    {
        id: "pro",
        tier: "pro",
        name: "Professional Growth",
        badge: "Recommended",
        monthlyPrice: 49,
        annualPrice: 39,
        currency: "$",
        invoicesLimit: "unlimited",
        quotesLimit: "unlimited",
        clientsLimit: "unlimited",
        hasTabby: true,
        hasPaymentLinks: true,
        hasMonthlyReports: true,
        hasWhiteLabel: false,
        description: "Full suite for growing businesses needing Tabby BNPL and advanced reports.",
        features: [
            "Unlimited Invoices & Quotations",
            "Unlimited Clients & Deals",
            "Tabby BNPL 4-Installment Checkout",
            "Shareable Payment Links & Dynamic QR Codes",
            "Monthly Financial Performance Reports",
            "Accountant Statement Print & Export",
            "Multi-Currency (AED, SAR, USD, EUR, INR)",
            "Priority Support & Automatic Updates"
        ]
    },
    {
        id: "enterprise",
        tier: "enterprise",
        name: "Enterprise & Agency",
        badge: "Full Power",
        monthlyPrice: 99,
        annualPrice: 79,
        currency: "$",
        invoicesLimit: "unlimited",
        quotesLimit: "unlimited",
        clientsLimit: "unlimited",
        hasTabby: true,
        hasPaymentLinks: true,
        hasMonthlyReports: true,
        hasWhiteLabel: true,
        description: "White-label solution for agencies, multi-company setups, and custom domains.",
        features: [
            "All Professional Features Included",
            "100% White-Label (Custom Branding & Domain)",
            "Remove all InvoiceFlow watermarks",
            "Multi-Entity / Multiple Businesses",
            "Full Tabby MCP Server Integration",
            "Team Members / Multi-User Roles",
            "Dedicated Account Manager & SLA"
        ]
    }
];

interface SubscriptionState {
    currentPlan: SubscriptionPlan;
    billingCycle: BillingCycle;
    status: "active" | "trial" | "past_due";
    renewalDate: string;
    invoicesCreatedThisMonth: number;
    quotesCreatedThisMonth: number;
    licenseKey: string;
    switchPlan: (tier: SubscriptionTier) => void;
    setBillingCycle: (cycle: BillingCycle) => void;
    incrementInvoiceCount: () => void;
    incrementQuoteCount: () => void;
    activateLicense: (key: string) => boolean;
}

const STORAGE_KEY = "invoiceflow_subscription_state";

export const useSubscriptionStore = create<SubscriptionState>((set, get) => {
    // Load persisted state or default to Pro
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialTier: SubscriptionTier = "pro";
    let initialBilling: BillingCycle = "monthly";
    let initialKey = "IF-PRO-2026-ACTIVE";

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.tier) initialTier = parsed.tier;
            if (parsed.billingCycle) initialBilling = parsed.billingCycle;
            if (parsed.licenseKey) initialKey = parsed.licenseKey;
        } catch {
            // Ignore
        }
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.tier === initialTier) || SUBSCRIPTION_PLANS[1];

    const persist = (tier: SubscriptionTier, cycle: BillingCycle, key: string) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier, billingCycle: cycle, licenseKey: key }));
    };

    return {
        currentPlan: plan,
        billingCycle: initialBilling,
        status: "active",
        renewalDate: "2026-10-31",
        invoicesCreatedThisMonth: 8,
        quotesCreatedThisMonth: 3,
        licenseKey: initialKey,

        switchPlan: (tier) => {
            const newPlan = SUBSCRIPTION_PLANS.find(p => p.tier === tier) || SUBSCRIPTION_PLANS[1];
            set({ currentPlan: newPlan });
            persist(tier, get().billingCycle, get().licenseKey);
        },

        setBillingCycle: (cycle) => {
            set({ billingCycle: cycle });
            persist(get().currentPlan.tier, cycle, get().licenseKey);
        },

        incrementInvoiceCount: () => {
            set(state => ({ invoicesCreatedThisMonth: state.invoicesCreatedThisMonth + 1 }));
        },

        incrementQuoteCount: () => {
            set(state => ({ quotesCreatedThisMonth: state.quotesCreatedThisMonth + 1 }));
        },

        activateLicense: (key) => {
            const cleanKey = key.trim().toUpperCase();
            if (cleanKey.startsWith("IF-")) {
                let tier: SubscriptionTier = "pro";
                if (cleanKey.includes("ENTERPRISE")) tier = "enterprise";
                if (cleanKey.includes("STARTER")) tier = "starter";

                const newPlan = SUBSCRIPTION_PLANS.find(p => p.tier === tier) || SUBSCRIPTION_PLANS[1];
                set({
                    currentPlan: newPlan,
                    status: "active",
                    licenseKey: cleanKey
                });
                persist(tier, get().billingCycle, cleanKey);
                return true;
            }
            return false;
        }
    };
});
