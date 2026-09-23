/**
 * Universal Currency System for InvoiceFlow
 * Supports 50+ ISO 4217 global currencies with exchange rates, localized symbols, and conversion helpers.
 */

export interface CurrencyInfo {
    code: string;
    name: string;
    symbol: string;
    flag: string;
    decimals: number;
    rateVsUsd: number; // Units per 1 USD
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
    // Major International Currencies
    { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸", decimals: 2, rateVsUsd: 1.0 },
    { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺", decimals: 2, rateVsUsd: 0.92 },
    { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧", decimals: 2, rateVsUsd: 0.79 },
    { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳", decimals: 2, rateVsUsd: 83.50 },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵", decimals: 0, rateVsUsd: 155.0 },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦", decimals: 2, rateVsUsd: 1.36 },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺", decimals: 2, rateVsUsd: 1.52 },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭", decimals: 2, rateVsUsd: 0.91 },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳", decimals: 2, rateVsUsd: 7.24 },

    // Middle East & GCC Currencies
    { code: "AED", name: "UAE Dirham", symbol: "AED", flag: "🇦🇪", decimals: 2, rateVsUsd: 3.6725 },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR", flag: "🇸🇦", decimals: 2, rateVsUsd: 3.75 },
    { code: "QAR", name: "Qatari Riyal", symbol: "QAR", flag: "🇶🇦", decimals: 2, rateVsUsd: 3.64 },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD", flag: "🇰🇼", decimals: 3, rateVsUsd: 0.308 },
    { code: "BHD", name: "Bahraini Dinar", symbol: "BHD", flag: "🇧🇭", decimals: 3, rateVsUsd: 0.376 },
    { code: "OMR", name: "Omani Rial", symbol: "OMR", flag: "🇴🇲", decimals: 3, rateVsUsd: 0.385 },
    { code: "JOD", name: "Jordanian Dinar", symbol: "JOD", flag: "🇯🇴", decimals: 3, rateVsUsd: 0.709 },
    { code: "ILS", name: "Israeli Shekel", symbol: "₪", flag: "🇮🇱", decimals: 2, rateVsUsd: 3.72 },
    { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬", decimals: 2, rateVsUsd: 47.80 },
    { code: "MAD", name: "Moroccan Dirham", symbol: "MAD", flag: "🇲🇦", decimals: 2, rateVsUsd: 10.05 },
    { code: "DZD", name: "Algerian Dinar", symbol: "DZD", flag: "🇩🇿", decimals: 2, rateVsUsd: 134.50 },
    { code: "IQD", name: "Iraqi Dinar", symbol: "IQD", flag: "🇮🇶", decimals: 0, rateVsUsd: 1310.0 },

    // Asia-Pacific & South Asia
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬", decimals: 2, rateVsUsd: 1.35 },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰", decimals: 2, rateVsUsd: 7.82 },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿", decimals: 2, rateVsUsd: 1.65 },
    { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷", decimals: 0, rateVsUsd: 1370.0 },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾", decimals: 2, rateVsUsd: 4.75 },
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩", decimals: 0, rateVsUsd: 16100.0 },
    { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭", decimals: 2, rateVsUsd: 36.80 },
    { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭", decimals: 2, rateVsUsd: 57.50 },
    { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳", decimals: 0, rateVsUsd: 25400.0 },
    { code: "PKR", name: "Pakistani Rupee", symbol: "Rs", flag: "🇵🇰", decimals: 2, rateVsUsd: 278.0 },
    { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩", decimals: 2, rateVsUsd: 117.0 },
    { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs", flag: "🇱🇰", decimals: 2, rateVsUsd: 302.0 },
    { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼", decimals: 2, rateVsUsd: 32.40 },

    // Europe (Non-Euro)
    { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪", decimals: 2, rateVsUsd: 10.70 },
    { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴", decimals: 2, rateVsUsd: 10.80 },
    { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰", decimals: 2, rateVsUsd: 6.85 },
    { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱", decimals: 2, rateVsUsd: 4.02 },
    { code: "CZK", name: "Czech Koruna", symbol: "Kč", flag: "🇨🇿", decimals: 2, rateVsUsd: 23.20 },
    { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "🇭🇺", decimals: 0, rateVsUsd: 360.0 },
    { code: "RON", name: "Romanian Leu", symbol: "lei", flag: "🇷🇴", decimals: 2, rateVsUsd: 4.58 },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷", decimals: 2, rateVsUsd: 32.50 },
    { code: "RUB", name: "Russian Ruble", symbol: "₽", flag: "🇷🇺", decimals: 2, rateVsUsd: 91.50 },
    { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", flag: "🇺🇦", decimals: 2, rateVsUsd: 39.60 },

    // Latin America
    { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷", decimals: 2, rateVsUsd: 5.15 },
    { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽", decimals: 2, rateVsUsd: 16.80 },
    { code: "ARS", name: "Argentine Peso", symbol: "$", flag: "🇦🇷", decimals: 2, rateVsUsd: 885.0 },
    { code: "CLP", name: "Chilean Peso", symbol: "$", flag: "🇨🇱", decimals: 0, rateVsUsd: 940.0 },
    { code: "COP", name: "Colombian Peso", symbol: "$", flag: "🇨🇴", decimals: 0, rateVsUsd: 3900.0 },
    { code: "PEN", name: "Peruvian Sol", symbol: "S/", flag: "🇵🇪", decimals: 2, rateVsUsd: 3.73 },

    // Africa
    { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦", decimals: 2, rateVsUsd: 18.50 },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", flag: "🇳🇬", decimals: 2, rateVsUsd: 1420.0 },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh", flag: "🇰🇪", decimals: 2, rateVsUsd: 131.0 },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", flag: "🇬🇭", decimals: 2, rateVsUsd: 13.80 },
];

const CURRENCY_MAP = new Map<string, CurrencyInfo>(
    SUPPORTED_CURRENCIES.map(c => [c.code.toUpperCase(), c])
);

export function getCurrencyInfo(code?: string): CurrencyInfo {
    if (!code) return SUPPORTED_CURRENCIES[0];
    return CURRENCY_MAP.get(code.toUpperCase()) || {
        code: code.toUpperCase(),
        name: code.toUpperCase(),
        symbol: code.toUpperCase(),
        flag: "🌐",
        decimals: 2,
        rateVsUsd: 1.0,
    };
}

/**
 * Convert numerical amount between two currencies using base USD exchange rates
 */
export function convertAmount(
    amount: number | string,
    fromCurrency: string = "USD",
    toCurrency: string = "USD"
): number {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return 0;
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return num;

    const fromInfo = getCurrencyInfo(fromCurrency);
    const toInfo = getCurrencyInfo(toCurrency);

    // Convert from source to USD base, then from USD base to target
    const inUsd = num / (fromInfo.rateVsUsd || 1.0);
    const inTarget = inUsd * (toInfo.rateVsUsd || 1.0);
    return inTarget;
}

/**
 * Format money with live currency conversion and localized symbol/code
 */
export function formatMoney(
    amount: number | string,
    targetCurrency: string = "USD",
    fromCurrency: string = "USD",
    options?: {
        convert?: boolean;
        maximumFractionDigits?: number;
    }
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0.00";

    const shouldConvert = options?.convert !== false;
    const finalAmount = shouldConvert
        ? convertAmount(num, fromCurrency, targetCurrency)
        : num;

    const info = getCurrencyInfo(targetCurrency);
    const decimals = options?.maximumFractionDigits !== undefined
        ? options.maximumFractionDigits
        : info.decimals;

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: info.code,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(finalAmount);
    } catch {
        // Fallback for custom or rare currency codes
        return `${info.symbol} ${finalAmount.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        })}`;
    }
}

/**
 * Format currency without conversion (e.g. format amount already in that currency)
 */
export function formatCurrency(amount: number | string, currencyCode: string = "USD"): string {
    return formatMoney(amount, currencyCode, currencyCode, { convert: false });
}
