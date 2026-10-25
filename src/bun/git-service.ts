import * as fs from "node:fs";
import * as path from "node:path";
import type {
	GitBranchInfo,
	GitCommitOptions,
	GitCommitRecord,
	GitCommitResult,
	GitFileStatus,
	GitInitResult,
	GitRemoteInfo,
	GitRevertResult,
	GitStatusResult,
} from "../shared/domain/git";
import { formatCommitMessage, parseCommitMessage } from "../shared/domain/gitmoji";
import { resolveFolderPath } from "./project-storage";

const DEFAULT_GIT_NAME = "FictionClosure Author";
const DEFAULT_GIT_EMAIL = "author@fictionclosure.local";

/**
 * Executes a Git command safely with an array of arguments, returning stdout, stderr, and exit code.
 */
export async function runGitCommand(
	folderPath: string,
	args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	const resolved = resolveFolderPath(folderPath);
	if (!resolved || !fs.existsSync(resolved)) {
		return { exitCode: 1, stdout: "", stderr: `Folder path does not exist: "${folderPath}"` };
	}

	try {
		// Include fallback config so git commit/revert works even without global git config
		const fullArgs = [
			"-c",
			`user.name=${DEFAULT_GIT_NAME}`,
			"-c",
			`user.email=${DEFAULT_GIT_EMAIL}`,
			...args,
		];

		const proc = Bun.spawn(["git", ...fullArgs], {
			cwd: resolved,
			stdout: "pipe",
			stderr: "pipe",
		});

		const [stdoutBytes, stderrBytes] = await Promise.all([
			new Response(proc.stdout).arrayBuffer(),
			new Response(proc.stderr).arrayBuffer(),
		]);

		const exitCode = await proc.exited;
		const decoder = new TextDecoder();
		return {
			exitCode,
			stdout: decoder.decode(stdoutBytes),
			stderr: decoder.decode(stderrBytes),
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { exitCode: 1, stdout: "", stderr: message };
	}
}

/**
 * Checks if the specified folder is inside a Git working tree.
 */
export async function isGitRepo(folderPath: string): Promise<boolean> {
	const res = await runGitCommand(folderPath, ["rev-parse", "--is-inside-work-tree"]);
	return res.exitCode === 0 && res.stdout.trim() === "true";
}

/**
 * Initializes a new Git repository in the folder and adds a default .gitignore if none exists.
 */
export async function initGitRepo(folderPath: string): Promise<GitInitResult> {
	const initRes = await runGitCommand(folderPath, ["init"]);
	if (initRes.exitCode !== 0) {
		return { success: false, error: initRes.stderr || "Failed to initialize Git repository" };
	}

	const resolved = resolveFolderPath(folderPath);
	const gitignorePath = path.join(resolved, ".gitignore");
	if (!fs.existsSync(gitignorePath)) {
		const defaultIgnore = [
			"# FictionClosure cache & temporary files",
			".fictionclosure/cache/",
			".fictionclosure/tmp/",
			".fictionclosure/autosave/",
			"*.tmp.*",
			"",
			"# Operating System metadata",
			".DS_Store",
			"Thumbs.db",
			"",
		].join("\n");
		try {
			fs.writeFileSync(gitignorePath, defaultIgnore, "utf8");
		} catch (err) {
			console.warn("Could not write default .gitignore:", err);
		}
	}

	return { success: true };
}

/**
 * Inspects Git working tree status: modified files, branch name, and clean/dirty state.
 */
export async function getGitStatus(folderPath: string): Promise<GitStatusResult> {
	const isRepo = await isGitRepo(folderPath);
	if (!isRepo) {
		return {
			isRepo: false,
			branch: "",
			clean: true,
			modifiedCount: 0,
			untrackedCount: 0,
			files: [],
		};
	}

	const res = await runGitCommand(folderPath, ["status", "--porcelain=v1", "-b"]);
	if (res.exitCode !== 0) {
		return {
			isRepo: true,
			branch: "",
			clean: false,
			modifiedCount: 0,
			untrackedCount: 0,
			files: [],
			error: res.stderr,
		};
	}

	const lines = res.stdout.split("\n").filter((l) => l.trim().length > 0);
	let branch = "main";
	const files: GitFileStatus[] = [];

	for (const line of lines) {
		if (line.startsWith("## ")) {
			// Branch header, e.g. "## main...origin/main" or "## No commits yet on main"
			const header = line.slice(3).trim();
			const branchMatch = header.match(/^No commits yet on (.*)$/) || header.match(/^([^.]+)/);
			if (branchMatch && branchMatch[1]) {
				branch = branchMatch[1].trim();
			}
			continue;
		}

		const code = line.slice(0, 2);
		const filePath = line.slice(3).trim();
		let status: GitFileStatus["status"] = "modified";

		if (code.includes("?")) {
			status = "untracked";
		} else if (code.includes("A")) {
			status = "added";
		} else if (code.includes("D")) {
			status = "deleted";
		} else if (code.includes("R")) {
			status = "renamed";
		}

		files.push({ path: filePath, status });
	}

	const modifiedCount = files.filter((f) => f.status !== "untracked").length;
	const untrackedCount = files.filter((f) => f.status === "untracked").length;

	return {
		isRepo: true,
		branch,
		clean: files.length === 0,
		modifiedCount,
		untrackedCount,
		files,
	};
}

/**
 * Retrieves the commit history log, parsing Gitmoji headers and commit metadata.
 */
export async function getGitLog(
	folderPath: string,
	limit = 50,
): Promise<GitCommitRecord[]> {
	const isRepo = await isGitRepo(folderPath);
	if (!isRepo) return [];

	// Format: hash \0 shortHash \0 authorName \0 authorEmail \0 dateISO \0 relativeDate \0 body \x1f
	const format = "%H%x00%h%x00%an%x00%ae%x00%aI%x00%cr%x00%B%x1f";
	const res = await runGitCommand(folderPath, ["log", `-n${limit}`, `--pretty=format:${format}`]);

	if (res.exitCode !== 0 || !res.stdout.trim()) {
		return [];
	}

	const rawCommits = res.stdout.split("\x1f").filter((entry) => entry.trim().length > 0);
	const records: GitCommitRecord[] = [];

	for (const entry of rawCommits) {
		const parts = entry.trim().split("\x00");
		if (parts.length < 7) continue;

		const [hash, shortHash, authorName, authorEmail, date, relativeDate, message] = parts;
		const fullMessage = (message || "").trim();
		const parsed = parseCommitMessage(fullMessage);

		records.push({
			hash: hash.trim(),
			shortHash: shortHash.trim(),
			authorName: authorName.trim(),
			authorEmail: authorEmail.trim(),
			date: date.trim(),
			relativeDate: relativeDate.trim(),
			message: fullMessage,
			gitmoji: parsed.gitmoji || undefined,
			gitmojiCode: parsed.gitmojiCode,
			cleanMessage: parsed.cleanMessage || fullMessage,
		});
	}

	return records;
}

/**
 * Stages all changes and creates a commit formatted with Gitmoji standards.
 */
export async function createGitCommit(
	folderPath: string,
	options: GitCommitOptions,
): Promise<GitCommitResult> {
	const isRepo = await isGitRepo(folderPath);
	if (!isRepo) {
		return { success: false, error: "Not a Git repository" };
	}

	// 1. Stage changes
	const addRes = await runGitCommand(folderPath, ["add", "-A"]);
	if (addRes.exitCode !== 0) {
		return { success: false, error: `Git add failed: ${addRes.stderr}` };
	}

	// 2. Format commit message
	const formattedMessage = formatCommitMessage(options.gitmoji || "", options.message);
	if (!formattedMessage.trim()) {
		return { success: false, error: "Commit message cannot be empty" };
	}

	const commitArgs = ["commit", "-m", formattedMessage];
	if (options.authorName && options.authorEmail) {
		commitArgs.push(`--author=${options.authorName} <${options.authorEmail}>`);
	}

	const commitRes = await runGitCommand(folderPath, commitArgs);
	if (commitRes.exitCode !== 0) {
		return {
			success: false,
			error: commitRes.stderr || commitRes.stdout || "Git commit failed",
		};
	}

	// 3. Retrieve new commit hash
	const revRes = await runGitCommand(folderPath, ["rev-parse", "HEAD"]);
	const commitHash = revRes.exitCode === 0 ? revRes.stdout.trim() : undefined;
	const shortHash = commitHash ? commitHash.slice(0, 7) : undefined;

	return {
		success: true,
		commitHash,
		shortHash,
		message: formattedMessage,
	};
}

/**
 * Reverts a given commit by creating a new inverse commit (non-destructive rollback).
 */
export async function revertGitCommit(
	folderPath: string,
	commitHash: string,
): Promise<GitRevertResult> {
	const isRepo = await isGitRepo(folderPath);
	if (!isRepo) {
		return { success: false, error: "Not a Git repository" };
	}

	const revertRes = await runGitCommand(folderPath, ["revert", "--no-edit", commitHash]);
	if (revertRes.exitCode !== 0) {
		// Clean up conflicted state if revert fails
		await runGitCommand(folderPath, ["revert", "--abort"]);
		return {
			success: false,
			error:
				revertRes.stderr || revertRes.stdout || "Revert conflict encountered; rollback aborted",
		};
	}

	const revRes = await runGitCommand(folderPath, ["rev-parse", "HEAD"]);
	const revertCommitHash = revRes.exitCode === 0 ? revRes.stdout.trim() : undefined;

	return {
		success: true,
		revertCommitHash,
	};
}

/**
 * Lists configured remote repositories (for future cloud/GitHub sync).
 */
export async function getGitRemotes(folderPath: string): Promise<GitRemoteInfo[]> {
	const res = await runGitCommand(folderPath, ["remote", "-v"]);
	if (res.exitCode !== 0) return [];

	const lines = res.stdout.split("\n").filter((l) => l.trim().length > 0);
	const remotes: GitRemoteInfo[] = [];

	for (const line of lines) {
		const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
		if (match) {
			remotes.push({
				name: match[1],
				url: match[2],
				type: match[3] as "fetch" | "push",
			});
		}
	}
	return remotes;
}

/**
 * Lists available branches in the repository.
 */
export async function getGitBranches(folderPath: string): Promise<GitBranchInfo[]> {
	const res = await runGitCommand(folderPath, ["branch", "--no-color"]);
	if (res.exitCode !== 0) return [];

	const lines = res.stdout.split("\n").filter((l) => l.trim().length > 0);
	return lines.map((line) => ({
		name: line.replace(/^\*?\s+/, "").trim(),
		current: line.startsWith("*"),
	}));
}
