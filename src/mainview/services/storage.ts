import { Electroview } from "electrobun/view";
import type { FictionClosureRPCSchema } from "../../shared/rpc-schema";
import type {
	FictionDocument,
	LoadProjectResult,
	ProjectHistoryStacks,
	ProjectInfo,
	SaveProjectResult,
} from "../../shared/types";

const LOCAL_STORAGE_LAST_FOLDER = "fictionclosure_last_project_folder";
const LOCAL_STORAGE_WORKSPACE = "fictionclosure_workspace_state_v1";
export const LOCAL_STORAGE_STACKS = "fictionclosure_stacks_v1";

let rpcInstance: ReturnType<typeof Electroview.defineRPC<FictionClosureRPCSchema>> | null = null;

/**
 * Check if the application is running inside the native Electrobun desktop host.
 */
export function isDesktopApp(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof (window as unknown as { __electrobunWebviewId?: unknown }).__electrobunWebviewId !== "undefined"
	);
}

/**
 * Initialize or get the Electrobun RPC client.
 */
function getRpc() {
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

/**
 * Open native OS directory picker dialog to select where to save the project.
 */
export async function promptSelectFolder(startingFolder?: string): Promise<{ canceled: boolean; folderPath?: string; error?: string }> {
	const rpc = getRpc();
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

	// Browser fallback: Use HTML5 directory picker if supported, or return fallback
	if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
		try {
			// @ts-expect-error - File System Access API
			const handle = await window.showDirectoryPicker();
			const folderName = handle.name;
			return { canceled: false, folderPath: `~/FictionProjects/${folderName}` };
		} catch (err) {
			if ((err as Error).name === "AbortError") {
				return { canceled: true };
			}
		}
	}

	// Browser prompt fallback
	const inputPath = window.prompt("Enter destination folder path for this project:", "~/FictionProjects/TheWhisperingTide");
	if (!inputPath || inputPath.trim() === "") {
		return { canceled: true };
	}
	return { canceled: false, folderPath: inputPath.trim() };
}

/**
 * Save project files to the specified folder.
 */
export async function saveProject(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
	stacks?: ProjectHistoryStacks,
): Promise<SaveProjectResult> {
	// Always backup to browser storage
	try {
		localStorage.setItem(
			LOCAL_STORAGE_WORKSPACE,
			JSON.stringify({
				project: { ...project, folderPath },
				documents,
				activeDocId: documents[0]?.id ?? null,
			}),
		);
		localStorage.setItem(LOCAL_STORAGE_LAST_FOLDER, folderPath);
		if (stacks) {
			localStorage.setItem(LOCAL_STORAGE_STACKS, JSON.stringify(stacks));
		}
	} catch (err) {
		console.warn("Could not cache to localStorage:", err);
	}

	const rpc = getRpc();
	if (rpc) {
		try {
			const res = await rpc.request.saveProjectToFolder({
				folderPath,
				project,
				documents,
				stacks,
			});
			return res;
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

	// Fallback when running without Bun desktop host
	return {
		success: true,
		savedAt: new Date().toISOString(),
		folderPath,
	};
}

/**
 * Load project files from folder.
 */
export async function loadProject(folderPath: string): Promise<LoadProjectResult> {
	const rpc = getRpc();
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

	// Browser fallback
	try {
		const cached = localStorage.getItem(LOCAL_STORAGE_WORKSPACE);
		const cachedStacks = localStorage.getItem(LOCAL_STORAGE_STACKS);
		if (cached) {
			const parsed = JSON.parse(cached);
			return {
				success: true,
				project: parsed.project,
				documents: parsed.documents,
				stacks: cachedStacks ? JSON.parse(cachedStacks) : undefined,
			};
		}
	} catch {
		// ignore
	}

	return {
		success: false,
		error: "Desktop host is not connected",
	};
}

/**
 * Retrieve the remembered project folder path.
 */
export async function getRememberedFolder(): Promise<string | null> {
	const rpc = getRpc();
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

	const rpc = getRpc();
	if (rpc) {
		try {
			await rpc.request.setLastProjectFolder({ folderPath });
		} catch {
			// ignore
		}
	}
}

/**
 * Persists the uncommitted writing draft to .fictionclosure/cache/unsaved-recovery.json.
 */
export async function saveCrashCache(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
): Promise<{ success: boolean; error?: string }> {
	const rpc = getRpc();
	if (rpc) {
		try {
			return await rpc.request.saveCrashCache({ folderPath, project, documents });
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : String(err) };
		}
	}
	// Fallback to localStorage in webview/browser mode
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(
				"fictionclosure_crash_cache_v1",
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
export async function clearCrashCache(folderPath: string): Promise<{ success: boolean; error?: string }> {
	const rpc = getRpc();
	if (rpc) {
		try {
			return await rpc.request.clearCrashCache({ folderPath });
		} catch (err) {
			return { success: false, error: err instanceof Error ? err.message : String(err) };
		}
	}
	try {
		if (typeof localStorage !== "undefined") {
			localStorage.removeItem("fictionclosure_crash_cache_v1");
		}
		return { success: true };
	} catch {
		return { success: false };
	}
}
