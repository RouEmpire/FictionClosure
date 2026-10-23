/**
 * FictionClosure — Project Storage & Native IPC Service (Pure Functional & SOLID).
 *
 * Responsibilities:
 * - IPC transport orchestration with Electrobun Bun backend
 * - Local storage snapshot backup and crash recovery caching
 * - Native OS folder selection dialogs with browser fallbacks
 * - Zero OOP classes, explicit interfaces, no 'any' types
 */

import { Electroview } from "electrobun/view";
import type { FictionClosureRPCSchema } from "@shared/rpc-schema";
import type {
	FictionDocument,
	LoadProjectResult,
	ProjectFolder,
	ProjectHistoryStacks,
	ProjectInfo,
	SaveProjectResult,
} from "@shared/types";

export const LOCAL_STORAGE_LAST_FOLDER = "fictionclosure_last_project_folder";
export const LOCAL_STORAGE_WORKSPACE = "fictionclosure_workspace_state_v1";
export const LOCAL_STORAGE_STACKS = "fictionclosure_stacks_v1";
export const LOCAL_STORAGE_CRASH_CACHE = "fictionclosure_crash_cache_v1";

interface DirectoryPickerWindow {
	showDirectoryPicker?: () => Promise<{ name: string }>;
}

type RpcClient = ReturnType<typeof Electroview.defineRPC<FictionClosureRPCSchema>>;

let rpcInstance: RpcClient | null = null;

// ============================================================================
// 1. Environment & RPC Transport (Single Responsibility)
// ============================================================================

/**
 * Check if the application is running inside the native Electrobun desktop host.
 */
export function isDesktopApp(): boolean {
	if (typeof window === "undefined") return false;
	return typeof (window as { __electrobunWebviewId?: number }).__electrobunWebviewId !== "undefined";
}

/**
 * Initialize or get the cached Electrobun RPC client instance.
 */
export function getRpcTransport(): RpcClient | null {
	if (!rpcInstance && isDesktopApp()) {
		try {
			rpcInstance = Electroview.defineRPC<FictionClosureRPCSchema>({
				maxRequestTime: 180000,
				handlers: {
					requests: {},
					messages: {},
				},
			});
			new Electroview({ rpc: rpcInstance });
		} catch (err) {
			console.warn("Could not initialize Electrobun RPC transport:", err);
			rpcInstance = null;
		}
	}
	return rpcInstance;
}

// ============================================================================
// 2. Directory Picker (Open/Closed & Extensible Fallbacks)
// ============================================================================

export interface SelectFolderResult {
	canceled: boolean;
	folderPath?: string;
	error?: string;
}

/**
 * Open native OS directory picker dialog to select where to save the project.
 * Falls back to HTML5 Directory Picker and prompt() in webview/browser preview.
 */
export async function promptSelectFolder(
	startingFolder?: string,
): Promise<SelectFolderResult> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.selectProjectFolder({ startingFolder });
		} catch (err) {
			console.error("RPC selectProjectFolder failed:", err);
			return {
				canceled: true,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	// Browser fallback: Use HTML5 File System Access directory picker if supported
	if (typeof window !== "undefined") {
		const win = window as unknown as DirectoryPickerWindow;
		if (typeof win.showDirectoryPicker === "function") {
			try {
				const handle = await win.showDirectoryPicker();
				const folderName = handle.name;
				return { canceled: false, folderPath: `~/FictionProjects/${folderName}` };
			} catch (err) {
				if ((err as Error).name === "AbortError") {
					return { canceled: true };
				}
			}
		}

		// Browser prompt fallback
		const inputPath = window.prompt(
			"Enter destination folder path for this project:",
			"~/FictionProjects/TheWhisperingTide",
		);
		if (!inputPath || inputPath.trim() === "") {
			return { canceled: true };
		}
		return { canceled: false, folderPath: inputPath.trim() };
	}

	return { canceled: true, error: "Environment does not support user prompts" };
}

// ============================================================================
// 3. Project Persistence (Save / Load / Backup)
// ============================================================================

/**
 * Backs up active workspace state and project data to localStorage.
 */
function backupWorkspaceToLocalStorage(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
	stacks?: ProjectHistoryStacks,
	folders?: ProjectFolder[],
): void {
	if (typeof localStorage === "undefined") return;
	try {
		localStorage.setItem(
			LOCAL_STORAGE_WORKSPACE,
			JSON.stringify({
				project: { ...project, folderPath, folders: folders || project.folders },
				documents,
				folders: folders || project.folders,
				activeDocId: documents[0]?.id ?? null,
			}),
		);
		localStorage.setItem(LOCAL_STORAGE_LAST_FOLDER, folderPath);
		if (stacks) {
			localStorage.setItem(LOCAL_STORAGE_STACKS, JSON.stringify(stacks));
		}
	} catch (err) {
		console.warn("Could not cache workspace state to localStorage:", err);
	}
}

/**
 * Save project files to the specified folder via native RPC or local backup.
 */
export async function saveProject(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
	stacks?: ProjectHistoryStacks,
	folders?: ProjectFolder[],
): Promise<SaveProjectResult> {
	// Always backup to browser storage
	backupWorkspaceToLocalStorage(folderPath, project, documents, stacks, folders);

	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.saveProjectToFolder({
				folderPath,
				project,
				documents,
				folders: folders || project.folders,
				stacks,
			});
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			return {
				success: false,
				savedAt: new Date().toISOString(),
				folderPath,
				error: errorMsg,
			};
		}
	}

	// Fallback when running without desktop RPC host
	return {
		success: true,
		savedAt: new Date().toISOString(),
		folderPath,
	};
}

