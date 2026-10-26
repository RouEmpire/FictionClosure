/**
 * FictionClosure — Git Diff and Line Blame Domain Model.
 * Computes deterministic line-level diffs and formats author blame metadata.
 */

export type DiffLineType = "added" | "removed" | "unmodified";

export interface DiffLineItem {
	type: DiffLineType;
	text: string;
	oldLineNumber?: number;
	newLineNumber?: number;
	authorName?: string;
	authorTime?: number; // Unix timestamp in seconds
	commitHash?: string;
}

export interface GitLineBlame {
	lineNumber: number;
	commitHash: string;
	authorName: string;
	authorEmail: string;
	authorTime: number; // Unix timestamp in seconds
	summary?: string;
}

export interface FormattedBlameInfo {
	name: string;
	daysAgoText: string;
	isWriter: boolean;
	iconClass: string;
}

/**
 * Formats line author and time metadata for line gutter inspect tooltip/popover.
 * Output conforms to: <icon> <name>, <day-number> Days ago
 * - fa-code-commit if commit user is the same as the writer
 * - fa-wave-square if committed by a different person
 */
export function formatBlameInfo(
	authorName: string,
	authorTime: number,
	writerName: string,
	nowMs: number = Date.now(),
): FormattedBlameInfo {
	const name = authorName.trim() || "Author";
	const diffMs = Math.max(0, nowMs - authorTime * 1000);
	const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
	const daysAgoText = `${daysAgo} Days ago`;

	const cleanWriter = (writerName || "").trim().toLowerCase();
	const cleanAuthor = name.toLowerCase();

	const isWriter =
		cleanWriter !== "" &&
		(cleanAuthor === cleanWriter ||
			cleanAuthor.includes(cleanWriter) ||
			cleanWriter.includes(cleanAuthor) ||
			cleanAuthor.includes("author"));

	const iconClass = isWriter ? "fa-solid fa-code-commit" : "fa-solid fa-wave-square";

	return {
		name,
		daysAgoText,
		isWriter,
		iconClass,
	};
}

/**
 * Computes an LCS-based line-level diff between an older revision and the current text.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLineItem[] {
	const oldLines = oldText ? oldText.split(/\r?\n/) : [];
	const newLines = newText ? newText.split(/\r?\n/) : [];

	const n = oldLines.length;
	const m = newLines.length;

	if (n === 0 && m === 0) return [];

	if (n === 0) {
		return newLines.map((text, idx) => ({
			type: "added",
			text,
			newLineNumber: idx + 1,
		}));
	}

	if (m === 0) {
		return oldLines.map((text, idx) => ({
			type: "removed",
			text,
			oldLineNumber: idx + 1,
		}));
	}

	// Compute LCS matrix
	const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));

	for (let i = 0; i < n; i++) {
		for (let j = 0; j < m; j++) {
			if (oldLines[i] === newLines[j]) {
				dp[i + 1][j + 1] = dp[i][j] + 1;
			} else {
				dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
			}
		}
	}

	// Backtrack to construct diff
	const result: DiffLineItem[] = [];
	let i = n;
	let j = m;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
			result.push({
				type: "unmodified",
				text: oldLines[i - 1],
				oldLineNumber: i,
				newLineNumber: j,
			});
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			result.push({
				type: "added",
				text: newLines[j - 1],
				newLineNumber: j,
			});
			j--;
		} else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
			result.push({
				type: "removed",
				text: oldLines[i - 1],
				oldLineNumber: i,
			});
			i--;
		}
	}

	return result.reverse();
}

/**
 * Enriches diff lines with Git blame author and timestamp records.
 */
export function attachBlameToDiff(
	diffLines: DiffLineItem[],
	blameMap: Map<number, GitLineBlame>,
	fallbackAuthor = "Author",
	fallbackTime: number = Math.floor(Date.now() / 1000),
): DiffLineItem[] {
	return diffLines.map((line) => {
		const targetLine = line.type === "removed" ? line.oldLineNumber : line.newLineNumber;
		const blame = targetLine ? blameMap.get(targetLine) : undefined;

		return {
			...line,
			authorName: blame?.authorName || fallbackAuthor,
			authorTime: blame?.authorTime || fallbackTime,
			commitHash: blame?.commitHash,
		};
	});
}
