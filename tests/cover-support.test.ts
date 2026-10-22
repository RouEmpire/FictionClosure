import { describe, test, expect } from "bun:test";
import {
	SUPPORTED_COVER_EXTENSIONS,
	SUPPORTED_COVER_ACCEPT,
	SUPPORTED_COVER_FORMAT_LABELS,
	isSupportedCoverFile,
	extractCoverExtension,
	getCoverFormatLabel,
	canRenderBrowserPreview,
} from "../src/shared/domain/coverSupport";

describe("Cover Support Domain Model & Utilities", () => {
	test("supports all 14 required cover formats across extensions", () => {
		const required = [
			"jpg",
			"jpeg",
			"jxl",
			"png",
			"avif",
			"webp",
			"gif",
			"tiff",
			"tif",
			"heic",
			"heif",
			"psd",
			"psb",
			"pdf",
			"apng",
		];

		for (const ext of required) {
			expect(SUPPORTED_COVER_EXTENSIONS).toContain(`.${ext}` as any);
			expect(isSupportedCoverFile(`my-cover.${ext}`)).toBe(true);
			expect(isSupportedCoverFile(`COVER_ASSET.${ext.toUpperCase()}`)).toBe(
				true,
			);
		}
	});

	test("rejects unsupported extensions safely", () => {
		const unsupported = [
			"document.docx",
			"notes.txt",
			"audio.mp3",
			"video.mp4",
			"executable.exe",
			"script.sh",
			"archive.zip",
			"unknown",
		];

		for (const file of unsupported) {
			expect(isSupportedCoverFile(file)).toBe(false);
		}
	});

	test("extractCoverExtension parses extensions from filenames, paths, and data URLs", () => {
		expect(extractCoverExtension("cover.psd")).toBe("psd");
		expect(extractCoverExtension("/var/media/novel.heic")).toBe("heic");
		expect(extractCoverExtension("data:image/png;base64,iVBORw0KGgo...")).toBe(
			"png",
		);
		expect(
			extractCoverExtension("data:image/jpeg;base64,/9j/4AAQSkZJRg..."),
		).toBe("jpg");
		expect(
			extractCoverExtension("data:image/webp;base64,UklGRm..."),
		).toBe("webp");
		expect(
			extractCoverExtension("data:image/apng;base64,..."),
		).toBe("apng");
		expect(
			extractCoverExtension("data:application/pdf;base64,..."),
		).toBe("pdf");
		expect(
			extractCoverExtension("data:image/tiff;base64,..."),
		).toBe("tiff");
		expect(
			extractCoverExtension("data:image/vnd.adobe.photoshop;base64,..."),
		).toBe("psd");
	});

	test("canRenderBrowserPreview distinguishes browser renderables from native/master assets", () => {
		// Browser renderable web formats
		expect(canRenderBrowserPreview("cover.jpg")).toBe(true);
		expect(canRenderBrowserPreview("cover.jpeg")).toBe(true);
		expect(canRenderBrowserPreview("cover.png")).toBe(true);
		expect(canRenderBrowserPreview("cover.webp")).toBe(true);
		expect(canRenderBrowserPreview("cover.avif")).toBe(true);
		expect(canRenderBrowserPreview("cover.gif")).toBe(true);
		expect(canRenderBrowserPreview("cover.apng")).toBe(true);

		// Non-browser renderable master formats
		expect(canRenderBrowserPreview("master-cover.psd")).toBe(false);
		expect(canRenderBrowserPreview("large-format.psb")).toBe(false);
		expect(canRenderBrowserPreview("print-ready.pdf")).toBe(false);
		expect(canRenderBrowserPreview("high-res.tif")).toBe(false);
		expect(canRenderBrowserPreview("high-res.tiff")).toBe(false);
		expect(canRenderBrowserPreview("iphone-photo.heic")).toBe(false);
		expect(canRenderBrowserPreview("iphone-photo.heif")).toBe(false);
		expect(canRenderBrowserPreview("next-gen.jxl")).toBe(false);
	});

	test("getCoverFormatLabel returns normalized upper-case format labels", () => {
		expect(getCoverFormatLabel("test.psd")).toBe("PSD");
		expect(getCoverFormatLabel("test.psb")).toBe("PSB");
		expect(getCoverFormatLabel("test.pdf")).toBe("PDF");
		expect(getCoverFormatLabel("test.tiff")).toBe("TIFF");
		expect(getCoverFormatLabel("test.tif")).toBe("TIFF");
		expect(getCoverFormatLabel("test.heic")).toBe("HEIC");
		expect(getCoverFormatLabel("test.heif")).toBe("HEIC");
		expect(getCoverFormatLabel("test.jxl")).toBe("JXL");
		expect(getCoverFormatLabel("test.apng")).toBe("APNG");
		expect(getCoverFormatLabel("test.png")).toBe("PNG");
		expect(getCoverFormatLabel("test.jpg")).toBe("JPG");
		expect(getCoverFormatLabel("test.jpeg")).toBe("JPG");
		expect(getCoverFormatLabel("test.webp")).toBe("WEBP");
		expect(getCoverFormatLabel("test.avif")).toBe("AVIF");
	});

	test("SUPPORTED_COVER_ACCEPT includes all required file extensions and fallbacks", () => {
		expect(SUPPORTED_COVER_ACCEPT).toContain(".jpg");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".png");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".webp");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".avif");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".gif");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".apng");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".tiff");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".heic");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".pdf");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".psd");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".psb");
		expect(SUPPORTED_COVER_ACCEPT).toContain(".jxl");
		expect(SUPPORTED_COVER_ACCEPT).toContain("image/*");
		expect(SUPPORTED_COVER_ACCEPT).toContain("application/pdf");
	});
});
