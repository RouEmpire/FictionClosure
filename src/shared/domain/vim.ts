import type { VimMode } from "@vimee/core";

export type { VimMode };

export type VimIndentStyle = "space" | "tab";

export interface VimSettings {
    enabled: boolean;
    indentStyle: VimIndentStyle;
    indentWidth: number;
}

export const DEFAULT_VIM_SETTINGS: VimSettings = {
    enabled: false,
    indentStyle: "space",
    indentWidth: 2,
};

export const LOCAL_STORAGE_VIM_KEY = "fc_vim_settings";

/**
 * Clamps indent width to a valid integer between 1 and 8.
 */
export function clampIndentWidth(width: number): number {
    if (typeof width !== "number" || Number.isNaN(width)) return 2;
    return Math.max(1, Math.min(8, Math.round(width)));
}

/**
 * Safely loads Vim mode settings from localStorage with fallback to defaults.
 */
export function loadVimSettings(): VimSettings {
    if (typeof localStorage === "undefined") {
        return { ...DEFAULT_VIM_SETTINGS };
    }

    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_VIM_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_VIM_SETTINGS.enabled,
                indentStyle: parsed.indentStyle === "tab" ? "tab" : "space",
                indentWidth: clampIndentWidth(parsed.indentWidth ?? DEFAULT_VIM_SETTINGS.indentWidth),
            };
        }
    } catch {
        // Fall back to defaults on parsing error
    }

    return { ...DEFAULT_VIM_SETTINGS };
}

/**
 * Safely persists Vim mode settings to localStorage.
 */
export function saveVimSettings(settings: VimSettings): void {
    if (typeof localStorage === "undefined") return;

    try {
        localStorage.setItem(
            LOCAL_STORAGE_VIM_KEY,
            JSON.stringify({
                enabled: Boolean(settings.enabled),
                indentStyle: settings.indentStyle === "tab" ? "tab" : "space",
                indentWidth: clampIndentWidth(settings.indentWidth),
            }),
        );
    } catch {
        // Silently ignore storage quota or permission restrictions
    }
}

/**
 * Returns a human-friendly uppercase label for a given VimMode.
 */
export function formatVimModeLabel(mode: VimMode): string {
    switch (mode) {
        case "normal":
            return "NORMAL";
        case "insert":
            return "INSERT";
        case "visual":
            return "VISUAL";
        case "visual-line":
            return "V-LINE";
        case "visual-block":
            return "V-BLOCK";
        case "command-line":
            return "COMMAND";
        default:
            return String(mode).toUpperCase();
    }
}
