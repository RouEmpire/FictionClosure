/**
 * FictionClosure — Custom Theme Domain Subsystem.
 *
 * Handles parsing, validation, persistence, and dynamic application of custom
 * Zed/Zen themes imported by the user (e.g. from zen-themes.com).
 */

import {
    slugifyThemeId,
    generateThemeCssRule,
    type BundledThemeEntry,
    type ZedThemeDefinition,
    type ZedThemeAppearance,
    type ZedThemeStyle,
} from "./theme";
import {
    BUNDLED_THEMES,
} from "./bundledThemes";

export interface CustomThemeEntry {
    id: string;
    name: string;
    packageName: string;
    appearance: ZedThemeAppearance;
    theme: ZedThemeDefinition;
    isCustom: true;
    installedAt: string;
}

export type AnyThemeEntry = (BundledThemeEntry & { isCustom?: false }) | CustomThemeEntry;

export interface ThemeColorPalette {
    background: string;
    surface: string;
    border: string;
    accent: string;
    text: string;
}

export const LOCAL_STORAGE_CUSTOM_THEMES_KEY = "fc_custom_themes";
export const LOCAL_STORAGE_ACTIVE_THEME_KEY = "fc_active_theme_id";
export const DEFAULT_THEME_ID = "default";
export const ACTIVE_THEME_STYLE_ID = "fc-active-custom-theme";

/**
 * Extracts a representative 5-color swatch palette from any theme definition.
 */
export function extractThemePalette(theme: ZedThemeDefinition): ThemeColorPalette {
    const s = theme.style;
    const isDark = theme.appearance !== "light";

    const background = (typeof s.background === "string" && s.background.trim()) || (isDark ? "#0d1117" : "#ffffff");
    const surface = (typeof s["surface.background"] === "string" && s["surface.background"].trim()) ||
        (typeof s["elevated_surface.background"] === "string" && s["elevated_surface.background"].trim()) ||
        background;
    const border = (typeof s.border === "string" && s.border.trim()) ||
        (typeof s["border.variant"] === "string" && s["border.variant"].trim()) ||
        (isDark ? "#2b323c" : "#d0d7de");
    const accent = (Array.isArray(s.accents) && typeof s.accents[0] === "string" && s.accents[0].trim()) ||
        (typeof s["text.accent"] === "string" && s["text.accent"].trim()) ||
        (s.syntax && typeof s.syntax === "object" && typeof (s.syntax as Record<string, { color?: string }>).title?.color === "string"
            ? (s.syntax as Record<string, { color?: string }>).title.color!
            : "#e69d45");
    const text = (typeof s.text === "string" && s.text.trim()) || (isDark ? "#f0f3f6" : "#1f2328");

    return { background, surface, border, accent, text };
}

/**
 * Safely parses raw JSON string into one or more CustomThemeEntry records.
 * Supports both multi-theme package files and single theme definition files.
 */
export function parseCustomThemeJson(rawJson: string):
    | { success: true; themes: CustomThemeEntry[]; packageName: string }
    | { success: false; error: string } {
    let parsed: unknown;
    try {
        parsed = JSON.parse(rawJson);
    } catch {
        return { success: false, error: "Malformed JSON file. Please ensure the file is valid JSON." };
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { success: false, error: "Invalid theme JSON structure. Top-level must be an object." };
    }

    const obj = parsed as Record<string, unknown>;
    const packageName = typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "Custom Theme";

    const candidateThemes: ZedThemeDefinition[] = [];

    // Case 1: Standard Zed Theme Package with `themes` array
    if (Array.isArray(obj.themes) && obj.themes.length > 0) {
        for (const item of obj.themes) {
            if (item && typeof item === "object" && typeof item.name === "string" && item.style && typeof item.style === "object") {
                const appearance: ZedThemeAppearance = item.appearance === "light" ? "light" : "dark";
                candidateThemes.push({
                    name: item.name.trim(),
                    appearance,
                    style: item.style as ZedThemeStyle,
                });
            }
        }
    } else if (typeof obj.name === "string" && obj.style && typeof obj.style === "object") {
        // Case 2: Single theme definition
        const appearance: ZedThemeAppearance = obj.appearance === "light" ? "light" : "dark";
        candidateThemes.push({
            name: obj.name.trim(),
            appearance,
            style: obj.style as ZedThemeStyle,
        });
    }

    if (candidateThemes.length === 0) {
        return {
            success: false,
            error: "No valid theme definitions found. A theme must define a 'name' and 'style' object.",
        };
    }

    const now = new Date().toISOString();
    const result: CustomThemeEntry[] = candidateThemes.map((th, index) => {
        const slug = slugifyThemeId(th.name);
        const id = `custom-${slug}${index > 0 ? `-${index + 1}` : ""}`;
        return {
            id,
            name: th.name,
            packageName,
            appearance: th.appearance,
            theme: th,
            isCustom: true,
            installedAt: now,
        };
    });

    return { success: true, themes: result, packageName };
}

