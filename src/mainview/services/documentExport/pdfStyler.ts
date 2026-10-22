import type { FontFamily } from "./types";

/**
 * Maps base font family to its standard PDFKit variant font name.
 * If a custom font is specified, returns the custom font name.
 */
export function resolveFontVariant(
	baseFont: FontFamily,
	variant: "regular" | "bold" | "italic" | "boldItalic" = "regular",
	customFontName?: string,
): string {
	if (baseFont === "custom") {
		return customFontName || "CustomFont";
	}

	switch (baseFont) {
		case "Times-Roman":
			if (variant === "bold") return "Times-Bold";
			if (variant === "italic") return "Times-Italic";
			if (variant === "boldItalic") return "Times-BoldItalic";
			return "Times-Roman";

		case "Helvetica":
			if (variant === "bold") return "Helvetica-Bold";
			if (variant === "italic") return "Helvetica-Oblique";
			if (variant === "boldItalic") return "Helvetica-BoldOblique";
			return "Helvetica";

		case "Courier":
			if (variant === "bold") return "Courier-Bold";
			if (variant === "italic") return "Courier-Oblique";
			if (variant === "boldItalic") return "Courier-BoldOblique";
			return "Courier";

		default:
			return customFontName || baseFont;
	}
}

/**
 * Fills the background of the entire current page with the specified color.
 * Implementation: doc.rect(0, 0, doc.page.width, doc.page.height).fill(pageColor)
 */
export function paintPageBackground(doc: any, pageColor: string): void {
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
	doc: any,
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
};
