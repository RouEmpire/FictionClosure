import { describe, test, expect } from "bun:test";
import {
	BUNDLED_FONTS,
	decodeDataUrlToUint8Array,
	extractFontFileName,
	findBundledFont,
	getBundledFonts,
	loadBundledFontBytes,
	parseBundledFontConfigs,
	slugifyFontId,
} from "../src/shared/domain/bundledFonts";
import {
	areStandardFontsAvailable,
	getAvailableFontOptions,
	getBundledFontFamilyOptions,
	setStandardFontsAvailableForTesting,
} from "../src/mainview/services/documentExport/fontManager";
import { renderPdfDocument } from "../src/mainview/services/documentExport/pdfDocumentRenderer";
import { DEFAULT_PDF_EXPORT_OPTIONS } from "../src/mainview/services/documentExport/constants";
import type { FictionDocument, ProjectInfo } from "../src/shared/types";
import type { PdfExportOptions } from "../src/mainview/services/documentExport/types";

describe("Bundled Fonts Subsystem & Configuration", () => {
	const sampleProject: ProjectInfo = {
		id: "proj-bundled-font-test",
		name: "Bangkok Cyberpunk: 2099",
		author: "Somchai Prasert",
		genre: "Sci-Fi",
		targetWordCount: 60000,
		created: new Date().toISOString(),
		lastSaved: new Date().toISOString(),
	};

	const sampleDocs: FictionDocument[] = [
		{
			id: "doc-1",
			title: "บทที่ 1: แสงนีออนริมแม่น้ำเจ้าพระยา",
			type: "manuscript",
			order: 1,
			content:
				"# บทที่ 1\n\nสายฝนโปรยปรายลงมาบนถนนคอนกรีต แสงนีออนสาดส่องกระทบผิวน้ำอย่างเงียบสงบ\n\n> 'อนาคตไม่ได้สร้างขึ้นจากความหวัง แต่สร้างขึ้นจากการกระทำ'",
			createdAt: 1000,
			updatedAt: 1000,
		},
	];

	test("config.json contains all 6 initial bundled fonts", () => {
		const fonts = getBundledFonts();
		expect(fonts.length).toBeGreaterThanOrEqual(6);

		const names = fonts.map((f) => f.name);
		expect(names).toContain("Anuphan");
		expect(names).toContain("iannnnnAMD (2005 Edition)");
		expect(names).toContain("IBM Plex Sans");
		expect(names).toContain("Prompt");
		expect(names).toContain("TH Sarabun New");
		expect(names).toContain("TH Sarabun PSK-Eco");
	});

	test("slugifyFontId generates clean, URL- and CSS-safe identifiers", () => {
		expect(slugifyFontId("Prompt")).toBe("prompt");
		expect(slugifyFontId("TH Sarabun New")).toBe("th-sarabun-new");
		expect(slugifyFontId("iannnnnAMD (2005 Edition)")).toBe(
			"iannnnnamd-2005-edition",
		);
		expect(slugifyFontId("IBM Plex Sans")).toBe("ibm-plex-sans");
	});

	test("extractFontFileName normalizes various relative and absolute path notations", () => {
		expect(extractFontFileName("./Prompt.ttf")).toBe("Prompt.ttf");
		expect(extractFontFileName("Prompt.ttf")).toBe("Prompt.ttf");
		expect(extractFontFileName("sub/dir/Font.otf")).toBe("Font.otf");
		expect(extractFontFileName("./iannnnnAMD (2005 Edition).ttf")).toBe(
			"iannnnnAMD (2005 Edition).ttf",
		);
	});

	test("parseBundledFontConfigs dynamically parses new fonts added to config schema", () => {
		const customSchema = {
			fonts: [
				{
					name: "Sarun's Manupath",
					path: "./SarunManupath.ttf",
				},
				{
					id: "custom-serif-id",
					name: "Chulabhorn Serif",
					path: "./Chulabhorn.otf",
				},
			],
		};

		const parsed = parseBundledFontConfigs(customSchema);
		expect(parsed).toHaveLength(2);

		expect(parsed[0].name).toBe("Sarun's Manupath");
		expect(parsed[0].id).toBe("sarun-s-manupath");
		expect(parsed[0].fileName).toBe("SarunManupath.ttf");
		expect(parsed[0].format).toBe("truetype");
		expect(parsed[0].fontFamilyCss).toContain("Sarun's Manupath");

		expect(parsed[1].id).toBe("custom-serif-id");
		expect(parsed[1].name).toBe("Chulabhorn Serif");
		expect(parsed[1].format).toBe("opentype");
	});

	test("findBundledFont locates bundled font by id, name, or filename", () => {
		expect(findBundledFont("prompt")?.name).toBe("Prompt");
		expect(findBundledFont("Prompt")?.id).toBe("prompt");
		expect(findBundledFont("Prompt.ttf")?.name).toBe("Prompt");
		expect(findBundledFont("th-sarabun-new")?.name).toBe("TH Sarabun New");
		expect(findBundledFont("non-existent")).toBeUndefined();
	});

	test("loadBundledFontBytes successfully loads font binary data for each bundled font", async () => {
		for (const font of BUNDLED_FONTS) {
			const bytes = await loadBundledFontBytes(font);
			expect(bytes).not.toBeNull();
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(bytes!.byteLength).toBeGreaterThan(1000);
		}
	});

	test("decodeDataUrlToUint8Array decodes base64 data URLs accurately", () => {
		const sampleText = "FictionClosure Thai Font Test 2026";
		const base64 = Buffer.from(sampleText, "utf-8").toString("base64");
		const dataUrl = `data:font/ttf;base64,${base64}`;

		const decoded = decodeDataUrlToUint8Array(dataUrl);
		const decodedText = new TextDecoder().decode(decoded);
		expect(decodedText).toBe(sampleText);
	});

	test("loadBundledFontBytes handles inlined data URL font directly without filesystem", async () => {
		const originalFont = findBundledFont("TH Sarabun New");
		expect(originalFont).toBeDefined();

		const rawBytes = await loadBundledFontBytes(originalFont!);
		expect(rawBytes).not.toBeNull();

		const base64 = Buffer.from(rawBytes!).toString("base64");
		const simulatedInlinedFont = {
			...originalFont!,
			url: `data:font/ttf;base64,${base64}`,
		};

		const inlinedBytes = await loadBundledFontBytes(simulatedInlinedFont);
		expect(inlinedBytes).not.toBeNull();
		expect(inlinedBytes!.byteLength).toBe(rawBytes!.byteLength);
		expect(inlinedBytes![0]).toBe(rawBytes![0]);
	});

	describe("Export Menu & Font Options Integration", () => {
		test("getBundledFontFamilyOptions returns all bundled fonts with category 'bundled'", () => {
			const bundledOptions = getBundledFontFamilyOptions();
			expect(bundledOptions.length).toBeGreaterThanOrEqual(6);
			for (const opt of bundledOptions) {
				expect(opt.category).toBe("bundled");
				expect(opt.id).toBeDefined();
				expect(opt.label).toBeDefined();
			}
		});

		test("getAvailableFontOptions includes bundled fonts alongside standard and custom", () => {
			const options = getAvailableFontOptions();
			const categories = options.map((o) => o.category);
			expect(categories).toContain("bundled");
			expect(categories).toContain("custom");
		});

		test("getAvailableFontOptions retains bundled fonts even when standard fonts are unavailable", () => {
			try {
				setStandardFontsAvailableForTesting(false);
				const options = getAvailableFontOptions();
				const ids = options.map((o) => o.id);

				// Standard fonts should be excluded
				expect(ids).not.toContain("Helvetica");
				expect(ids).not.toContain("Times-Roman");

				// Bundled fonts must remain available!
				expect(ids).toContain("prompt");
				expect(ids).toContain("anuphan");
				expect(ids).toContain("custom");
			} finally {
				setStandardFontsAvailableForTesting(null);
			}
		});
	});

	describe("PDFKit Export with Bundled Fonts", () => {
		test("renderPdfDocument exports PDF using bundled font Prompt", async () => {
			const options: PdfExportOptions = {
				...DEFAULT_PDF_EXPORT_OPTIONS,
				fontFamily: "prompt",
				includeCover: false,
				includeTitlePage: true,
			};

			const pdfBytes = await renderPdfDocument(
				sampleProject,
				sampleDocs,
				options,
			);

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.byteLength).toBeGreaterThan(1000);
			const header = String.fromCharCode(...pdfBytes.slice(0, 5));
			expect(header).toBe("%PDF-");
		});

		test("renderPdfDocument exports PDF using bundled font Anuphan when standard fonts are missing", async () => {
			try {
				setStandardFontsAvailableForTesting(false);

				const options: PdfExportOptions = {
					...DEFAULT_PDF_EXPORT_OPTIONS,
					fontFamily: "anuphan",
					includeCover: false,
					includeTitlePage: true,
				};

				const pdfBytes = await renderPdfDocument(
					sampleProject,
					sampleDocs,
					options,
				);

				expect(pdfBytes).toBeInstanceOf(Uint8Array);
				expect(pdfBytes.byteLength).toBeGreaterThan(1000);
				const header = String.fromCharCode(...pdfBytes.slice(0, 5));
				expect(header).toBe("%PDF-");
			} finally {
				setStandardFontsAvailableForTesting(null);
			}
		});

		test("renderPdfDocument exports PDF using bundled font TH Sarabun New by name and id", async () => {
			for (const fontName of ["TH Sarabun New", "th-sarabun-new"]) {
				const options: PdfExportOptions = {
					...DEFAULT_PDF_EXPORT_OPTIONS,
					fontFamily: fontName,
					includeCover: false,
					includeTitlePage: true,
				};

				const pdfBytes = await renderPdfDocument(
					sampleProject,
					sampleDocs,
					options,
				);

				expect(pdfBytes).toBeInstanceOf(Uint8Array);
				expect(pdfBytes.byteLength).toBeGreaterThan(1000);
				const header = String.fromCharCode(...pdfBytes.slice(0, 5));
				expect(header).toBe("%PDF-");
			}
		});

		test("renderPdfDocument successfully renders with all bundled fonts", async () => {
			for (const font of BUNDLED_FONTS) {
				const options: PdfExportOptions = {
					...DEFAULT_PDF_EXPORT_OPTIONS,
					fontFamily: font.id,
					includeCover: false,
					includeTitlePage: false,
				};

				const pdfBytes = await renderPdfDocument(
					sampleProject,
					sampleDocs,
					options,
				);

				expect(pdfBytes).toBeInstanceOf(Uint8Array);
				expect(pdfBytes.byteLength).toBeGreaterThan(1000);
			}
		});
	});
});
