import { describe, test, expect } from "bun:test";
import {
	DEFAULT_PDF_EXPORT_OPTIONS,
	EXPORT_FORMAT_OPTIONS,
	FONT_FAMILY_OPTIONS,
	MARGIN_PRESETS,
	PAGE_COLOR_PRESETS,
	PAPER_SIZE_OPTIONS,
	TEXT_ALIGN_OPTIONS,
	TEXT_COLOR_PRESETS,
} from "../src/mainview/services/documentExport/constants";
import {
	cleanInlineMarkdown,
	parseMarkdownBlocks,
	stripFrontmatter,
	stripWikilinks,
} from "../src/mainview/services/documentExport/markdownFormatter";
import {
	applyPageNumbers,
	paintPageBackground,
	resolveFontVariant,
} from "../src/mainview/services/documentExport/pdfStyler";
import {
	createPdfBlob,
	generateDefaultExportFileName,
	uint8ArrayToBase64,
} from "../src/mainview/services/documentExport/exportDownloader";
import {
	areStandardFontsAvailable,
	createCustomFontFromBytes,
	ensureStandardFontsRegistered,
	getAvailableFontOptions,
	sanitizeFontFamilyName,
	setStandardFontsAvailableForTesting,
} from "../src/mainview/services/documentExport/fontManager";
import { renderPdfDocument } from "../src/mainview/services/documentExport/pdfDocumentRenderer";
import {
	exportProjectToPdf,
	validateExportPrerequisites,
} from "../src/mainview/services/documentExport/exportService";
import type { FictionDocument, ProjectInfo } from "../src/shared/types";
import type { PdfExportOptions } from "../src/mainview/services/documentExport/types";

