import type { FictionDocument } from "@shared/types";
import type {
	PaletteAction,
	PaletteActionHandlers,
	PaletteDoc,
	PaletteItem,
} from "./types";

export function buildStaticActions(
	handlers: PaletteActionHandlers,
): PaletteAction[] {
	return [
		{
			id: "act-new-ch",
			type: "action",
			title: "Create New Chapter",
			subtitle: "Add a new manuscript chapter",
			icon: "fa-solid fa-book-open",
			execute: () => handlers.onNewDoc("manuscript"),
		},
		{
			id: "act-new-char",
			type: "action",
			title: "Create Character Sheet",
			subtitle: "Add a new character profile",
			icon: "fa-solid fa-user",
			execute: () => handlers.onNewDoc("character"),
		},
		{
			id: "act-new-world",
			type: "action",
			title: "Create Worldbuilding Note",
			subtitle: "Add setting, magic, or lore entry",
			icon: "fa-solid fa-map",
			execute: () => handlers.onNewDoc("world"),
		},
		{
			id: "act-save",
			type: "action",
			title: "Save Project",
			subtitle: "Commit changes to disk (Ctrl+S)",
			icon: "fa-solid fa-floppy-disk",
			execute: () => handlers.onSave(),
		},
		{
			id: "act-change-folder",
			type: "action",
			title: "Change Project Save Folder...",
			subtitle: "Select where on disk to store project Markdown files",
			icon: "fa-solid fa-folder-open",
			execute: () => handlers.onChangeFolder?.(),
		},
		{
			id: "act-settings",
			type: "action",
			title: "Preferences & Settings",
			subtitle: "Customize editor font family and typography (Ctrl+P)",
			icon: "fa-solid fa-gear",
			execute: () => handlers.onOpenSettings?.(),
		},
		{
			id: "act-project-settings",
			type: "action",
			title: "Project Settings...",
			subtitle: "Edit project name, author, genre, target word count, cover, and README",
			icon: "fa-solid fa-sliders",
			execute: () => handlers.onOpenProjectSettings?.(),
		},
		{
			id: "act-split",
			type: "action",
			title: "View: Split Mode",
			subtitle: "Editor and live preview side-by-side",
			icon: "fa-solid fa-table-columns",
			execute: () => handlers.onSetViewMode("split"),
		},
		{
			id: "act-edit",
			type: "action",
			title: "View: Editor Only",
			subtitle: "Distraction-free markdown writing",
			icon: "fa-solid fa-pen-to-square",
			execute: () => handlers.onSetViewMode("editor"),
		},
		{
			id: "act-read",
			type: "action",
			title: "View: Preview Only",
			subtitle: "Clean formatted reading mode",
			icon: "fa-solid fa-eye",
			execute: () => handlers.onSetViewMode("preview"),
		},
	];
}

export function filterPaletteItems(
	query: string,
	documents: FictionDocument[],
	staticActions: PaletteAction[],
): PaletteItem[] {
	const q = query.trim().toLowerCase();
	if (!q) {
		// Show documents first, then actions
		const docs: PaletteDoc[] = documents.map((d) => ({
			id: d.id,
			type: "document",
			doc: d,
		}));
		return [...docs, ...staticActions];
	}

	const matchedDocs: PaletteDoc[] = documents
		.filter(
			(d) =>
				d.title.toLowerCase().includes(q) ||
				d.tags.some((t) => t.toLowerCase().includes(q)) ||
				d.content.toLowerCase().includes(q),
		)
		.map((d) => ({ id: d.id, type: "document", doc: d }));

	const matchedActions: PaletteAction[] = staticActions.filter(
		(a) =>
			a.title.toLowerCase().includes(q) ||
			a.subtitle.toLowerCase().includes(q),
	);

	return [...matchedDocs, ...matchedActions];
}

export function getDocIcon(type: string): string {
	switch (type) {
		case "manuscript":
			return "fa-solid fa-book-open";
		case "character":
			return "fa-solid fa-user";
		case "plot":
			return "fa-solid fa-chart-line";
		case "world":
			return "fa-solid fa-map";
		default:
			return "fa-solid fa-file-lines";
	}
}

export function getDocSnippet(doc: FictionDocument): string {
	return (
		doc.summary ||
		doc.content.slice(0, 90).replace(/^[#\s]+/, "")
	);
}
