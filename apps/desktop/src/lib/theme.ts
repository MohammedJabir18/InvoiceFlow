export type ThemePreference = 'system' | 'dark' | 'light';
export type EffectiveTheme = 'daylight' | 'midnight';

export const THEME_STORAGE_KEY = 'invoiceflow_theme';
export const THEME_CHANGE_EVENT = 'invoiceflow_theme_changed';

/**
 * Check if the user's operating system currently prefers dark mode.
 */
export function getSystemPrefersDark(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Determine the effective theme ('daylight' or 'midnight') based on saved storage or profile preference.
 */
export function getEffectiveTheme(preference?: string | null): EffectiveTheme {
    if (typeof window === 'undefined') return 'midnight';

    // 1. Explicit preference argument takes priority (e.g. from loaded saved profile)
    let targetPreference = preference;

    // 2. If not provided, check the persistent theme key in localStorage
    if (!targetPreference) {
        targetPreference = localStorage.getItem(THEME_STORAGE_KEY);
    }

    // 3. Fallback to persisted profile in localStorage
    if (!targetPreference) {
        const savedProfile = localStorage.getItem('invoiceflow_profile');
        if (savedProfile) {
            try {
                targetPreference = JSON.parse(savedProfile).theme_preference;
            } catch {}
        }
    }

    if (!targetPreference) {
        targetPreference = 'system';
    }

    if (targetPreference === 'daylight' || targetPreference === 'light') {
        return 'daylight';
    }
    if (targetPreference === 'midnight' || targetPreference === 'dark') {
        return 'midnight';
    }

    // Default or 'system' -> query operating system
    return getSystemPrefersDark() ? 'midnight' : 'daylight';
}

/**
 * Apply the theme to document.documentElement and document.body,
 * and update the meta theme-color tag.
 */
export function applyTheme(effective: EffectiveTheme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const body = document.body;

    if (effective === 'daylight') {
        root.classList.add('daylight');
        body.classList.add('daylight');
    } else {
        root.classList.remove('daylight');
        body.classList.remove('daylight');
    }

    // Synchronize browser titlebar/mobile theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', effective === 'daylight' ? '#f8fafc' : '#0b0f19');
    }
}

/**
 * Resolve and apply the theme, then dispatch a custom event for live subscriber components.
 */
export function applyEffectiveTheme(preference?: string | null): EffectiveTheme {
    const effective = getEffectiveTheme(preference);
    applyTheme(effective);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { effective } }));
    }
    return effective;
}

/**
 * Temporarily preview a theme on the DOM without persisting it to storage.
 * Used by Settings before the user clicks "Save Changes".
 */
export function previewTheme(preference: ThemePreference): EffectiveTheme {
    const effective = preference === 'system'
        ? (getSystemPrefersDark() ? 'midnight' : 'daylight')
        : (preference === 'light' ? 'daylight' : 'midnight');

    applyTheme(effective);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { effective, preview: true } }));
    }
    return effective;
}

/**
 * Permanently commit a theme preference to storage and apply it.
 * Called when "Save Changes" is clicked in Settings, or when Header ThemeToggle is clicked.
 */
export function commitThemePreference(preference: ThemePreference): EffectiveTheme {
    if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
    return applyEffectiveTheme(preference);
}