describe("Document Export Service & PDFKit Generator", () => {
	const sampleProject: ProjectInfo = {
		id: "proj-export-test",
		name: "The Obsidian Citadel",
		author: "Elena Rostova",
		genre: "Dark Fantasy",
		targetWordCount: 85000,
		created: new Date().toISOString(),
		lastSaved: new Date().toISOString(),
	};

	const sampleDocs: FictionDocument[] = [
		{
			id: "doc-1",
			title: "Chapter 1: The Gathering Storm",
			type: "manuscript",
			order: 1,
			content: `# Chapter 1\n\n---
author: secret
---
The rain hammered relentlessly against the iron parapets.

> "A city that sleeps in blood shall wake in chains."

She glanced at [[Marcus Vance|Commander Vance]] and drew her blade.

***

In the lower courtyard, shadows shifted silently.`,
			createdAt: 1000,
			updatedAt: 1000,
		},
		{
			id: "doc-2",
			title: "Chapter 2: Shadow in the Spires",
			type: "manuscript",
			order: 2,
			content: `Under the flickering lanterns, the scouts whispered.\n\n- Torchbearers advance first\n- Archers hold the eastern gate\n\nVictory was still possible.`,
			createdAt: 2000,
			updatedAt: 2000,
		},
		{
			id: "doc-char-1",
			title: "Elena Sheet",
			type: "character",
			content: "Protagonist details...",
			createdAt: 3000,
			updatedAt: 3000,
		},
	];

	test("constants provide expected defaults and presets with LATER formats marked", () => {
		expect(DEFAULT_PDF_EXPORT_OPTIONS.paperSize).toBe("A4");
		expect(DEFAULT_PDF_EXPORT_OPTIONS.pageColor).toBe("#FFFFFF");
		expect(DEFAULT_PDF_EXPORT_OPTIONS.textColor).toBe("#111827");
		expect(DEFAULT_PDF_EXPORT_OPTIONS.showPageNumber).toBe(true);
		expect(DEFAULT_PDF_EXPORT_OPTIONS.textAlign).toBe("justify");
		expect(DEFAULT_PDF_EXPORT_OPTIONS.fontFamily).toBe("Times-Roman");

		// Paper size options
		expect(PAPER_SIZE_OPTIONS.map((p) => p.id)).toContain("A4");
		expect(PAPER_SIZE_OPTIONS.map((p) => p.id)).toContain("A5");
		expect(PAPER_SIZE_OPTIONS.map((p) => p.id)).toContain("Letter");

		// Format status: PDF is ready, others marked as later
		const pdfFormat = EXPORT_FORMAT_OPTIONS.find((f) => f.id === "pdf");
		expect(pdfFormat?.status).toBe("ready");

		const laterFormats = EXPORT_FORMAT_OPTIONS.filter((f) => f.status === "later");
		expect(laterFormats.length).toBeGreaterThanOrEqual(4);
		expect(laterFormats.map((f) => f.id)).toContain("epub");
		expect(laterFormats.map((f) => f.id)).toContain("docx");
		expect(laterFormats.map((f) => f.id)).toContain("markdown");
		expect(laterFormats.map((f) => f.id)).toContain("html");
	});

	test("markdownFormatter strips frontmatter, resolves wikilinks, and parses blocks", () => {
		const raw = `---
status: draft
tags: [dark, war]
---
[[Captain Vance|Vance]] looked across the **burning** valley.

***

> "Hold the line!"`;

		expect(stripFrontmatter(raw)).not.toContain("status: draft");
		expect(stripWikilinks("[[Marcus Vance|Commander Vance]]")).toBe(
			"Commander Vance",
		);
		expect(stripWikilinks("[[Ancient Castle]]")).toBe("Ancient Castle");
		expect(cleanInlineMarkdown("**bold** and *italic* and `code`")).toBe(
			"bold and italic and code",
		);

		const blocks = parseMarkdownBlocks(raw);
		expect(blocks.some((b) => b.type === "paragraph")).toBe(true);
		expect(blocks.some((b) => b.type === "divider")).toBe(true);
		expect(blocks.some((b) => b.type === "blockquote")).toBe(true);
	});

	test("pdfStyler resolves standard font variants accurately", () => {
		expect(resolveFontVariant("Times-Roman", "regular")).toBe("Times-Roman");
		expect(resolveFontVariant("Times-Roman", "bold")).toBe("Times-Bold");
		expect(resolveFontVariant("Times-Roman", "italic")).toBe("Times-Italic");

		expect(resolveFontVariant("Helvetica", "regular")).toBe("Helvetica");
		expect(resolveFontVariant("Helvetica", "bold")).toBe("Helvetica-Bold");
		expect(resolveFontVariant("Helvetica", "italic")).toBe("Helvetica-Oblique");

		expect(resolveFontVariant("Courier", "regular")).toBe("Courier");
		expect(resolveFontVariant("Courier", "bold")).toBe("Courier-Bold");
	});

	test("downloader generates safe filenames and converts bytes", () => {
		const fn = generateDefaultExportFileName("The Whispering Tide");
		expect(fn).toContain("the-whispering-tide");
		expect(fn.endsWith(".pdf")).toBe(true);

		const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
		const base64 = uint8ArrayToBase64(bytes);
		expect(base64).toBe("SGVsbG8=");

		const blob = createPdfBlob(bytes);
		expect(blob.type).toBe("application/pdf");
	});

	test("validateExportPrerequisites catches empty manuscripts safely", () => {
		const valid = validateExportPrerequisites(
			sampleProject,
			sampleDocs,
			DEFAULT_PDF_EXPORT_OPTIONS,
		);
		expect(valid.valid).toBe(true);

		const emptyValid = validateExportPrerequisites(
			sampleProject,
			[],
			DEFAULT_PDF_EXPORT_OPTIONS,
		);
		expect(emptyValid.valid).toBe(false);
		expect(emptyValid.reason).toBeDefined();
	});

	test("renderPdfDocument generates valid PDF with custom background, margins, and top page numbers", async () => {
		const customOptions: PdfExportOptions = {
			format: "pdf",
			paperSize: "A5",
			pageColor: "#FDFBF7",
			textColor: "#111827",
			margin: 36,
			showPageNumber: true,
			fontFamily: "Times-Roman",
			textAlign: "justify",
			includeCover: false,
			includeTitlePage: true,
			includeManuscriptOnly: true,
		};

		const pdfBytes = await renderPdfDocument(
			sampleProject,
			sampleDocs,
			customOptions,
		);

		expect(pdfBytes).toBeInstanceOf(Uint8Array);
		expect(pdfBytes.byteLength).toBeGreaterThan(1000);

		// Check PDF magic header %PDF-
		const header = String.fromCharCode(...pdfBytes.slice(0, 5));
		expect(header).toBe("%PDF-");
	});

	test("exportProjectToPdf coordinates end-to-end export process", async () => {
		const steps: string[] = [];
		const result = await exportProjectToPdf(
			sampleProject,
			sampleDocs,
			DEFAULT_PDF_EXPORT_OPTIONS,
			(prog) => {
				steps.push(prog.stage);
			},
		);

		expect(result.success).toBe(true);
		expect(result.bytes).toBeGreaterThan(1000);
		expect(result.blob).toBeInstanceOf(Blob);
		expect(result.fileName).toContain(".pdf");
		expect(steps).toContain("preparing");
		expect(steps).toContain("rendering");
		expect(steps).toContain("styling");
		expect(steps).toContain("finalizing");
	});

	test("fontManager registers standard fonts and verifies availability", () => {
		const isRegistered = ensureStandardFontsRegistered();
		expect(isRegistered).toBe(true);
		expect(areStandardFontsAvailable()).toBe(true);

		const options = getAvailableFontOptions();
		expect(options.some((o) => o.id === "Times-Roman")).toBe(true);
		expect(options.some((o) => o.id === "Helvetica")).toBe(true);
		expect(options.some((o) => o.id === "Courier")).toBe(true);
		expect(options.some((o) => o.id === "custom")).toBe(true);
	});

	test("fontManager hides standard fonts when standard fonts are not installed/available", () => {
		try {
			// Mock standard fonts as unavailable
			setStandardFontsAvailableForTesting(false);
			expect(areStandardFontsAvailable()).toBe(false);

			const options = getAvailableFontOptions();
			// Standard fonts must NOT be shown
			expect(options.some((o) => o.id === "Times-Roman")).toBe(false);
			expect(options.some((o) => o.id === "Helvetica")).toBe(false);
			expect(options.some((o) => o.id === "Courier")).toBe(false);
			// Only custom font must be offered
			expect(options.length).toBe(1);
			expect(options[0].id).toBe("custom");

			// Attempting to export with standard font when unavailable fails validation
			const validation = validateExportPrerequisites(
				sampleProject,
				sampleDocs,
				{
					...DEFAULT_PDF_EXPORT_OPTIONS,
					fontFamily: "Helvetica",
				},
			);
			expect(validation.valid).toBe(false);
			expect(validation.reason).toContain("not available");
		} finally {
			// Restore real standard font detection
			setStandardFontsAvailableForTesting(null);
			expect(areStandardFontsAvailable()).toBe(true);
		}
	});

	test("custom font utilities sanitize names and build font configurations", () => {
		expect(sanitizeFontFamilyName("My Custom-Font.1.0.ttf")).toBe(
			"My_Custom-Font_1_0",
		);
		expect(sanitizeFontFamilyName("")).toBe("CustomFont");

		const mockBytes = new Uint8Array([1, 2, 3, 4]);
		const config = createCustomFontFromBytes(
			"Ancient Runes.otf",
			mockBytes,
			"AncientRunes.otf",
		);
		expect(config.name).toBe("Ancient_Runes");
		expect(config.format).toBe("otf");
		expect(config.sizeBytes).toBe(4);
	});

	test("validateExportPrerequisites validates custom font presence", () => {
		// Custom font selected but missing config
		const missingFontRes = validateExportPrerequisites(
			sampleProject,
			sampleDocs,
			{
				...DEFAULT_PDF_EXPORT_OPTIONS,
				fontFamily: "custom",
				customFont: undefined,
			},
		);
		expect(missingFontRes.valid).toBe(false);
		expect(missingFontRes.reason).toContain("custom font file");

		// Custom font with valid config
		const mockFont = createCustomFontFromBytes(
			"TestFont",
			new Uint8Array([1, 2, 3]),
		);
		const validFontRes = validateExportPrerequisites(
			sampleProject,
			sampleDocs,
			{
				...DEFAULT_PDF_EXPORT_OPTIONS,
				fontFamily: "custom",
				customFont: mockFont,
			},
		);
		expect(validFontRes.valid).toBe(true);
	});

	test("renderPdfDocument generates PDF using a real Custom Font", async () => {
		const fontBuffer = await Bun.file(
			"/usr/share/fonts/liberation/LiberationSerif-Regular.ttf",
		).arrayBuffer();
		const customFontConfig = createCustomFontFromBytes(
			"LiberationSerif",
			new Uint8Array(fontBuffer),
			"LiberationSerif-Regular.ttf",
		);

		const customOptions: PdfExportOptions = {
			format: "pdf",
			paperSize: "A4",
			pageColor: "#FFFFFF",
			textColor: "#000000",
			margin: 54,
			showPageNumber: true,
			fontFamily: "custom",
			customFont: customFontConfig,
			textAlign: "justify",
			includeCover: false,
			includeTitlePage: true,
			includeManuscriptOnly: true,
		};

		const pdfBytes = await renderPdfDocument(
			sampleProject,
			sampleDocs,
			customOptions,
		);

		expect(pdfBytes).toBeInstanceOf(Uint8Array);
		expect(pdfBytes.byteLength).toBeGreaterThan(1000);
		const header = String.fromCharCode(...pdfBytes.slice(0, 5));
		expect(header).toBe("%PDF-");
	});

	test("renderPdfDocument generates PDF with custom font even when standard fonts are unavailable", async () => {
		try {
			// Mock standard fonts as unavailable
			setStandardFontsAvailableForTesting(false);

			const fontBuffer = await Bun.file(
				"/usr/share/fonts/liberation/LiberationSerif-Regular.ttf",
			).arrayBuffer();
			const customFontConfig = createCustomFontFromBytes(
				"LiberationSerif",
				new Uint8Array(fontBuffer),
				"LiberationSerif-Regular.ttf",
			);

			const customOptions: PdfExportOptions = {
				format: "pdf",
				paperSize: "A5",
				pageColor: "#F5F2EB",
				textColor: "#111827",
				margin: 40,
				showPageNumber: true,
				fontFamily: "custom",
				customFont: customFontConfig,
				textAlign: "left",
				includeCover: false,
				includeTitlePage: true,
				includeManuscriptOnly: true,
			};

			const pdfBytes = await renderPdfDocument(
				sampleProject,
				sampleDocs,
				customOptions,
			);

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.byteLength).toBeGreaterThan(1000);
			const header = String.fromCharCode(...pdfBytes.slice(0, 5));
			expect(header).toBe("%PDF-");
		} finally {
			setStandardFontsAvailableForTesting(null);
		}
	});
});
