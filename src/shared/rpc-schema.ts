import type { RPCSchema } from "electrobun";
import type {
	FictionDocument,
	LoadProjectResult,
	ProjectFolder,
	ProjectHistoryStacks,
	ProjectInfo,
	SaveProjectResult,
} from "./types";
import type {
	GitCommitOptions,
	GitCommitRecord,
	GitCommitResult,
	GitInitResult,
	GitRevertResult,
	GitStatusResult,
} from "./domain/git";

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
					folders?: ProjectFolder[];
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
			exportPdfFile: {
				params: {
					folderPath: string;
					fileName: string;
					pdfBase64: string;
				};
				response: { success: boolean; filePath?: string; error?: string };
			};
			gitIsRepo: {
				params: { folderPath: string };
				response: { isRepo: boolean };
			};
			gitInit: {
				params: { folderPath: string };
				response: GitInitResult;
			};
			gitGetStatus: {
				params: { folderPath: string };
				response: GitStatusResult;
			};
			gitGetLog: {
				params: { folderPath: string; limit?: number };
				response: { commits: GitCommitRecord[]; error?: string };
			};
			gitCommit: {
				params: { folderPath: string; options: GitCommitOptions };
				response: GitCommitResult;
			};
			gitRevert: {
				params: { folderPath: string; commitHash: string };
				response: GitRevertResult;
			};
		};
		messages: {};
	}>;
	webview: RPCSchema<{
		requests: {};
		messages: {};
	}>;
};
