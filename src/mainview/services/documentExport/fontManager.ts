import * as pdfkitModule from "pdfkit";
import PDFDocument from "pdfkit";
import Courier from "pdfkit/standard-fonts/Courier";
import CourierBold from "pdfkit/standard-fonts/CourierBold";
import CourierBoldOblique from "pdfkit/standard-fonts/CourierBoldOblique";
import CourierOblique from "pdfkit/standard-fonts/CourierOblique";
import Helvetica from "pdfkit/standard-fonts/Helvetica";
import HelveticaBold from "pdfkit/standard-fonts/HelveticaBold";
import HelveticaBoldOblique from "pdfkit/standard-fonts/HelveticaBoldOblique";
import HelveticaOblique from "pdfkit/standard-fonts/HelveticaOblique";
import SymbolFont from "pdfkit/standard-fonts/Symbol";
import TimesBold from "pdfkit/standard-fonts/TimesBold";
import TimesBoldItalic from "pdfkit/standard-fonts/TimesBoldItalic";
import TimesItalic from "pdfkit/standard-fonts/TimesItalic";
import TimesRoman from "pdfkit/standard-fonts/TimesRoman";
import ZapfDingbats from "pdfkit/standard-fonts/ZapfDingbats";
import {
	CUSTOM_FONT_FAMILY_OPTION,
	STANDARD_FONT_FAMILY_OPTIONS,
} from "./constants";
import type { CustomFontConfig, FontFamilyOption } from "./types";

/**
 * Tracks whether standard PDF fonts (Helvetica, Times, Courier) are registered and available.
 */
let standardFontsRegistered = false;
let standardFontsAvailable: boolean | null = null;

/**
 * Safely registers PDFKit v0.20+ standard fonts if registerStdFonts is present on the module.
 * Browser builds of PDFKit require registerStdFonts() to be called before standard fonts can be used.
 */
export function ensureStandardFontsRegistered(): boolean {
	if (standardFontsRegistered) {
		return standardFontsAvailable ?? false;
	}

	try {
		const regFn = (
			pdfkitModule as unknown as {
				registerStdFonts?: (...fonts: unknown[]) => void;
			}
		).registerStdFonts;

		if (typeof regFn === "function") {
			regFn(
				Courier,
				CourierBold,
				CourierBoldOblique,
				CourierOblique,
				Helvetica,
				HelveticaBold,
				HelveticaBoldOblique,
				HelveticaOblique,
				SymbolFont,
				TimesBold,
				TimesBoldItalic,
				TimesItalic,
				TimesRoman,
				ZapfDingbats,
			);
		}

		// Verify availability by constructing a minimal headless test document
		const testDoc = new PDFDocument({ autoFirstPage: false });
		testDoc.font("Helvetica");
		standardFontsAvailable = true;
	} catch (err) {
		console.warn("PDF standard fonts could not be registered/loaded:", err);
		standardFontsAvailable = false;
	}

	standardFontsRegistered = true;
	return standardFontsAvailable;
}

/**
 * Checks whether standard fonts are available for use in the current runtime.
 */
export function areStandardFontsAvailable(): boolean {
	if (standardFontsAvailable !== null) {
		return standardFontsAvailable;
	}
	return ensureStandardFontsRegistered();
}

/**
 * Test utility to mock/override standard font availability.
 * Pass null to restore real runtime detection.
 */
export function setStandardFontsAvailableForTesting(
	available: boolean | null,
): void {
	standardFontsAvailable = available;
	if (available === null) {
		standardFontsRegistered = false;
	}
}

/**
 * Returns the list of font family options available to the user.
 * If standard fonts are not installed/available, standard fonts are omitted.
 * Custom font is always offered.
 */
export function getAvailableFontOptions(): FontFamilyOption[] {
	if (areStandardFontsAvailable()) {
		return [...STANDARD_FONT_FAMILY_OPTIONS, CUSTOM_FONT_FAMILY_OPTION];
	}
	// If standard fonts are not available, only offer Custom Font
	return [CUSTOM_FONT_FAMILY_OPTION];
}

/**
 * Derives a clean CSS- and PDFKit-safe font family name from a filename or text.
 */
export function sanitizeFontFamilyName(rawName: string): string {
	const stripped = rawName.replace(/\.[^/.]+$/, "");
	const clean = stripped.replace(/[^a-zA-Z0-9_-]/g, "_").trim();
	return clean || "CustomFont";
}

/**
 * Constructs a CustomFontConfig object from raw byte buffer.
 */
export function createCustomFontFromBytes(
	name: string,
	data: Uint8Array,
	fileName: string = "custom-font.ttf",
): CustomFontConfig {
	const ext = fileName.split(".").pop()?.toLowerCase();
	const format: "ttf" | "otf" | "woff" =
		ext === "otf" ? "otf" : ext === "woff" ? "woff" : "ttf";

	return {
		name: sanitizeFontFamilyName(name),
		data,
		fileName,
		format,
		sizeBytes: data.byteLength,
	};
}

/**
 * Loads a user-uploaded custom font File, validates it, and registers it in browser CSS FontFace.
 */
export async function parseCustomFontFile(file: File): Promise<CustomFontConfig> {
	if (!file) {
		throw new Error("No font file provided.");
	}

	const maxSizeBytes = 25 * 1024 * 1024; // 25 MB safety limit
	if (file.size > maxSizeBytes) {
		throw new Error("Font file exceeds maximum allowable size (25 MB).");
	}

	const fileName = file.name || "font.ttf";
	const ext = fileName.split(".").pop()?.toLowerCase();
	if (ext !== "ttf" && ext !== "otf" && ext !== "woff") {
		throw new Error(
			`Unsupported font format ".${ext}". Please upload a TrueType (.ttf) or OpenType (.otf) font.`,
		);
	}

	const arrayBuffer = await file.arrayBuffer();
	const bytes = new Uint8Array(arrayBuffer);

	if (bytes.byteLength < 16) {
		throw new Error("The selected font file appears to be empty or corrupted.");
	}

	const fontConfig = createCustomFontFromBytes(file.name, bytes, fileName);

	// In browser environments, register with document.fonts so DOM preview displays it immediately
	if (
		typeof window !== "undefined" &&
		typeof window.FontFace === "function" &&
		document.fonts
	) {
		try {
			const fontFace = new FontFace(fontConfig.name, arrayBuffer);
			const loadedFace = await fontFace.load();
			document.fonts.add(loadedFace);
		} catch (err) {
			console.warn("Could not register custom font in browser DOM:", err);
		}
	}

	return fontConfig;
}
