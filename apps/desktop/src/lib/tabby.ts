/**
 * Tabby BNPL In-App Service & Promotional Badge Utilities
 */

export interface TabbyInstallmentPlan {
    total: number;
    currency: string;
    perMonth: number;
    schedule: {
        date: string;
        amount: number;
        label: string;
    }[];
}

export function formatCurrencyAmount(amount: number, currency: string = "AED"): string {
    const symbolMap: Record<string, string> = {
        AED: "AED",
        SAR: "SAR",
        USD: "$",
        EUR: "€",
        GBP: "£",
        INR: "₹",
        KWD: "KWD",
        BHD: "BHD",
    };
    const sym = symbolMap[currency] || currency;
    return `${sym} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getTabbyInstallments(total: number, currency: string = "AED"): TabbyInstallmentPlan {
    const perMonth = Math.round((total / 4) * 100) / 100;
    const now = new Date();

    const schedule = [
        {
            date: "Today",
            amount: perMonth,
            label: "1st payment upon checkout"
        },
        {
            date: new Date(now.getTime() + 30 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount: perMonth,
            label: "2nd payment (1 month)"
        },
        {
            date: new Date(now.getTime() + 60 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount: perMonth,
            label: "3rd payment (2 months)"
        },
        {
            date: new Date(now.getTime() + 90 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            amount: perMonth,
            label: "4th payment (3 months)"
        }
    ];

    return {
        total,
        currency,
        perMonth,
        schedule
    };
}

export interface CreateTabbyCheckoutParams {
    invoiceId: string;
    amount: number;
    currency: string;
    buyerName: string;
    buyerEmail?: string;
    buyerPhone?: string;
}

export async function createTabbySession(params: CreateTabbyCheckoutParams): Promise<{
    sessionId: string;
    webUrl: string;
    installments: TabbyInstallmentPlan;
}> {
    const installments = getTabbyInstallments(params.amount, params.currency);
    const sessionId = "tabby_" + Math.random().toString(36).substring(2, 9);
    const webUrl = `https://checkout.tabby.ai/#/checkout/${sessionId}?amount=${params.amount}&currency=${params.currency}`;

    return {
        sessionId,
        webUrl,
        installments
    };
}
