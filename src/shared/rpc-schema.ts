import type { RPCSchema } from "electrobun";
import type {
	FictionDocument,
	LoadProjectResult,
	ProjectHistoryStacks,
	ProjectInfo,
	SaveProjectResult,
} from "./types";

export type FictionClosureRPCSchema = {
	bun: RPCSchema<{
		requests: {
			selectProjectFolder: {
				params: { startingFolder?: string };
				response: { canceled: boolean; folderPath?: string; error?: string };
			};
			saveProjectToFolder: {
				params: {
					folderPath: string;
					project: ProjectInfo;
					documents: FictionDocument[];
					stacks?: ProjectHistoryStacks;
				};
				response: SaveProjectResult;
			};
			loadProjectFromFolder: {
				params: { folderPath: string };
				response: LoadProjectResult;
			};
			getLastProjectFolder: {
				params: void;
				response: { folderPath: string | null };
			};
			setLastProjectFolder: {
				params: { folderPath: string };
				response: { success: boolean };
			};
			saveCrashCache: {
				params: {
					folderPath: string;
					project: ProjectInfo;
					documents: FictionDocument[];
				};
				response: { success: boolean; error?: string };
			};
			clearCrashCache: {
				params: { folderPath: string };
				response: { success: boolean; error?: string };
			};
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};
