import type { DocumentType } from "../../shared/types";

/**
 * Safe filename slugifier that removes filesystem-hostile characters.
 */
export function slugifyTitle(title: string): string {
	const cleaned = title
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");

	return cleaned || "untitled";
}

/**
 * Computes the canonical relative file path for a FictionClosure document.
 * e.g. "manuscript/01_chapter-1.md" or "characters/elena-vance.md"
 */
export function getDocumentRelativePath(doc: {
	type: DocumentType;
	title: string;
	order?: number;
	relativePath?: string;
}): string {
	if (doc.relativePath && doc.relativePath.trim() !== "") {
		return doc.relativePath;
	}

	const safeSlug = slugifyTitle(doc.title);
	if (doc.type === "manuscript") {
		const prefix = String(doc.order ?? 1).padStart(2, "0");
		return `manuscript/${prefix}_${safeSlug}.md`;
	} else if (doc.type === "character") {
		return `characters/${safeSlug}.md`;
	} else if (doc.type === "world") {
		return `world/${safeSlug}.md`;
	} else {
		return `notes/${safeSlug}.md`;
	}
}

/**
 * Computes the system-level absolute path for a document, using the project root folder.
 * Supports Unix (/home/...) and Windows (C:\...) style root paths.
 */
export function getDocumentSystemPath(
	doc: { type: DocumentType; title: string; order?: number; relativePath?: string },
	folderPath?: string,
): string {
	const rel = getDocumentRelativePath(doc);
	if (!folderPath || folderPath.trim() === "") {
		return rel;
	}

	const cleanFolder = folderPath.replace(/[/\\]+$/, "");
	const isWindows = /^[a-zA-Z]:[/\\]/.test(cleanFolder) || cleanFolder.includes("\\");
	const separator = isWindows ? "\\" : "/";
	const formattedRel = isWindows ? rel.replace(/\//g, "\\") : rel;

	return `${cleanFolder}${separator}${formattedRel}`;
}

/**
 * Copies text to the user's clipboard safely across desktop and webview runtimes.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// Fall through to fallback
	}

	try {
		if (typeof document !== "undefined") {
			const textarea = document.createElement("textarea");
			textarea.value = text;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			textarea.style.left = "-9999px";
			document.body.appendChild(textarea);
			textarea.select();
			const success = document.execCommand("copy");
			document.body.removeChild(textarea);
			return success;
		}
	} catch (err) {
		console.warn("Clipboard copy fallback failed:", err);
	}

	return false;
}
