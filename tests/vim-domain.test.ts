import { describe, expect, it, beforeEach } from "bun:test";
import {
    DEFAULT_VIM_SETTINGS,
    LOCAL_STORAGE_VIM_KEY,
    clampIndentWidth,
    formatVimModeLabel,
    loadVimSettings,
    saveVimSettings,
    type VimMode,
} from "../src/shared/domain/vim";

describe("Vim Domain Model & Settings Persistence", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        mockStorage = {};
        globalThis.localStorage = {
            getItem: (key: string) => mockStorage[key] ?? null,
            setItem: (key: string, value: string) => {
                mockStorage[key] = String(value);
            },
            removeItem: (key: string) => {
                delete mockStorage[key];
            },
            clear: () => {
                mockStorage = {};
            },
            length: 0,
            key: () => null,
        };
    });

    it("has expected default settings (OFF by default)", () => {
        expect(DEFAULT_VIM_SETTINGS.enabled).toBe(false);
        expect(DEFAULT_VIM_SETTINGS.indentStyle).toBe("space");
        expect(DEFAULT_VIM_SETTINGS.indentWidth).toBe(2);
    });

    it("clamps indent width between 1 and 8", () => {
        expect(clampIndentWidth(2)).toBe(2);
        expect(clampIndentWidth(4)).toBe(4);
        expect(clampIndentWidth(0)).toBe(1);
        expect(clampIndentWidth(-5)).toBe(1);
        expect(clampIndentWidth(99)).toBe(8);
        expect(clampIndentWidth(NaN)).toBe(2);
        expect(clampIndentWidth(3.7)).toBe(4);
    });

    it("loads default settings when localStorage is empty", () => {
        const loaded = loadVimSettings();
        expect(loaded.enabled).toBe(false);
        expect(loaded.indentStyle).toBe("space");
        expect(loaded.indentWidth).toBe(2);
    });

    it("saves and reloads valid Vim settings", () => {
        saveVimSettings({
            enabled: true,
            indentStyle: "tab",
            indentWidth: 4,
        });

        const stored = mockStorage[LOCAL_STORAGE_VIM_KEY];
        expect(stored).toBeDefined();

        const loaded = loadVimSettings();
        expect(loaded.enabled).toBe(true);
        expect(loaded.indentStyle).toBe("tab");
        expect(loaded.indentWidth).toBe(4);
    });

    it("gracefully falls back on malformed or corrupted localStorage data", () => {
        mockStorage[LOCAL_STORAGE_VIM_KEY] = "{ corrupted-json ";
        const loaded = loadVimSettings();
        expect(loaded.enabled).toBe(false);
        expect(loaded.indentStyle).toBe("space");
        expect(loaded.indentWidth).toBe(2);
    });

    it("sanitizes invalid indentStyle values to 'space'", () => {
        mockStorage[LOCAL_STORAGE_VIM_KEY] = JSON.stringify({
            enabled: true,
            indentStyle: "invalid_style",
            indentWidth: 100,
        });

        const loaded = loadVimSettings();
        expect(loaded.enabled).toBe(true);
        expect(loaded.indentStyle).toBe("space");
        expect(loaded.indentWidth).toBe(8);
    });

    it("formats Vim mode labels into standard uppercase display strings", () => {
        expect(formatVimModeLabel("normal")).toBe("NORMAL");
        expect(formatVimModeLabel("insert")).toBe("INSERT");
        expect(formatVimModeLabel("visual")).toBe("VISUAL");
        expect(formatVimModeLabel("visual-line")).toBe("V-LINE");
        expect(formatVimModeLabel("visual-block")).toBe("V-BLOCK");
        expect(formatVimModeLabel("command-line")).toBe("COMMAND");
        expect(formatVimModeLabel("unknown" as unknown as VimMode)).toBe("UNKNOWN");
    });
});
