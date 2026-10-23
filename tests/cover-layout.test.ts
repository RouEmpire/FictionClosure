import { describe, test, expect } from "bun:test";
import {
	computeCoverImageLayout,
	getCssObjectPosition,
} from "../src/mainview/services/documentExport/coverLayout";
import {
	decodeDataUrlToUint8Array,
	isPdfKitNativeImageFormat,
	prepareCoverImageBytes,
} from "../src/mainview/services/documentExport/coverImageProcessor";
import { renderPdfDocument } from "../src/mainview/services/documentExport/pdfDocumentRenderer";
import { DEFAULT_PDF_EXPORT_OPTIONS } from "../src/mainview/services/documentExport/constants";
import type { FictionDocument, ProjectInfo } from "../src/shared/types";
import type { PdfExportOptions } from "../src/mainview/services/documentExport/types";

describe("Cover Layout Computation & Rendering", () => {
	// A valid 1x1 transparent PNG data URL for headless testing
	const SAMPLE_PNG_DATA_URL =
		"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

	const sampleProject: ProjectInfo = {
		id: "proj-cover-test",
		name: "Chronicles of the Outer Ring",
		author: "Kaelen Voss",
		genre: "Sci-Fi",
		targetWordCount: 50000,
		created: new Date().toISOString(),
		lastSaved: new Date().toISOString(),
	};

	const sampleDocs: FictionDocument[] = [
		{
			id: "doc-1",
			title: "Prologue: Deep Drift",
			type: "manuscript",
			order: 1,
			content: "# Prologue\n\nThe silence of the vacuum was deafening.",
			createdAt: 1000,
			updatedAt: 1000,
		},
	];

	describe("computeCoverImageLayout", () => {
		test("fit: 'fill' stretches image to exact page dimensions without clipping", () => {
			const layout = computeCoverImageLayout({
				pageWidth: 595.28,
				pageHeight: 841.89,
				imageWidth: 1000,
				imageHeight: 600,
				fit: "fill",
				positionX: "center",
				positionY: "middle",
			});

			expect(layout.x).toBe(0);
			expect(layout.y).toBe(0);
			expect(layout.width).toBeCloseTo(595.28, 2);
			expect(layout.height).toBeCloseTo(841.89, 2);
			expect(layout.clipToPage).toBe(false);
		});

		test("fit: 'contain' fits entire image within page boundaries preserving aspect ratio", () => {
			// Wide image on tall page -> width matches page, height scaled down
			const layoutCenter = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500, // 2:1 ratio
				fit: "contain",
				positionX: "center",
				positionY: "middle",
			});

			expect(layoutCenter.width).toBe(500);
			expect(layoutCenter.height).toBe(250);
			expect(layoutCenter.x).toBe(0);
			expect(layoutCenter.y).toBe((1000 - 250) / 2); // 375
			expect(layoutCenter.clipToPage).toBe(false);

			// Test vertical positions: top and bottom
			const layoutTop = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500,
				fit: "contain",
				positionX: "center",
				positionY: "top",
			});
			expect(layoutTop.y).toBe(0);

			const layoutBottom = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500,
				fit: "contain",
				positionX: "center",
				positionY: "bottom",
			});
			expect(layoutBottom.y).toBe(750);
		});

		test("fit: 'cover' fills entire page and clips overflow", () => {
			// Wide image on tall page -> height matches page, width overflows
			const layoutCenter = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500, // 2:1 ratio -> scale = 1000/500 = 2 -> width = 2000
				fit: "cover",
				positionX: "center",
				positionY: "middle",
			});

			expect(layoutCenter.height).toBe(1000);
			expect(layoutCenter.width).toBe(2000);
			expect(layoutCenter.x).toBe((500 - 2000) / 2); // -750
			expect(layoutCenter.y).toBe(0);
			expect(layoutCenter.clipToPage).toBe(true);

			// Test horizontal positions: left and right
			const layoutLeft = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500,
				fit: "cover",
				positionX: "left",
				positionY: "middle",
			});
			expect(layoutLeft.x).toBe(0);

			const layoutRight = computeCoverImageLayout({
				pageWidth: 500,
				pageHeight: 1000,
				imageWidth: 1000,
				imageHeight: 500,
				fit: "cover",
				positionX: "right",
				positionY: "middle",
			});
			expect(layoutRight.x).toBe(500 - 2000); // -1500
		});

		test("fit: 'none' maintains native dimensions and aligns appropriately", () => {
			const layout = computeCoverImageLayout({
				pageWidth: 800,
				pageHeight: 1000,
				imageWidth: 400,
				imageHeight: 300,
				fit: "none",
				positionX: "right",
				positionY: "bottom",
			});

			expect(layout.width).toBe(400);
			expect(layout.height).toBe(300);
			expect(layout.x).toBe(800 - 400); // 400
			expect(layout.y).toBe(1000 - 300); // 700
			expect(layout.clipToPage).toBe(false);

			// When image is larger than page, clipToPage is true
			const layoutOversized = computeCoverImageLayout({
				pageWidth: 400,
				pageHeight: 400,
				imageWidth: 800,
				imageHeight: 800,
				fit: "none",
				positionX: "center",
				positionY: "middle",
			});
			expect(layoutOversized.clipToPage).toBe(true);
		});
	});

	describe("getCssObjectPosition", () => {
		test("formats valid CSS object-position string for all alignments", () => {
			expect(getCssObjectPosition("left", "top")).toBe("left top");
			expect(getCssObjectPosition("center", "middle")).toBe("center center");
			expect(getCssObjectPosition("right", "bottom")).toBe("right bottom");
			expect(getCssObjectPosition("left", "middle")).toBe("left center");
		});
	});

	describe("renderPdfDocument with Cover Options", () => {
		test("renders PDF with custom image cover on exclusive first page", async () => {
			const options: PdfExportOptions = {
				...DEFAULT_PDF_EXPORT_OPTIONS,
				includeCover: true,
				coverOptions: {
					enabled: true,
					source: "custom",
					customImageDataUrl: SAMPLE_PNG_DATA_URL,
					fit: "cover",
					positionX: "center",
					positionY: "middle",
				},
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

		test("renders PDF when cover is disabled (source: none)", async () => {
			const options: PdfExportOptions = {
				...DEFAULT_PDF_EXPORT_OPTIONS,
				includeCover: false,
				coverOptions: {
					enabled: false,
					source: "none",
					fit: "contain",
					positionX: "center",
					positionY: "middle",
				},
				includeTitlePage: false,
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

		test("supports all 4 fit modes when rendering cover image in PDFKit", async () => {
			for (const fit of ["fill", "cover", "contain", "none"] as const) {
				const options: PdfExportOptions = {
					...DEFAULT_PDF_EXPORT_OPTIONS,
					includeCover: true,
					coverOptions: {
						enabled: true,
						source: "custom",
						customImageDataUrl: SAMPLE_PNG_DATA_URL,
						fit,
						positionX: "left",
						positionY: "top",
					},
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

		test("renders PDF with cover in simulated browser environment where Buffer is undefined", async () => {
			const originalBuffer = globalThis.Buffer;
			try {
				// Simulate client-side browser runtime where Node Buffer is undefined
				(globalThis as any).Buffer = undefined;

				const options: PdfExportOptions = {
					...DEFAULT_PDF_EXPORT_OPTIONS,
					includeCover: true,
					coverOptions: {
						enabled: true,
						source: "custom",
						customImageDataUrl: SAMPLE_PNG_DATA_URL,
						fit: "cover",
						positionX: "center",
						positionY: "middle",
					},
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
				(globalThis as any).Buffer = originalBuffer;
			}
		});

		test("does not add an empty cover page when cover image is invalid or cannot be loaded", async () => {
			const options: PdfExportOptions = {
				...DEFAULT_PDF_EXPORT_OPTIONS,
				includeCover: true,
				coverOptions: {
					enabled: true,
					source: "custom",
					customImageDataUrl: "data:image/xyz;base64,invalidbytes",
					fit: "cover",
					positionX: "center",
					positionY: "middle",
				},
				includeTitlePage: true,
			};

			const pdfBytes = await renderPdfDocument(
				sampleProject,
				sampleDocs,
				options,
			);

			expect(pdfBytes).toBeInstanceOf(Uint8Array);
			expect(pdfBytes.byteLength).toBeGreaterThan(1000);
		});
	});

	describe("CoverImageProcessor", () => {
		test("decodeDataUrlToUint8Array decodes valid base64 data URLs without Buffer", () => {
			const bytes = decodeDataUrlToUint8Array(SAMPLE_PNG_DATA_URL);
			expect(bytes).not.toBeNull();
			expect(bytes).toBeInstanceOf(Uint8Array);
			expect(isPdfKitNativeImageFormat(bytes!)).toBe(true);
		});

		test("decodeDataUrlToUint8Array safely returns null on malformed data URLs", () => {
			expect(decodeDataUrlToUint8Array("not-a-data-url")).toBeNull();
			expect(decodeDataUrlToUint8Array("")).toBeNull();
		});

		test("isPdfKitNativeImageFormat correctly recognizes PNG and JPEG magic numbers", () => {
			const pngMagic = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
			const jpegMagic = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
			const webpMagic = new Uint8Array([0x52, 0x49, 0x46, 0x46]);

			expect(isPdfKitNativeImageFormat(pngMagic)).toBe(true);
			expect(isPdfKitNativeImageFormat(jpegMagic)).toBe(true);
			expect(isPdfKitNativeImageFormat(webpMagic)).toBe(false);
		});

		test("prepareCoverImageBytes handles native data URLs in headless environments", async () => {
			const result = await prepareCoverImageBytes(SAMPLE_PNG_DATA_URL);
			expect(result).not.toBeNull();
			expect(result?.bytes).toBeInstanceOf(Uint8Array);
			expect(isPdfKitNativeImageFormat(result!.bytes)).toBe(true);
		});
	});
});
