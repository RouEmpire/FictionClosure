/**
 * FictionClosure — Editor & Typography Domain Model & Utilities
 *
 * Implements typography settings configuration, formatting, OpenType feature lists,
 * and text styling utilities based on W3C CSS Text & Fonts specifications and MDN standards.
 */

export type TextRenderingMode = "auto" | "optimizeSpeed" | "optimizeLegibility" | "geometricPrecision";
export type TextJustifyMode = "auto" | "distribute" | "inter-word" | "inter-character";
export type TextAutospaceMode =
	| "normal"
	| "no-autospace"
	| "ideograph-alpha"
	| "ideograph-numeric"
	| "punctuation"
	| "insert"
	| "replace"
	| "CUSTOM";

export interface FontFeatureTag {
	tag: string;
	label: string;
	description: string;
	enabled: boolean;
	isCustom?: boolean;
}

export interface EditorTypographySettings {
	fontFamily: string;
	fontSize: number; // in pixels (e.g. 15, range 12 - 36)
	fontWeight: number; // 100 - 900 (default 400)
	fontFeatures: string[]; // List of active 4-character OpenType feature tags (e.g. ["calt", "liga"])
	customFontFeaturesText: string; // Optional raw custom CSS font-feature-settings string
	hideMouseOnTyping: boolean; // True/False cursor hiding while typing
	textRendering: TextRenderingMode; // auto, optimizeSpeed, optimizeLegibility, geometricPrecision
	firstLineIndent: number; // Percentage slider from 0.0% to 10.0%
	textJustify: TextJustifyMode; // auto, distribute, inter-word, inter-character
	textAutospace: TextAutospaceMode; // Asian Autospace mode
	customTextAutospace: string; // Custom string when textAutospace === "CUSTOM"
}

export const KNOWN_FONT_FEATURES: Omit<FontFeatureTag, "enabled">[] = [
	{ tag: "liga", label: "Standard Ligatures", description: "Common ligatures like fi, fl, ffi" },
	{ tag: "calt", label: "Contextual Alternates", description: "Context-sensitive glyph variations & code arrows" },
	{ tag: "dlig", label: "Discretionary Ligatures", description: "Decorative and stylistic character joins" },
	{ tag: "ss01", label: "Stylistic Set 1", description: "First alternative glyph design set" },
	{ tag: "ss02", label: "Stylistic Set 2", description: "Second alternative glyph design set" },
	{ tag: "zero", label: "Slashed Zero", description: "Distinguishes digit 0 from uppercase O" },
	{ tag: "onum", label: "Oldstyle Figures", description: "Numbers with varying ascenders and descenders" },
	{ tag: "tnum", label: "Tabular Numbers", description: "Equal-width numerals for column alignment" },
	{ tag: "smcp", label: "Small Capitals", description: "Small caps for lowercase letters" },
	{ tag: "frac", label: "Fractions", description: "Constructs typographic diagonal fractions (1/2, 3/4)" },
];

export const DEFAULT_TYPOGRAPHY_SETTINGS: EditorTypographySettings = {
	fontFamily: "",
	fontSize: 15,
	fontWeight: 400,
	fontFeatures: ["calt", "liga"],
	customFontFeaturesText: "",
	hideMouseOnTyping: true,
	textRendering: "auto",
	firstLineIndent: 0.0,
	textJustify: "auto",
	textAutospace: "normal",
	customTextAutospace: "",
};

export const LOCAL_STORAGE_TYPOGRAPHY_KEY = "fictionclosure_typography_settings";
export const LOCAL_STORAGE_LEGACY_FONT_KEY = "fictionclosure_editor_font";

/**
 * Computes proportional line height for editor typography.
 * Defaults to approximately 1.733 ratio (e.g. 15px -> 26px, 16px -> 28px).
 */
export function computeLineHeight(fontSize: number): number {
	const validSize = Math.max(10, Math.min(48, fontSize || 15));
	return Math.round(validSize * 1.7333);
}

/**
 * Formats CSS `font-feature-settings` string from active tag list and custom string.
 */
export function formatFontFeatureSettings(
	features: string[],
	customText: string = "",
): string {
	const parts: string[] = [];
	const seen = new Set<string>();

	for (const tag of features) {
		const cleanTag = tag.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 4);
		if (cleanTag.length >= 2 && !seen.has(cleanTag)) {
			seen.add(cleanTag);
			parts.push(`"${cleanTag}" 1`);
		}
	}

	if (customText.trim()) {
		// Clean and append custom expressions
		parts.push(customText.trim());
	}

	return parts.length > 0 ? parts.join(", ") : "normal";
}

