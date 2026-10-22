export type LogTag =
	| "BOOT"
	| "MOUNT"
	| "MANIFEST"
	| "SCAN"
	| "GRAPH"
	| "STATE"
	| "VERIFY"
	| "READY"
	| "ERROR";

export interface LogEntry {
	id: string;
	time: string;
	tag: LogTag;
	text: string;
}

export interface ProjectLoadingStats {
	docCount: number;
	wordCount: number;
}

export interface ProjectLoadingScreenProps {
	projectName: string;
	folderPath: string;
	isLoaded: boolean;
	loadError?: string | null;
	stats?: ProjectLoadingStats | null;
	onDone: () => void;
	onCancel?: () => void;
}
