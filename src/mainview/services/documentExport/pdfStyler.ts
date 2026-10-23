/**
 * FictionClosure — PDF Styling, Typography & Pagination (Pure Functional & SOLID).
 *
 * Responsibilities:
 * - Structural PdfStylingCanvas interface (eliminates 'any' types)
 * - Page background painting & header page numbering calculations
 * - Font variant resolution and typography constants
 */

import { findBundledFont } from "@shared/domain/bundledFonts";
import type { FontFamily } from "./types";

// ============================================================================
// 1. Structural Canvas Interface (Zero 'any' / ISP)
// ============================================================================

export interface PdfStylingCanvas {
	page: { width: number; height: number };
	save(): void;
	restore(): void;
	rect(
		x: number,
		y: number,
		w: number,
		h: number,
	): { fill(color: string): unknown };
	font(name: string): PdfStylingCanvas;
	fontSize(size: number): PdfStylingCanvas;
	fillColor(color: string): PdfStylingCanvas;
	text(
		text: string,
		x: number,
		y: number,
		options?: { align?: string; width?: number },
	): unknown;
	switchToPage(index: number): void;
	bufferedPageRange(): { start: number; count: number };
}

export type FontVariant = "regular" | "bold" | "italic" | "boldItalic";

const STANDARD_FONT_VARIANTS: Record<
	string,
	Record<FontVariant, string>
> = {
	"Times-Roman": {
		regular: "Times-Roman",
		bold: "Times-Bold",
		italic: "Times-Italic",
		boldItalic: "Times-BoldItalic",
	},
	Helvetica: {
		regular: "Helvetica",
		bold: "Helvetica-Bold",
		italic: "Helvetica-Oblique",
		boldItalic: "Helvetica-BoldOblique",
	},
	Courier: {
		regular: "Courier",
		bold: "Courier-Bold",
		italic: "Courier-Oblique",
		boldItalic: "Courier-BoldOblique",
	},
};

// ============================================================================
// 2. Pure Styling & Resolution Functions
// ============================================================================

/**
 * Maps base font family to its standard PDFKit variant font name.
 * If a custom font or bundled font is specified, returns the registered font name.
 */
export function resolveFontVariant(
	baseFont: FontFamily,
	variant: FontVariant = "regular",
	customFontName?: string,
): string {
	if (baseFont === "custom") {
		return customFontName || "CustomFont";
	}

	const bundled = findBundledFont(baseFont);
	if (bundled) {
		return bundled.name;
	}

	const familyMap = STANDARD_FONT_VARIANTS[baseFont];
	if (familyMap) {
		return familyMap[variant] || familyMap.regular;
	}

	return customFontName || baseFont;
}

/**
 * Fills the background of the entire current page with the specified color.
 */
export function paintPageBackground(
	doc: PdfStylingCanvas,
	pageColor: string,
): void {
	if (!doc || !doc.page) return;
	doc.save();
	doc.rect(0, 0, doc.page.width, doc.page.height).fill(pageColor);
	doc.restore();
}

/**
 * Applies header page numbers formatted as `<pageNumber>/<totalPageNumber>`
 * at the top of every buffered page in the document.
 */
export function applyPageNumbers(
	doc: PdfStylingCanvas,
	options: {
		textColor: string;
		fontFamily: FontFamily;
		customFontName?: string;
		startFromPage?: number;
		marginTop?: number;
	},
): void {
	if (!doc || typeof doc.bufferedPageRange !== "function") return;

	const range = doc.bufferedPageRange();
	const totalPages = range.count;
	const startIdx = options.startFromPage ?? 0;
	const fontName = resolveFontVariant(
		options.fontFamily,
		"regular",
		options.customFontName,
	);
	const yPos = options.marginTop ?? 22;

	for (let i = range.start + startIdx; i < range.start + totalPages; i++) {
		doc.switchToPage(i);
		doc.save();
		doc.font(fontName);
		doc.fontSize(9);
		doc.fillColor(options.textColor);

		const pageStr = `${i + 1}/${totalPages}`;
		doc.text(pageStr, 0, yPos, {
			align: "center",
			width: doc.page.width,
		});

		doc.restore();
	}
}

/**
 * Typography metrics tailored for book & manuscript output.
 */
export const TYPOGRAPHY_METRICS = {
	titleSize: 24,
	subtitleSize: 13,
	metaSize: 10,
	h1Size: 18,
	h2Size: 14,
	h3Size: 12,
	bodySize: 11,
	blockquoteSize: 10,
	dividerSize: 14,
	bodyLineGap: 4,
	blockquoteIndent: 20,
	paragraphBottomSpacing: 6,
} as const;
