export type DocumentType = "manuscript" | "character" | "world" | "note" | "plot";

export type DocumentStatus = "draft" | "in-progress" | "revised" | "completed";

export interface DirectoryMeta {
	id: string;
	name: string;
	icon?: string;
	tags: string[];
	note?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ProjectFolder extends DirectoryMeta {
	parentId?: string | null;
	relativePath: string;
	type?: DocumentType;
	order?: number;
}

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
	folderId?: string | null;
	relativePath?: string;
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
	created?: string;
	folders?: ProjectFolder[];
	coverImage?: string;
	covers?: string[];
	readme?: string;
	description?: string;
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
	folders?: ProjectFolder[];
	coverImage?: string;
	covers?: string[];
	description?: string;
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
	folders?: ProjectFolder[];
	stacks?: ProjectHistoryStacks;
	recoveryData?: CrashRecoveryData | null;
	error?: string;
}

export interface CachedDocumentSnapshot {
	id: string;
	title: string;
	type: DocumentType;
	content: string;
	wordCount: number;
	lastModified: string;
}

export interface CrashRecoveryData {
	hasUnsavedChanges: boolean;
	cachedAt: string;
	projectName: string;
	documents: CachedDocumentSnapshot[];
}

export interface WorkspaceState {
	schemaVersion: number;
	lastActiveDocumentId?: string;
	viewMode?: ViewMode;
	isSidebarOpen?: boolean;
	showInspector?: boolean;
	zenMode?: ZenModeType;
	editorFont?: string;
	typography?: import("./domain/typography").EditorTypographySettings;
	updatedAt: string;
}

export type {
	TextRenderingMode,
	TextJustifyMode,
	TextAutospaceMode,
	EditorTypographySettings,
	FontFeatureTag,
} from "./domain/typography";

export interface SessionState {
	schemaVersion: number;
	lastOpenedAt: string;
	lastSavedAt: string;
	totalWords: number;
	appVersion: string;
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
	plotCount?: number;
	author?: string;
	genre?: string;
	coverImage?: string;
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
	plotCount?: number;
	totalWordCount: number;
	hasStacks: boolean;
	hasGitignore: boolean;
	hasGitRepo?: boolean;
	hasFictionClosureFolder?: boolean;
	issues: string[];
	warnings: string[];
}

