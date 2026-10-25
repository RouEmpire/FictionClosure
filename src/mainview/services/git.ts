/**
 * FictionClosure — Frontend Git Integration Service (SOLID & Functional).
 * Handles IPC communication with the Bun Git subsystem, status polling, and commit workflows.
 */

import type {
	GitCommitOptions,
	GitCommitRecord,
	GitCommitResult,
	GitInitResult,
	GitRevertResult,
	GitStatusResult,
} from "@shared/domain/git";
import { getRpcTransport, isDesktopApp } from "./storage";

/**
 * Checks if the given project directory is a Git repository.
 */
export async function checkIsGitRepo(folderPath: string): Promise<boolean> {
	if (!folderPath) return false;
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) return false;

	try {
		const res = await rpc.request.gitIsRepo({ folderPath });
		return res.isRepo;
	} catch (err) {
		console.warn("Failed to check Git status:", err);
		return false;
	}
}

/**
 * Initializes a Git repository in the project directory.
 */
export async function initializeGitRepo(folderPath: string): Promise<GitInitResult> {
	if (!folderPath) {
		return { success: false, error: "Project must be saved to a folder before initializing Git" };
	}
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) {
		return { success: false, error: "Git operations require the desktop application environment" };
	}

	try {
		return await rpc.request.gitInit({ folderPath });
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
}

/**
 * Fetches the current Git working tree status (branch, modified/untracked files).
 */
export async function fetchGitStatus(folderPath: string): Promise<GitStatusResult> {
	const emptyResult: GitStatusResult = {
		isRepo: false,
		branch: "",
		clean: true,
		modifiedCount: 0,
		untrackedCount: 0,
		files: [],
	};

	if (!folderPath) return emptyResult;
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) return emptyResult;

	try {
		return await rpc.request.gitGetStatus({ folderPath });
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		return { ...emptyResult, isRepo: true, error };
	}
}

/**
 * Fetches recent commit history with Gitmoji metadata.
 */
export async function fetchGitLog(folderPath: string, limit = 50): Promise<GitCommitRecord[]> {
	if (!folderPath) return [];
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) return [];

	try {
		const res = await rpc.request.gitGetLog({ folderPath, limit });
		return res.commits || [];
	} catch (err) {
		console.warn("Failed to fetch Git log:", err);
		return [];
	}
}

/**
 * Stages and commits changes with Gitmoji formatting.
 */
export async function commitWorkspaceChanges(
	folderPath: string,
	options: GitCommitOptions,
): Promise<GitCommitResult> {
	if (!folderPath) {
		return { success: false, error: "Project must be saved to a folder before committing" };
	}
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) {
		return { success: false, error: "Git operations require the desktop application environment" };
	}

	try {
		return await rpc.request.gitCommit({ folderPath, options });
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
}

/**
 * Reverts a chosen commit non-destructively by creating an inverse commit.
 */
export async function revertCommit(
	folderPath: string,
	commitHash: string,
): Promise<GitRevertResult> {
	if (!folderPath) {
		return { success: false, error: "Project folder path is missing" };
	}
	const rpc = getRpcTransport();
	if (!rpc || !isDesktopApp()) {
		return { success: false, error: "Git operations require the desktop application environment" };
	}

	try {
		return await rpc.request.gitRevert({ folderPath, commitHash });
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		return { success: false, error };
	}
}
