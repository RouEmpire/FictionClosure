import type { FictionDocument, ViewMode } from "@shared/types";

export interface PaletteAction {
	id: string;
	type: "action";
	title: string;
	subtitle: string;
	icon: string;
	execute: () => void;
}

export interface PaletteDoc {
	id: string;
	type: "document";
	doc: FictionDocument;
}

export type PaletteItem = PaletteAction | PaletteDoc;

export interface PaletteActionHandlers {
	onNewDoc: (type?: "manuscript" | "character" | "world" | "note") => void;
	onSave: () => void;
	onSetViewMode: (mode: ViewMode) => void;
	onChangeFolder?: () => void;
	onOpenSettings?: () => void;
	onOpenProjectSettings?: () => void;
}

export interface CommandPaletteProps {
	isOpen: boolean;
	documents: FictionDocument[];
	onClose: () => void;
	onSelectDoc: (id: string) => void;
	onNewDoc: (type?: "manuscript" | "character" | "world" | "note") => void;
	onSetViewMode: (mode: ViewMode) => void;
	onSave: () => void;
	onChangeFolder?: () => void;
	onOpenSettings?: () => void;
	onOpenProjectSettings?: () => void;
}
