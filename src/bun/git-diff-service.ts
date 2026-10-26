import type { GitLineBlame } from "../shared/domain/diff";
import { runGitCommand } from "./git-service";

/**
 * Strips YAML frontmatter from raw markdown content if present.
 */
function stripFrontmatter(raw: string): string {
	return raw.replace(/^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*/, "");
}

/**
 * Gets list of modified or changed relative file paths between a commit and current working tree.
 */
export async function getGitDiffFiles(
	folderPath: string,
	commitHash: string,
): Promise<string[]> {
	if (!folderPath || !commitHash) return [];
	const res = await runGitCommand(folderPath, ["diff", "--name-only", commitHash]);
	if (res.exitCode !== 0 || !res.stdout.trim()) {
		return [];
	}

	return res.stdout
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
}

/**
 * Retrieves the document content at a specific Git commit revision.
 */
export async function getGitFileAtCommit(
	folderPath: string,
	commitHash: string,
	relativePath: string,
): Promise<string> {
	if (!folderPath || !commitHash || !relativePath) return "";

	// Normalize relative path forward slashes
	const cleanRel = relativePath.replace(/\\/g, "/");
	const res = await runGitCommand(folderPath, ["show", `${commitHash}:${cleanRel}`]);

	if (res.exitCode !== 0) {
		return "";
	}

	return stripFrontmatter(res.stdout);
}

/**
 * Retrieves line-by-line blame records (author, commit, timestamp) for a file.
 */
export async function getGitFileBlame(
	folderPath: string,
	relativePath: string,
	commitHash?: string,
): Promise<GitLineBlame[]> {
	if (!folderPath || !relativePath) return [];

	const cleanRel = relativePath.replace(/\\/g, "/");
	const args = ["blame", "--line-porcelain"];
	if (commitHash) {
		args.push(commitHash);
	}
	args.push("--", cleanRel);

	const res = await runGitCommand(folderPath, args);
	if (res.exitCode !== 0 || !res.stdout.trim()) {
		return [];
	}

	const records: GitLineBlame[] = [];
	const lines = res.stdout.split("\n");

	let currentCommit = "";
	let currentLine = 0;
	let author = "";
	let authorEmail = "";
	let authorTime = 0;
	let summary = "";

	for (const line of lines) {
		if (line.match(/^[0-9a-f]{40}\s+\d+\s+(\d+)/)) {
			const parts = line.split(/\s+/);
			currentCommit = parts[0];
			currentLine = parseInt(parts[2], 10);
		} else if (line.startsWith("author ")) {
			author = line.slice(7).trim();
		} else if (line.startsWith("author-mail ")) {
			authorEmail = line.slice(12).replace(/[<>]/g, "").trim();
		} else if (line.startsWith("author-time ")) {
			authorTime = parseInt(line.slice(12).trim(), 10) || 0;
		} else if (line.startsWith("summary ")) {
			summary = line.slice(8).trim();
		} else if (line.startsWith("\t")) {
			// Line content end marker for current porcelain entry
			records.push({
				lineNumber: currentLine,
				commitHash: currentCommit,
				authorName: author,
				authorEmail,
				authorTime,
				summary,
			});
			// Reset for next entry
			author = "";
			authorEmail = "";
			authorTime = 0;
			summary = "";
		}
	}

	return records;
}
