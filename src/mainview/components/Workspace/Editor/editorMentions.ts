import type { FictionDocument, ProjectFolder } from "../../../../shared/types";

export interface MentionItem {
	kind: "folder" | "doc";
	id: string;
	name: string;
	subtitle: string;
	icon: string;
	badge: string;
}

export function buildMentionCandidates(
	query: string,
	folders: ProjectFolder[],
	allDocuments: FictionDocument[],
	currentDocId: string,
): MentionItem[] {
	const q = query.trim().toLowerCase();
	const results: MentionItem[] = [];

	for (const f of folders) {
		if (!q || f.name.toLowerCase().includes(q) || (f.tags || []).some((t) => t.toLowerCase().includes(q))) {
			results.push({
				kind: "folder",
				id: f.id,
				name: f.name,
				subtitle: f.note || f.relativePath,
				icon: f.icon || "fa-solid fa-folder",
				badge: "Folder",
			});
		}
	}

	for (const d of allDocuments) {
		if (d.id === currentDocId) continue;
		if (!q || d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))) {
			results.push({
				kind: "doc",
				id: d.id,
				name: d.title,
				subtitle: d.summary || `${d.type} document`,
				icon: "fa-solid fa-file-lines",
				badge: d.type,
			});
		}
	}

	return results.slice(0, 8);
}

export function detectMentionQuery(textarea: HTMLTextAreaElement): string | null {
	const val = textarea.value;
	const pos = textarea.selectionStart;
	const textBefore = val.slice(0, pos);
	const match = /(?:^|[^\\])\[\[([^\]\n]*)$/.exec(textBefore);
	return match ? (match[1] ?? "") : null;
}

export function computeMentionReplacement(
	textarea: HTMLTextAreaElement,
	itemName: string,
): { newContent: string; newCursor: number } | null {
	const val = textarea.value;
	const cursorPos = textarea.selectionStart;
	const textBefore = val.slice(0, cursorPos);
	const match = /(?:^|[^\\])\[\[([^\]\n]*)$/.exec(textBefore);
	if (!match) return null;

	const openBracketIdx = textBefore.lastIndexOf("[[");
	const beforeBracket = val.slice(0, openBracketIdx);
	const afterCursor = val.slice(cursorPos);
	const cleanAfter = afterCursor.startsWith("]]") ? afterCursor.slice(2) : afterCursor;
	const replacement = `[[${itemName}]]`;
	const newContent = beforeBracket + replacement + cleanAfter;
	const newCursor = beforeBracket.length + replacement.length;

	return { newContent, newCursor };
}