/**
 * Loads custom installed themes from localStorage.
 */
export function loadCustomThemes(): CustomThemeEntry[] {
    if (typeof localStorage === "undefined") return [];

    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_CUSTOM_THEMES_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.filter((t): t is CustomThemeEntry =>
                    Boolean(t && t.id && t.name && t.theme && t.theme.style && t.isCustom),
                );
            }
        }
    } catch {
        // Fall back to empty list on corrupt storage
    }
    return [];
}

/**
 * Persists custom installed themes to localStorage.
 */
export function saveCustomThemes(themes: CustomThemeEntry[]): void {
    if (typeof localStorage === "undefined") return;

    try {
        localStorage.setItem(LOCAL_STORAGE_CUSTOM_THEMES_KEY, JSON.stringify(themes));
    } catch {
        // Silently handle quota limits
    }
}

/**
 * Loads the active theme ID from localStorage (defaults to "default").
 */
export function loadActiveThemeId(): string {
    if (typeof localStorage === "undefined") return DEFAULT_THEME_ID;

    try {
        return localStorage.getItem(LOCAL_STORAGE_ACTIVE_THEME_KEY) || DEFAULT_THEME_ID;
    } catch {
        return DEFAULT_THEME_ID;
    }
}

/**
 * Persists active theme ID in localStorage.
 */
export function saveActiveThemeId(id: string): void {
    if (typeof localStorage === "undefined") return;

    try {
        localStorage.setItem(LOCAL_STORAGE_ACTIVE_THEME_KEY, id);
    } catch {
        // Silently ignore storage issues
    }
}

/**
 * Returns all available themes combined: built-in and custom.
 */
export function getAllThemes(customThemes: CustomThemeEntry[] = loadCustomThemes()): AnyThemeEntry[] {
    return [...BUNDLED_THEMES, ...customThemes];
}

/**
 * Applies the selected theme ID to the application DOM root.
 */
export function applyActiveTheme(themeId: string, customThemes: CustomThemeEntry[] = loadCustomThemes()): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    let customStyleEl = document.getElementById(ACTIVE_THEME_STYLE_ID) as HTMLStyleElement | null;

    if (themeId === DEFAULT_THEME_ID || themeId === "default-dark") {
        root.removeAttribute("data-theme");
        customStyleEl?.remove();
        return;
    }

    if (themeId === "default-light") {
        root.setAttribute("data-theme", "light");
        customStyleEl?.remove();
        return;
    }

    // Check built-in themes
    const bundled = BUNDLED_THEMES.find((t) => t.id === themeId);
    if (bundled) {
        root.setAttribute("data-theme", bundled.id);
        customStyleEl?.remove();
        return;
    }

    // Check custom installed themes
    const custom = customThemes.find((t) => t.id === themeId);
    if (custom) {
        root.setAttribute("data-theme", custom.id);
        if (!customStyleEl) {
            customStyleEl = document.createElement("style");
            customStyleEl.id = ACTIVE_THEME_STYLE_ID;
            document.head.appendChild(customStyleEl);
        }
        customStyleEl.textContent = generateThemeCssRule(`[data-theme="${custom.id}"]`, custom.theme);
        return;
    }

    // Fallback if theme ID not found
    root.removeAttribute("data-theme");
    customStyleEl?.remove();
}