/**
 * Load project files from folder via native RPC with browser localStorage fallback.
 */
export async function loadProject(folderPath: string): Promise<LoadProjectResult> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.loadProjectFromFolder({ folderPath });
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	// Browser fallback from cached workspace
	if (typeof localStorage !== "undefined") {
		try {
			const cached = localStorage.getItem(LOCAL_STORAGE_WORKSPACE);
			const cachedStacks = localStorage.getItem(LOCAL_STORAGE_STACKS);
			if (cached) {
				const parsed = JSON.parse(cached);
				return {
					success: true,
					project: parsed.project,
					documents: parsed.documents,
					folders: parsed.folders || parsed.project?.folders,
					stacks: cachedStacks ? JSON.parse(cachedStacks) : undefined,
				};
			}
		} catch {
			// ignore fallback parse error
		}
	}

	return {
		success: false,
		error: "Desktop host is not connected",
	};
}

// ============================================================================
// 4. Remembered Project Folder
// ============================================================================

/**
 * Retrieve the remembered project folder path.
 */
export async function getRememberedFolder(): Promise<string | null> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			const res = await rpc.request.getLastProjectFolder();
			if (res.folderPath) {
				return res.folderPath;
			}
		} catch {
			// fall back to localStorage
		}
	}

	if (typeof localStorage !== "undefined") {
		return localStorage.getItem(LOCAL_STORAGE_LAST_FOLDER);
	}
	return null;
}

/**
 * Persist the remembered project folder path.
 */
export async function setRememberedFolder(folderPath: string): Promise<void> {
	if (typeof localStorage !== "undefined") {
		localStorage.setItem(LOCAL_STORAGE_LAST_FOLDER, folderPath);
	}

	const rpc = getRpcTransport();
	if (rpc) {
		try {
			await rpc.request.setLastProjectFolder({ folderPath });
		} catch {
			// ignore
		}
	}
}

// ============================================================================
// 5. Crash Recovery Cache
// ============================================================================

/**
 * Persists the uncommitted writing draft to .fictionclosure/cache/unsaved-recovery.json.
 */
export async function saveCrashCache(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
): Promise<{ success: boolean; error?: string }> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.saveCrashCache({ folderPath, project, documents });
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}

	// Fallback to localStorage in webview/browser mode
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(
				LOCAL_STORAGE_CRASH_CACHE,
				JSON.stringify({
					hasUnsavedChanges: true,
					cachedAt: new Date().toISOString(),
					projectName: project.name,
					documents,
				}),
			);
		}
		return { success: true };
	} catch {
		return { success: false };
	}
}

/**
 * Clears the unsaved crash recovery cache (after a clean manual save).
 */
export async function clearCrashCache(
	folderPath: string,
): Promise<{ success: boolean; error?: string }> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.clearCrashCache({ folderPath });
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem(LOCAL_STORAGE_CRASH_CACHE);
		}
		return { success: true };
	} catch {
		return { success: false };
	}
}

// ============================================================================
// 6. PDF Export Storage
// ============================================================================

/**
 * Saves an exported PDF file to the project's `exports/` directory on disk.
 */
export async function savePdfToDisk(
	folderPath: string,
	fileName: string,
	pdfBase64: string,
): Promise<{ success: boolean; filePath?: string; error?: string }> {
	const rpc = getRpcTransport();
	if (rpc) {
		try {
			return await rpc.request.exportPdfFile({ folderPath, fileName, pdfBase64 });
		} catch (err) {
			return {
				success: false,
				error: err instanceof Error ? err.message : String(err),
			};
		}
	}
	return { success: false, error: "Native file export is available in desktop app" };
}
