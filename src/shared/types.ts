export type DocumentType = "manuscript" | "character" | "world" | "note";

export type DocumentStatus = "draft" | "in-progress" | "revised" | "completed";

export interface DocumentMeta {
	id: string;
	title: string;
	type: DocumentType;
	status: DocumentStatus;
	tags: string[];
	pov?: string;
	summary?: string;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface FictionDocument extends DocumentMeta {
	content: string;
}

export type SaveState = "saved" | "unsaved" | "saving" | "error";

export type ViewMode = "editor" | "split" | "preview";

export type ZenModeType = "none" | "zen" | "focus" | "czm";

export interface ProjectInfo {
	name: string;
	author: string;
	genre: string;
	targetWordCount: number;
	folderPath?: string;
	lastSaved?: string;
}

export interface ProjectManifestDoc extends DocumentMeta {
	relativePath: string;
}

export interface ProjectManifest {
	schemaVersion: number;
	name: string;
	author: string;
	genre: string;
	targetWordCount: number;
	updatedAt: string;
	documents: ProjectManifestDoc[];
}

export interface HistorySnapshot {
	content: string;
	timestamp: number;
	cursor?: number;
}

export interface DocumentHistoryStack {
	undo: HistorySnapshot[];
	redo: HistorySnapshot[];
}

export interface ProjectHistoryStacks {
	schemaVersion: number;
	updatedAt: string;
	targetWordCount: number;
	maxStackSize: number;
	stacks: Record<string, DocumentHistoryStack>;
}

export interface SaveProjectResult {
	success: boolean;
	savedAt: string;
	folderPath: string;
	error?: string;
}

export interface LoadProjectResult {
	success: boolean;
	project?: ProjectInfo;
	documents?: FictionDocument[];
	stacks?: ProjectHistoryStacks;
	error?: string;
}

export interface RecentProject {
	id: string;
	name: string;
	folderPath: string;
	lastOpened: string;
	lastSaved?: string;
	targetWordCount: number;
	wordCount: number;
	documentCount: number;
	manuscriptCount: number;
	characterCount: number;
	worldCount: number;
	notesCount: number;
	author?: string;
	genre?: string;
}

export interface ProjectAnalysisResult {
	isValid: boolean;
	status: "valid" | "warning" | "invalid";
	folderPath: string;
	manifestFound: boolean;
	manifestValid: boolean;
	projectName?: string;
	author?: string;
	genre?: string;
	targetWordCount?: number;
	documentsFound: number;
	manuscriptCount: number;
	characterCount: number;
	worldCount: number;
	notesCount: number;
	totalWordCount: number;
	hasStacks: boolean;
	hasGitignore: boolean;
	issues: string[];
	warnings: string[];
}

