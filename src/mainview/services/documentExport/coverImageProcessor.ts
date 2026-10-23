/**
 * FictionClosure - Cover Image Processor for PDFKit Export.
 *
 * Provides browser and headless decoding of cover images into PDFKit-compatible
 * raw Uint8Array buffers (PNG/JPEG) without any reliance on Node's Buffer global.
 * In browser environments, converts arbitrary formats (WebP, AVIF, GIF, etc.)
 * to standard PNG byte streams via HTML5 Canvas.
 */

/**
 * Decodes a base64 data URL into a Uint8Array without relying on Node's Buffer.
 */
export function decodeDataUrlToUint8Array(dataUrl: string): Uint8Array | null {
	try {
		const base64Index = dataUrl.indexOf(";base64,");
		if (base64Index === -1) return null;
		const base64 = dataUrl.slice(base64Index + 8).replace(/\s/g, "");

		if (typeof atob === "function") {
			const binary = atob(base64);
			const len = binary.length;
			const bytes = new Uint8Array(len);
			for (let i = 0; i < len; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return bytes;
		}

		if (typeof Buffer !== "undefined") {
			return new Uint8Array(Buffer.from(base64, "base64"));
		}

		return null;
	} catch {
		return null;
	}
}

/**
 * Checks whether the given byte stream represents a native JPEG or PNG image.
 */
export function isPdfKitNativeImageFormat(bytes: Uint8Array): boolean {
	if (!bytes || bytes.length < 4) return false;
	const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
	const isPng =
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47;
	return isJpeg || isPng;
}

/**
 * Loads an image in the browser environment asynchronously.
 */
export function loadBrowserImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			if (typeof img.decode === "function") {
				img.decode().then(() => resolve(img)).catch(() => resolve(img));
			} else {
				resolve(img);
			}
		};
		img.onerror = () => reject(new Error("Image failed to load in browser"));
		img.src = src;

		if (img.complete && img.naturalWidth > 0) {
			if (typeof img.decode === "function") {
				img.decode().then(() => resolve(img)).catch(() => resolve(img));
			} else {
				resolve(img);
			}
		}
	});
}

/**
 * Converts a loaded browser Image element into standard PNG bytes via Canvas.
 */
export function convertBrowserImageToPng(
	img: HTMLImageElement,
): Uint8Array | null {
	try {
		const width = img.naturalWidth || img.width;
		const height = img.naturalHeight || img.height;
		if (!width || !height) return null;

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return null;

		ctx.drawImage(img, 0, 0);
		const pngDataUrl = canvas.toDataURL("image/png");
		return decodeDataUrlToUint8Array(pngDataUrl);
	} catch (err) {
		console.warn("Could not convert image to PNG via canvas:", err);
		return null;
	}
}

/**
 * Prepares a cover image for PDFKit embedding.
 * Handles format conversion in the browser and returns raw Uint8Array bytes.
 */
export async function prepareCoverImageBytes(
	coverUrl: string,
): Promise<{ bytes: Uint8Array; width?: number; height?: number } | null> {
	if (!coverUrl || typeof coverUrl !== "string") return null;

	// 1. Browser environment with DOM capabilities
	if (
		typeof window !== "undefined" &&
		typeof document !== "undefined" &&
		typeof Image !== "undefined"
	) {
		try {
			const img = await loadBrowserImage(coverUrl);
			const width = img.naturalWidth || img.width;
			const height = img.naturalHeight || img.height;
			const pngBytes = convertBrowserImageToPng(img);
			if (pngBytes && pngBytes.length > 0) {
				return { bytes: pngBytes, width, height };
			}
		} catch (err) {
			console.warn(
				"Browser image conversion failed, falling back to direct decode:",
				err,
			);
		}
	}

	// 2. Direct data URL decoding fallback (e.g. for headless test runner)
	if (coverUrl.startsWith("data:")) {
		const bytes = decodeDataUrlToUint8Array(coverUrl);
		if (bytes && isPdfKitNativeImageFormat(bytes)) {
			return { bytes };
		}
	}

	return null;
}
