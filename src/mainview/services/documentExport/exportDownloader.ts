import { slugifyTitle } from "@shared/domain/documentPaths";

/**
 * Creates a browser Blob from raw Uint8Array PDF bytes.
 */
export function createPdfBlob(pdfBytes: Uint8Array): Blob {
	return new Blob([pdfBytes as any], { type: "application/pdf" });
}

/**
 * Generates a clean, filesystem-safe filename for the exported PDF.
 */
export function generateDefaultExportFileName(
	projectName: string,
	ext: string = ".pdf",
): string {
	const safe = slugifyTitle(projectName || "novel");
	const dateStr = new Date().toISOString().slice(0, 10);
	return `${safe}_${dateStr}${ext}`;
}

/**
 * Triggers a client-side browser file download from a Blob.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
	if (typeof window === "undefined" || !window.document) return;

	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();

	setTimeout(() => {
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}, 1000);
}

/**
 * Opens a PDF Blob in a new browser window/tab for instant preview.
 */
export function openPdfBlobInNewTab(blob: Blob): void {
	if (typeof window === "undefined") return;
	const url = URL.createObjectURL(blob);
	window.open(url, "_blank");
}

/**
 * Converts a Uint8Array to base64 for Electrobun RPC transport.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = "";
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i] as number);
	}
	return btoa(binary);
}
