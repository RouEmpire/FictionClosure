export type AutoSaveTimeUnit = "seconds" | "minutes";

export interface AutoSaveSettings {
    enabled: boolean;
    byTime: boolean;
    timeIntervalValue: number;
    timeUnit: AutoSaveTimeUnit;
    byEnterStroke: boolean;
    enterStrokeCount: number;
    byCharacterCount: boolean;
    characterCountThreshold: number;
}

export const DEFAULT_AUTO_SAVE_SETTINGS: AutoSaveSettings = {
    enabled: true,
    byTime: true,
    timeIntervalValue: 30,
    timeUnit: "seconds",
    byEnterStroke: false,
    enterStrokeCount: 1,
    byCharacterCount: false,
    characterCountThreshold: 100,
};

export const LOCAL_STORAGE_AUTO_SAVE_KEY = "fc_auto_save_settings";

/**
 * Clamps the time interval value to safe bounds depending on the chosen unit.
 * Seconds: 5s to 3600s (default 30).
 * Minutes: 1m to 120m (default 1).
 */
export function clampTimeInterval(value: number, unit: AutoSaveTimeUnit): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
        return unit === "minutes" ? 1 : 30;
    }
    const rounded = Math.round(value);
    if (unit === "minutes") {
        return Math.max(1, Math.min(120, rounded));
    }
    return Math.max(5, Math.min(3600, rounded));
}

/**
 * Returns the effective time interval in milliseconds.
 */
export function getTimeIntervalMs(value: number, unit: AutoSaveTimeUnit): number {
    const clamped = clampTimeInterval(value, unit);
    return unit === "minutes" ? clamped * 60 * 1000 : clamped * 1000;
}

/**
 * Clamps the enter stroke count between 1 and 50 (default 1).
 */
export function clampEnterStrokeCount(count: number): number {
    if (typeof count !== "number" || Number.isNaN(count)) return 1;
    return Math.max(1, Math.min(50, Math.round(count)));
}

/**
 * Clamps the character count threshold between 5 and 5000 (default 100).
 */
export function clampCharacterCountThreshold(count: number): number {
    if (typeof count !== "number" || Number.isNaN(count)) return 100;
    return Math.max(5, Math.min(5000, Math.round(count)));
}

/**
 * Safely loads Auto-Save settings from localStorage with fallback to defaults.
 */
export function loadAutoSaveSettings(): AutoSaveSettings {
    if (typeof localStorage === "undefined") {
        return { ...DEFAULT_AUTO_SAVE_SETTINGS };
    }

    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_AUTO_SAVE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const timeUnit: AutoSaveTimeUnit = parsed.timeUnit === "minutes" ? "minutes" : "seconds";
            return {
                enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_AUTO_SAVE_SETTINGS.enabled,
                byTime: typeof parsed.byTime === "boolean" ? parsed.byTime : DEFAULT_AUTO_SAVE_SETTINGS.byTime,
                timeIntervalValue: clampTimeInterval(parsed.timeIntervalValue ?? DEFAULT_AUTO_SAVE_SETTINGS.timeIntervalValue, timeUnit),
                timeUnit,
                byEnterStroke: typeof parsed.byEnterStroke === "boolean" ? parsed.byEnterStroke : DEFAULT_AUTO_SAVE_SETTINGS.byEnterStroke,
                enterStrokeCount: clampEnterStrokeCount(parsed.enterStrokeCount ?? DEFAULT_AUTO_SAVE_SETTINGS.enterStrokeCount),
                byCharacterCount: typeof parsed.byCharacterCount === "boolean" ? parsed.byCharacterCount : DEFAULT_AUTO_SAVE_SETTINGS.byCharacterCount,
                characterCountThreshold: clampCharacterCountThreshold(parsed.characterCountThreshold ?? DEFAULT_AUTO_SAVE_SETTINGS.characterCountThreshold),
            };
        }
    } catch {
        // Fall back to defaults on parsing error
    }

    return { ...DEFAULT_AUTO_SAVE_SETTINGS };
}

/**
 * Safely persists Auto-Save settings to localStorage.
 */
export function saveAutoSaveSettings(settings: AutoSaveSettings): void {
    if (typeof localStorage === "undefined") return;

    try {
        const timeUnit: AutoSaveTimeUnit = settings.timeUnit === "minutes" ? "minutes" : "seconds";
        const sanitized: AutoSaveSettings = {
            enabled: Boolean(settings.enabled),
            byTime: Boolean(settings.byTime),
            timeIntervalValue: clampTimeInterval(settings.timeIntervalValue, timeUnit),
            timeUnit,
            byEnterStroke: Boolean(settings.byEnterStroke),
            enterStrokeCount: clampEnterStrokeCount(settings.enterStrokeCount),
            byCharacterCount: Boolean(settings.byCharacterCount),
            characterCountThreshold: clampCharacterCountThreshold(settings.characterCountThreshold),
        };
        localStorage.setItem(LOCAL_STORAGE_AUTO_SAVE_KEY, JSON.stringify(sanitized));
    } catch {
        // Silently ignore storage quota or permission restrictions
    }
}
