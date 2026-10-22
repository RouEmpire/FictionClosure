import type { LogEntry, LogTag } from "./types";

export function formatTimestamp(d: Date): string {
	const m = String(d.getMinutes()).padStart(2, "0");
	const s = String(d.getSeconds()).padStart(2, "0");
	const ms = String(d.getMilliseconds()).padStart(3, "0");
	return `${m}:${s}.${ms}`;
}

export function createLogEntry(tag: LogTag, text: string): LogEntry {
	return {
		id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
		time: formatTimestamp(new Date()),
		tag,
		text,
	};
}

export interface BootStep {
	tag: LogTag;
	getMessage: (projectName: string, folderPath: string) => string;
	progress: number;
	delayMs: number;
}

export const SIMULATED_BOOT_STEPS: BootStep[] = [
	{
		tag: "MOUNT",
		getMessage: (_, folderPath) => `Locking project path: "${folderPath}"... [OK]`,
		progress: 38,
		delayMs: 120,
	},
	{
		tag: "MANIFEST",
		getMessage: (projectName) => `Validating fictionclosure.json manifest for "${projectName}"... [OK]`,
		progress: 58,
		delayMs: 240,
	},
	{
		tag: "SCAN",
		getMessage: () => "Discovering chapters, character sheets, and lore documents... [OK]",
		progress: 74,
		delayMs: 360,
	},
	{
		tag: "GRAPH",
		getMessage: () => "Indexing wikilinks [[...]], metadata tags, and word counts... [OK]",
		progress: 88,
		delayMs: 480,
	},
	{
		tag: "STATE",
		getMessage: () => "Restoring session undo/redo history buffers... [OK]",
		progress: 94,
		delayMs: 600,
	},
];
