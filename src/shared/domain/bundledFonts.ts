/**
 * FictionClosure - Bundled Fonts Subsystem.
 *
 * Reads bundled font metadata from `src/media/Font/config.json`, resolves asset URLs
 * for Vite/browser and filesystem paths for Node/Bun, dynamically registers @font-face
 * styles in the DOM for the Editor, and provides binary font data for PDFKit export.
 */

import rawFontConfig from "../../media/Font/config.json";

export interface BundledFontConfigEntry {
	name: string;
	path: string;
	id?: string;
}

export interface BundledFont {
	id: string;
	name: string;
	path: string;
	fileName: string;
	fontFamilyCss: string;
	format: "truetype" | "opentype";
	url?: string;
}

// Vite glob import of all font assets in src/media/Font/ inlined as base64 Data URLs
let fontUrlMap: Record<string, string> = {};
try {
	fontUrlMap = import.meta.glob("../../media/Font/*.{ttf,otf,woff,woff2}", {
		query: "?inline",
		import: "default",
		eager: true,
	});
} catch {
	fontUrlMap = {};
}

/**
 * Creates a clean slug ID from a font name.
 */
export function slugifyFontId(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Normalizes a relative path to just the filename (e.g. "./Prompt.ttf" -> "Prompt.ttf").
 */
export function extractFontFileName(fontPath: string): string {
	const cleaned = fontPath.replace(/^\.\//, "").trim();
	const parts = cleaned.split("/");
	return parts[parts.length - 1] || cleaned;
}

/**
 * Matches a font filename against Vite's glob import map.
 */
function resolveUrlFromGlobMap(fileName: string): string | undefined {
	const target = fileName.toLowerCase();
	for (const [key, url] of Object.entries(fontUrlMap)) {
		const keyFileName = key.split("/").pop()?.toLowerCase();
		if (keyFileName === target || decodeURIComponent(keyFileName || "") === target) {
			return url;
		}
	}
	return undefined;
}

/**
 * Derives a recommended CSS font-family fallback stack.
 */
function deriveCssFontStack(fontName: string): string {
	const lower = fontName.toLowerCase();
	if (lower.includes("mono") || lower.includes("code")) {
		return `'${fontName}', monospace`;
	}
	if (lower.includes("serif") || lower.includes("sarabun")) {
		return `'${fontName}', 'Times New Roman', serif`;
	}
	return `'${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
}

/**
 * Parses raw JSON configuration into normalized BundledFont objects.
 */
export function parseBundledFontConfigs(configData: unknown): BundledFont[] {
	if (!configData || typeof configData !== "object") {
		return [];
	}

	let entries: BundledFontConfigEntry[] = [];
	if (Array.isArray(configData)) {
		entries = configData as BundledFontConfigEntry[];
	} else if ("fonts" in configData && Array.isArray((configData as { fonts: unknown }).fonts)) {
		entries = (configData as { fonts: BundledFontConfigEntry[] }).fonts;
	}

	return entries
		.filter((e) => Boolean(e && typeof e.name === "string" && typeof e.path === "string"))
		.map((e) => {
			const fileName = extractFontFileName(e.path);
			const ext = fileName.split(".").pop()?.toLowerCase();
			const format: "truetype" | "opentype" = ext === "otf" ? "opentype" : "truetype";
			const id = e.id || slugifyFontId(e.name);
			const url = resolveUrlFromGlobMap(fileName);
			const fontFamilyCss = deriveCssFontStack(e.name);

			return {
				id,
				name: e.name.trim(),
				path: e.path.trim(),
				fileName,
				fontFamilyCss,
				format,
				url,
			};
		});
}

/**
 * Singleton array of all bundled fonts currently configured in config.json.
 */
export const BUNDLED_FONTS: BundledFont[] = parseBundledFontConfigs(rawFontConfig);

/**
 * Returns all configured bundled fonts.
 */
export function getBundledFonts(): BundledFont[] {
	return BUNDLED_FONTS;
}

/**
 * Finds a bundled font by ID, Name, or Filename.
 */
export function findBundledFont(idOrName: string): BundledFont | undefined {
	if (!idOrName) return undefined;
	const lower = idOrName.toLowerCase().trim();
	const cleanName = idOrName.replace(/^['"]|['"]$/g, "").trim().toLowerCase();
	return BUNDLED_FONTS.find(
		(f) =>
			f.id.toLowerCase() === lower ||
			f.name.toLowerCase() === lower ||
			f.name.toLowerCase() === cleanName ||
			f.fileName.toLowerCase() === lower,
	);
}

/**
 * Dynamically registers CSS @font-face rules in document.head so the Editor
 * and UI can render text with the bundled fonts.
 */
export function ensureBundledFontsRegisteredInCss(): void {
	if (typeof document === "undefined") return;

	const styleId = "fictionclosure-bundled-fonts";
	if (document.getElementById(styleId)) return;

	let cssRules = "";
	for (const font of BUNDLED_FONTS) {
		const fontUrl = font.url || `./src/media/Font/${font.fileName}`;
		cssRules += `
@font-face {
  font-family: '${font.name}';
  src: url('${fontUrl}') format('${font.format}');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
`;
	}

	const styleEl = document.createElement("style");
	styleEl.id = styleId;
	styleEl.textContent = cssRules;
	document.head.appendChild(styleEl);
}

/**
 * Decodes a base64 Data URL (e.g. data:font/ttf;base64,...) to a Uint8Array.
 */
export function decodeDataUrlToUint8Array(dataUrl: string): Uint8Array {
	const comma = dataUrl.indexOf(",");
	const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
	const binary = atob(base64);
	const len = binary.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

/**
 * Loads the binary Uint8Array bytes of a bundled font for PDFKit embedding.
 * Supports inlined Data URLs, browser fetch, and headless Bun/Node filesystem reads.
 */
export async function loadBundledFontBytes(
	fontOrId: BundledFont | string,
): Promise<Uint8Array | null> {
	const font = typeof fontOrId === "string" ? findBundledFont(fontOrId) : fontOrId;
	if (!font) return null;

	// 1. Inlined Data URL (from Vite ?inline bundle or base64)
	if (font.url && font.url.startsWith("data:")) {
		try {
			return decodeDataUrlToUint8Array(font.url);
		} catch (err) {
			console.warn(`Failed to decode inlined font "${font.name}":`, err);
		}
	}

	// 2. Browser environment with fetch
	if (typeof window !== "undefined" && typeof fetch === "function" && font.url) {
		try {
			const res = await fetch(font.url);
			if (res.ok) {
				const buf = await res.arrayBuffer();
				return new Uint8Array(buf);
			}
		} catch (err) {
			console.warn(`Failed to fetch bundled font "${font.name}" via URL:`, err);
		}
	}

	// 3. Headless Bun/Node environment fallback
	try {
		// In Bun test runner or cottontail
		const bunGlobal = (globalThis as unknown as { Bun?: { file: (p: string) => { arrayBuffer: () => Promise<ArrayBuffer> } } }).Bun;
		if (bunGlobal?.file) {
			const filePath = `src/media/Font/${font.fileName}`;
			const buf = await bunGlobal.file(filePath).arrayBuffer();
			return new Uint8Array(buf);
		}

		if (typeof process !== "undefined" && typeof require === "function") {
			const fs = require("node:fs");
			const path = require("node:path");
			const fontPath = path.resolve(process.cwd(), "src/media/Font", font.fileName);
			if (fs.existsSync(fontPath)) {
				const buf = fs.readFileSync(fontPath);
				return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
			}
		}
	} catch (err) {
		console.warn(`Failed to read bundled font "${font.name}" from disk:`, err);
	}

	return null;
}
