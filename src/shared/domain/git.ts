/**
 * Git Domain Types and Interfaces for FictionClosure.
 * Designed for workspace version control, commit history, and future remote repository integration.
 */

export interface GitCommitRecord {
	hash: string;
	shortHash: string;
	authorName: string;
	authorEmail: string;
	date: string; // ISO 8601 string
	relativeDate: string; // e.g. "5 minutes ago"
	message: string;
	gitmoji?: string;
	gitmojiCode?: string;
	cleanMessage: string;
}

export interface GitFileStatus {
	path: string;
	status: "modified" | "added" | "deleted" | "untracked" | "renamed";
}

export interface GitStatusResult {
	isRepo: boolean;
	branch: string;
	clean: boolean;
	modifiedCount: number;
	untrackedCount: number;
	files: GitFileStatus[];
	error?: string;
}

export interface GitCommitOptions {
	message: string;
	gitmoji?: string;
	authorName?: string;
	authorEmail?: string;
}

export interface GitCommitResult {
	success: boolean;
	commitHash?: string;
	shortHash?: string;
	message?: string;
	error?: string;
}

export interface GitRevertResult {
	success: boolean;
	revertCommitHash?: string;
	error?: string;
}

export interface GitInitResult {
	success: boolean;
	error?: string;
}

export interface GitRemoteInfo {
	name: string;
	url: string;
	type: "fetch" | "push";
}

export interface GitBranchInfo {
	name: string;
	current: boolean;
}
