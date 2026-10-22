/**
 * Cover Image & File Format Support for FictionClosure Projects.
 *
 * Supported cover formats:
 * - JPEG (.jpg, .jpeg)
 * - JPEG XL (.jxl)
 * - PNG (.png)
 * - AVIF (.avif)
 * - WebP (.webp)
 * - GIF (.gif)
 * - TIFF (.tif, .tiff)
 * - HEIC / HEIF (.heic, .heif)
 * - Photoshop PSD (.psd)
 * - Photoshop Large Document PSB (.psb)
 * - PDF (.pdf)
 * - Animated PNG / APNG (.apng)
 */

export const SUPPORTED_COVER_EXTENSIONS = [
	".jpg",
	".jpeg",
	".jxl",
	".png",
	".avif",
	".webp",
	".gif",
	".tif",
	".tiff",
	".heic",
	".heif",
	".psd",
	".psb",
	".pdf",
	".apng",
] as const;

export type SupportedCoverExtension = (typeof SUPPORTED_COVER_EXTENSIONS)[number];

export const SUPPORTED_COVER_ACCEPT =
	".jpg,.jpeg,.jxl,.png,.avif,.webp,.gif,.tif,.tiff,.heic,.heif,.psd,.psb,.pdf,.apng,image/*,application/pdf";

export const SUPPORTED_COVER_FORMAT_LABELS = [
	"JPG",
	"JPEG",
	"JXL",
	"PNG",
	"AVIF",
	"WEBP",
	"GIF",
	"TIFF",
	"HEIC",
	"PSD",
	"PSB",
	"PDF",
	"APNG",
] as const;

/**
 * Checks whether a filename or path has a supported cover format extension.
 */
export function isSupportedCoverFile(filenameOrPath: string): boolean {
	if (!filenameOrPath || typeof filenameOrPath !== "string") return false;
	const lower = filenameOrPath.toLowerCase();
	return SUPPORTED_COVER_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Extracts normalized file extension from a filename or data URL.
 */
export function extractCoverExtension(filenameOrDataUrl: string): string {
	if (!filenameOrDataUrl) return "png";

	if (filenameOrDataUrl.startsWith("data:")) {
		const match = filenameOrDataUrl.match(/^data:([^;,\s]+);/);
		if (match && match[1]) {
			const mime = match[1].toLowerCase();
			if (mime === "image/jpeg") return "jpg";
			if (mime === "image/png") return "png";
			if (mime === "image/webp") return "webp";
			if (mime === "image/avif") return "avif";
			if (mime === "image/gif") return "gif";
			if (mime === "image/jxl") return "jxl";
			if (mime === "image/tiff") return "tiff";
			if (mime === "image/heic" || mime === "image/heif") return "heic";
			if (mime === "image/vnd.adobe.photoshop" || mime === "application/x-photoshop") return "psd";
			if (mime === "application/pdf") return "pdf";
			if (mime === "image/apng") return "apng";
		}
	}

	const clean = filenameOrDataUrl.split("?")[0].split("#")[0];
	const dotIndex = clean.lastIndexOf(".");
	if (dotIndex !== -1) {
		const ext = clean.slice(dotIndex).toLowerCase();
		if (isSupportedCoverFile(ext)) {
			return ext.replace(/^\./, "");
		}
	}
	return "png";
}

/**
 * Returns human-readable badge label for a cover format.
 */
export function getCoverFormatLabel(filenameOrExt: string): string {
	const ext = extractCoverExtension(filenameOrExt).toUpperCase();
	if (ext === "JPEG") return "JPG";
	if (ext === "TIF") return "TIFF";
	if (ext === "HEIF") return "HEIC";
	return ext;
}

/**
 * Determines if the browser can natively render this file format in an <img> element.
 * Formats like PSD, PSB, PDF, TIFF, HEIC, JXL may require a document badge / fallback preview.
 */
export function canRenderBrowserPreview(filenameOrDataUrl: string): boolean {
	if (!filenameOrDataUrl) return false;

	if (filenameOrDataUrl.startsWith("data:image/")) {
		// Non-standard browser image types in data URLs
		const lower = filenameOrDataUrl.slice(0, 50).toLowerCase();
		if (
			lower.includes("photoshop") ||
			lower.includes("pdf") ||
			lower.includes("tiff") ||
			lower.includes("heic") ||
			lower.includes("jxl")
		) {
			return false;
		}
		return true;
	}

	const ext = extractCoverExtension(filenameOrDataUrl).toLowerCase();
	const browserRenderable = ["jpg", "jpeg", "png", "webp", "avif", "gif", "apng", "svg"];
	return browserRenderable.includes(ext);
}
