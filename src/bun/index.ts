import type {
	FictionDocument,
	ProjectFolder,
	ProjectHistoryStacks,
	ProjectInfo,
} from "@shared/types";
import { BrowserWindow, Updater, BrowserView, Utils } from "electrobun/main";
import * as os from "node:os";
import type { FictionClosureRPCSchema } from "../shared/rpc-schema";
import {
	clearCrashCache,
	getLastProjectFolder,
	loadProjectFromFolder,
	saveCrashCache,
	saveProjectToFolder,
	setLastProjectFolder,
} from "./project-storage";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

// Check if Vite dev server is running for HMR
async function getMainViewUrl(): Promise<string> {
	const channel = await Updater.localInfo.channel();
	if (channel === "dev") {
		try {
			await fetch(DEV_SERVER_URL, { method: "HEAD" });
			console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
			return DEV_SERVER_URL;
		} catch {
			console.log(
				"Vite dev server not running. Run 'hutch run dev:hmr' for HMR support.",
			);
		}
	}
	return "views://mainview/index.html";
}

// Define RPC for communication between Bun main process and webview
const rpc = BrowserView.defineRPC<FictionClosureRPCSchema>({
	maxRequestTime: 180000, // allow sufficient time for user interaction in file dialog
	handlers: {
		requests: {
			selectProjectFolder: async (params?: { startingFolder?: string }) => {
				try {
					const starting = params?.startingFolder || getLastProjectFolder() || os.homedir();
					const selectedPaths = await Utils.openFileDialog({
						startingFolder: starting,
						canChooseFiles: false,
						canChooseDirectory: true,
						allowsMultipleSelection: false,
					});

					if (!selectedPaths || selectedPaths.length === 0) {
						return { canceled: true };
					}

					const chosenFolder = selectedPaths[0];
					if (chosenFolder) {
						setLastProjectFolder(chosenFolder);
					}

					return { canceled: false, folderPath: chosenFolder };
				} catch (err) {
					console.error("selectProjectFolder error:", err);
					return {
						canceled: true,
						error: err instanceof Error ? err.message : String(err),
					};
				}
			},

			saveProjectToFolder: async (params: {
				folderPath: string;
				project: ProjectInfo;
				documents: FictionDocument[];
				folders?: ProjectFolder[];
				stacks?: ProjectHistoryStacks;
			}) => {
				return await saveProjectToFolder(
					params.folderPath,
					params.project,
					params.documents,
					params.stacks,
					undefined,
					params.folders,
				);
			},

			loadProjectFromFolder: async (params: { folderPath: string }) => {
				return await loadProjectFromFolder(params.folderPath);
			},

			getLastProjectFolder: async () => {
				return { folderPath: getLastProjectFolder() };
			},

			setLastProjectFolder: async (params: { folderPath: string }) => {
				setLastProjectFolder(params.folderPath);
				return { success: true };
			},

			saveCrashCache: async (params: {
				folderPath: string;
				project: ProjectInfo;
				documents: FictionDocument[];
			}) => {
				return saveCrashCache(params.folderPath, params.project, params.documents);
			},

			clearCrashCache: async (params: { folderPath: string }) => {
				return clearCrashCache(params.folderPath);
			},
		},
		messages: {},
	},
});

// Create the main application window
const url = await getMainViewUrl();

export const mainWindow = new BrowserWindow({
	title: "FictionClosure",
	url,
	frame: {
		width: 1200,
		height: 800,
		x: 100,
		y: 100,
	},
	rpc,
});

console.log("FictionClosure desktop process started!");
