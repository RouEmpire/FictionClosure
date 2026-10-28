import { describe, expect, it, beforeEach } from "bun:test";
import {
    DEFAULT_AUTO_SAVE_SETTINGS,
    LOCAL_STORAGE_AUTO_SAVE_KEY,
    clampTimeInterval,
    getTimeIntervalMs,
    clampEnterStrokeCount,
    clampCharacterCountThreshold,
    loadAutoSaveSettings,
    saveAutoSaveSettings,
    type AutoSaveSettings,
} from "../src/shared/domain/autoSave";

describe("Auto-Save Domain Model & Settings Persistence", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        mockStorage = {};
        globalThis.localStorage = {
            getItem: (key: string) => mockStorage[key] ?? null,
            setItem: (key: string, value: string) => {
                mockStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete mockStorage[key];
            },
            clear: () => {
                mockStorage = {};
            },
            key: () => null,
            length: 0,
        };
    });

    it("has valid default settings", () => {
        expect(DEFAULT_AUTO_SAVE_SETTINGS.enabled).toBe(true);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.byTime).toBe(true);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.timeIntervalValue).toBe(30);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.timeUnit).toBe("seconds");
        expect(DEFAULT_AUTO_SAVE_SETTINGS.byEnterStroke).toBe(false);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.enterStrokeCount).toBe(1);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.byCharacterCount).toBe(false);
        expect(DEFAULT_AUTO_SAVE_SETTINGS.characterCountThreshold).toBe(100);
    });

    it("clamps time interval correctly for seconds and minutes", () => {
        expect(clampTimeInterval(1, "seconds")).toBe(5); // minimum 5s
        expect(clampTimeInterval(45, "seconds")).toBe(45);
        expect(clampTimeInterval(5000, "seconds")).toBe(3600); // maximum 3600s
        expect(clampTimeInterval(NaN, "seconds")).toBe(30);

        expect(clampTimeInterval(0, "minutes")).toBe(1); // minimum 1m
        expect(clampTimeInterval(5, "minutes")).toBe(5);
        expect(clampTimeInterval(200, "minutes")).toBe(120); // maximum 120m
        expect(clampTimeInterval(NaN, "minutes")).toBe(1);
    });

    it("calculates time interval in milliseconds correctly", () => {
        expect(getTimeIntervalMs(30, "seconds")).toBe(30000);
        expect(getTimeIntervalMs(5, "seconds")).toBe(5000);
        expect(getTimeIntervalMs(2, "minutes")).toBe(120000);
        expect(getTimeIntervalMs(1, "minutes")).toBe(60000);
    });

    it("clamps enter stroke counts safely", () => {
        expect(clampEnterStrokeCount(0)).toBe(1);
        expect(clampEnterStrokeCount(1)).toBe(1);
        expect(clampEnterStrokeCount(5)).toBe(5);
        expect(clampEnterStrokeCount(100)).toBe(50);
        expect(clampEnterStrokeCount(NaN)).toBe(1);
    });

    it("clamps character count thresholds safely", () => {
        expect(clampCharacterCountThreshold(2)).toBe(5);
        expect(clampCharacterCountThreshold(150)).toBe(150);
        expect(clampCharacterCountThreshold(10000)).toBe(5000);
        expect(clampCharacterCountThreshold(NaN)).toBe(100);
    });

    it("loads default settings when localStorage is empty", () => {
        const loaded = loadAutoSaveSettings();
        expect(loaded).toEqual(DEFAULT_AUTO_SAVE_SETTINGS);
    });

    it("saves and reloads custom Auto-Save settings", () => {
        const custom: AutoSaveSettings = {
            enabled: true,
            byTime: true,
            timeIntervalValue: 2,
            timeUnit: "minutes",
            byEnterStroke: true,
            enterStrokeCount: 3,
            byCharacterCount: true,
            characterCountThreshold: 250,
        };

        saveAutoSaveSettings(custom);
        const reloaded = loadAutoSaveSettings();
        expect(reloaded).toEqual(custom);
    });

    it("gracefully falls back on malformed or corrupted localStorage data", () => {
        mockStorage[LOCAL_STORAGE_AUTO_SAVE_KEY] = "{ corrupted json !!";
        const reloaded = loadAutoSaveSettings();
        expect(reloaded).toEqual(DEFAULT_AUTO_SAVE_SETTINGS);
    });

    it("sanitizes partial or out-of-range values on load", () => {
        mockStorage[LOCAL_STORAGE_AUTO_SAVE_KEY] = JSON.stringify({
            enabled: false,
            byTime: false,
            timeIntervalValue: 99999,
            timeUnit: "seconds",
            byEnterStroke: "invalid-boolean",
            enterStrokeCount: -10,
            byCharacterCount: true,
            characterCountThreshold: 999999,
        });

        const reloaded = loadAutoSaveSettings();
        expect(reloaded.enabled).toBe(false);
        expect(reloaded.byTime).toBe(false);
        expect(reloaded.timeIntervalValue).toBe(3600); // clamped to 3600s
        expect(reloaded.enterStrokeCount).toBe(1); // clamped to 1
        expect(reloaded.characterCountThreshold).toBe(5000); // clamped to 5000
    });
});
