import { describe, expect, it, beforeEach } from "bun:test";
import {
	DEFAULT_TYPOGRAPHY_SETTINGS,
	LOCAL_STORAGE_LEGACY_FONT_KEY,
	LOCAL_STORAGE_TYPOGRAPHY_KEY,
	clampFirstLineIndent,
	clampFontSize,
	clampFontWeight,
	computeLineHeight,
	formatFontFeatureSettings,
	formatTextAutospace,
	loadTypographySettings,
	saveTypographySettings,
	type EditorTypographySettings,
} from "../src/shared/domain/typography";

// Mock localStorage for headless tests
const localStorageStore = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
	getItem: (key: string) => localStorageStore.get(key) ?? null,
	setItem: (key: string, value: string) => localStorageStore.set(key, value),
	removeItem: (key: string) => localStorageStore.delete(key),
	clear: () => localStorageStore.clear(),
	key: () => null,
	length: 0,
};

describe("Typography Domain Model & Utilities", () => {
	beforeEach(() => {
		localStorageStore.clear();
	});

	it("provides valid and expected default typography settings", () => {
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.fontSize).toBe(15);
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.fontWeight).toBe(400);
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.hideMouseOnTyping).toBe(true);
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.textRendering).toBe("auto");
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.firstLineIndent).toBe(0.0);
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.textJustify).toBe("auto");
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.textAutospace).toBe("normal");
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.fontFeatures).toContain("calt");
		expect(DEFAULT_TYPOGRAPHY_SETTINGS.fontFeatures).toContain("liga");
	});

	it("computes proportional line height based on font size", () => {
		expect(computeLineHeight(15)).toBe(26);
		expect(computeLineHeight(16)).toBe(28);
		expect(computeLineHeight(18)).toBe(31);
		expect(computeLineHeight(20)).toBe(35);
		expect(computeLineHeight(24)).toBe(42);
		// Clamping protection
		expect(computeLineHeight(5)).toBe(17); // clamped to min 10px
	});

	it("clamps first line indent strictly between 0.0% and 10.0%", () => {
		expect(clampFirstLineIndent(0)).toBe(0);
		expect(clampFirstLineIndent(2.5)).toBe(2.5);
		expect(clampFirstLineIndent(10.0)).toBe(10);
		expect(clampFirstLineIndent(-3.5)).toBe(0);
		expect(clampFirstLineIndent(15.8)).toBe(10);
		expect(clampFirstLineIndent(NaN)).toBe(0);
	});

	it("clamps font size between 12px and 36px", () => {
		expect(clampFontSize(15)).toBe(15);
		expect(clampFontSize(8)).toBe(12);
		expect(clampFontSize(45)).toBe(36);
		expect(clampFontSize(18.4)).toBe(18);
		expect(clampFontSize(NaN)).toBe(15);
	});

	it("clamps font weight to valid CSS 100-multiples between 100 and 900", () => {
		expect(clampFontWeight(400)).toBe(400);
		expect(clampFontWeight(700)).toBe(700);
		expect(clampFontWeight(420)).toBe(400);
		expect(clampFontWeight(580)).toBe(600);
		expect(clampFontWeight(50)).toBe(100);
		expect(clampFontWeight(1200)).toBe(900);
		expect(clampFontWeight(NaN)).toBe(400);
	});

	it("formats font-feature-settings from custom list and raw string", () => {
		expect(formatFontFeatureSettings([])).toBe("normal");
		expect(formatFontFeatureSettings(["calt", "liga"])).toBe('"calt" 1, "liga" 1');
		expect(formatFontFeatureSettings(["zero", "onum", "ss01"])).toBe('"zero" 1, "onum" 1, "ss01" 1');
		
		// Deduplicates tags and sanitizes
		expect(formatFontFeatureSettings(["liga", "liga", "calt"])).toBe('"liga" 1, "calt" 1');
		
		// Combines with custom raw text
		expect(
			formatFontFeatureSettings(["liga"], '"cv01" 2, "swsh" 1'),
		).toBe('"liga" 1, "cv01" 2, "swsh" 1');
	});

	it("formats Asian Autospace (text-autospace) values correctly", () => {
		expect(formatTextAutospace("normal")).toBe("normal");
		expect(formatTextAutospace("no-autospace")).toBe("no-autospace");
		expect(formatTextAutospace("ideograph-alpha")).toBe("ideograph-alpha");
		expect(formatTextAutospace("ideograph-numeric")).toBe("ideograph-numeric");
		expect(formatTextAutospace("punctuation")).toBe("punctuation");
		expect(formatTextAutospace("insert")).toBe("insert");
		expect(formatTextAutospace("replace")).toBe("replace");

		// CUSTOM mode
		expect(formatTextAutospace("CUSTOM", "ideograph-alpha ideograph-numeric")).toBe(
			"ideograph-alpha ideograph-numeric",
		);
		expect(formatTextAutospace("CUSTOM", "")).toBe("normal");
	});

	it("loads and saves settings with localStorage persistence", () => {
		const customSettings: EditorTypographySettings = {
			fontFamily: "'Fira Code', monospace",
			fontSize: 18,
			fontWeight: 500,
			fontFeatures: ["calt", "zero"],
			customFontFeaturesText: "",
			hideMouseOnTyping: false,
			textRendering: "optimizeLegibility",
			firstLineIndent: 3.5,
			textJustify: "inter-word",
			textAutospace: "ideograph-alpha",
			customTextAutospace: "",
		};

		saveTypographySettings(customSettings);

		const loaded = loadTypographySettings();
		expect(loaded.fontFamily).toBe("'Fira Code', monospace");
		expect(loaded.fontSize).toBe(18);
		expect(loaded.fontWeight).toBe(500);
		expect(loaded.fontFeatures).toEqual(["calt", "zero"]);
		expect(loaded.hideMouseOnTyping).toBe(false);
		expect(loaded.textRendering).toBe("optimizeLegibility");
		expect(loaded.firstLineIndent).toBe(3.5);
		expect(loaded.textJustify).toBe("inter-word");
		expect(loaded.textAutospace).toBe("ideograph-alpha");

		// Also verifies legacy font key was synced
		expect(localStorage.getItem(LOCAL_STORAGE_LEGACY_FONT_KEY)).toBe("'Fira Code', monospace");
	});

	it("falls back gracefully to legacy font key if new settings not yet stored", () => {
		localStorage.setItem(LOCAL_STORAGE_LEGACY_FONT_KEY, "Georgia, serif");

		const loaded = loadTypographySettings();
		expect(loaded.fontFamily).toBe("Georgia, serif");
		expect(loaded.fontSize).toBe(DEFAULT_TYPOGRAPHY_SETTINGS.fontSize);
		expect(loaded.hideMouseOnTyping).toBe(true);
	});
});