/**
 * Formats CSS `text-autospace` (Asian Autospace) property value.
 */
export function formatTextAutospace(
	mode: TextAutospaceMode,
	customValue: string = "",
): string {
	if (mode === "CUSTOM") {
		return customValue.trim() || "normal";
	}
	return mode;
}

/**
 * Validates and clamps a first line indent value between 0.0% and 10.0%.
 */
export function clampFirstLineIndent(val: number): number {
	if (typeof val !== "number" || isNaN(val)) return 0.0;
	return Math.max(0.0, Math.min(10.0, Math.round(val * 10) / 10));
}

/**
 * Validates and clamps font size between 12px and 36px.
 */
export function clampFontSize(size: number): number {
	if (typeof size !== "number" || isNaN(size)) return 15;
	return Math.max(12, Math.min(36, Math.round(size)));
}

/**
 * Validates font weight to valid CSS font-weight multiples of 100 between 100 and 900.
 */
export function clampFontWeight(weight: number): number {
	if (typeof weight !== "number" || isNaN(weight)) return 400;
	const rounded = Math.round(weight / 100) * 100;
	return Math.max(100, Math.min(900, rounded));
}

/**
 * Safely loads typography settings from localStorage with migration and legacy fallback.
 */
export function loadTypographySettings(): EditorTypographySettings {
	if (typeof localStorage === "undefined") {
		return { ...DEFAULT_TYPOGRAPHY_SETTINGS };
	}

	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_TYPOGRAPHY_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return {
				fontFamily: typeof parsed.fontFamily === "string" ? parsed.fontFamily : DEFAULT_TYPOGRAPHY_SETTINGS.fontFamily,
				fontSize: clampFontSize(parsed.fontSize ?? DEFAULT_TYPOGRAPHY_SETTINGS.fontSize),
				fontWeight: clampFontWeight(parsed.fontWeight ?? DEFAULT_TYPOGRAPHY_SETTINGS.fontWeight),
				fontFeatures: Array.isArray(parsed.fontFeatures)
					? parsed.fontFeatures.map(String)
					: [...DEFAULT_TYPOGRAPHY_SETTINGS.fontFeatures],
				customFontFeaturesText: typeof parsed.customFontFeaturesText === "string" ? parsed.customFontFeaturesText : "",
				hideMouseOnTyping: typeof parsed.hideMouseOnTyping === "boolean" ? parsed.hideMouseOnTyping : true,
				textRendering: ["auto", "optimizeSpeed", "optimizeLegibility", "geometricPrecision"].includes(parsed.textRendering)
					? parsed.textRendering
					: DEFAULT_TYPOGRAPHY_SETTINGS.textRendering,
				firstLineIndent: clampFirstLineIndent(parsed.firstLineIndent ?? DEFAULT_TYPOGRAPHY_SETTINGS.firstLineIndent),
				textJustify: ["auto", "distribute", "inter-word", "inter-character"].includes(parsed.textJustify)
					? parsed.textJustify
					: DEFAULT_TYPOGRAPHY_SETTINGS.textJustify,
				textAutospace: [
					"normal",
					"no-autospace",
					"ideograph-alpha",
					"ideograph-numeric",
					"punctuation",
					"insert",
					"replace",
					"CUSTOM",
				].includes(parsed.textAutospace)
					? parsed.textAutospace
					: DEFAULT_TYPOGRAPHY_SETTINGS.textAutospace,
				customTextAutospace: typeof parsed.customTextAutospace === "string" ? parsed.customTextAutospace : "",
			};
		}

		// Fallback to legacy single font setting if present
		const legacyFont = localStorage.getItem(LOCAL_STORAGE_LEGACY_FONT_KEY);
		if (legacyFont) {
			return {
				...DEFAULT_TYPOGRAPHY_SETTINGS,
				fontFamily: legacyFont,
			};
		}
	} catch (err) {
		console.warn("Could not load typography settings from storage, using defaults:", err);
	}

	return { ...DEFAULT_TYPOGRAPHY_SETTINGS };
}

/**
 * Persists typography settings to localStorage and syncs legacy font key.
 */
export function saveTypographySettings(settings: EditorTypographySettings): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(LOCAL_STORAGE_TYPOGRAPHY_KEY, JSON.stringify(settings));
		localStorage.setItem(LOCAL_STORAGE_LEGACY_FONT_KEY, settings.fontFamily);
	} catch (err) {
		console.warn("Could not save typography settings to localStorage:", err);
	}
}
