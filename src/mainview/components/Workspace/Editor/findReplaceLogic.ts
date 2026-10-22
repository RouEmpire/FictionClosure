export interface SearchMatch {
	index: number;
	start: number;
	end: number;
	length: number;
}

export interface FindOptions {
	query: string;
	caseSensitive: boolean;
}

/**
 * Searches for all non-overlapping occurrences of query within content.
 * Supports case-sensitive and case-insensitive matching.
 * Handles all Unicode, punctuation, and markdown characters safely.
 */
export function findMatches(
	content: string,
	query: string,
	caseSensitive: boolean,
): SearchMatch[] {
	if (!query || !content) return [];

	const haystack = caseSensitive ? content : content.toLowerCase();
	const needle = caseSensitive ? query : query.toLowerCase();
	const queryLen = needle.length;
	if (queryLen === 0) return [];

	const matches: SearchMatch[] = [];
	let pos = 0;
	let matchIndex = 0;

	while ((pos = haystack.indexOf(needle, pos)) !== -1) {
		matches.push({
			index: matchIndex++,
			start: pos,
			end: pos + queryLen,
			length: queryLen,
		});
		pos += queryLen;
	}

	return matches;
}

/**
 * Determines the best match index to highlight based on current cursor position.
 * If cursor is within or just before a match, selects that match.
 * Otherwise selects the first match at or after cursor, or defaults to 0.
 */
export function resolveActiveMatchIndex(
	matches: SearchMatch[],
	cursorPosition: number,
	currentActiveIndex: number = 0,
): number {
	if (matches.length === 0) return -1;

	// Check if cursor is directly on or before a match
	const matchAtCursor = matches.findIndex(
		(m) => cursorPosition >= m.start && cursorPosition <= m.end,
	);
	if (matchAtCursor !== -1) {
		return matchAtCursor;
	}

	// Check if there is a match after cursor
	const matchAfterCursor = matches.findIndex((m) => m.start >= cursorPosition);
	if (matchAfterCursor !== -1) {
		return matchAfterCursor;
	}

	// Clamp current active index or fallback to 0
	if (currentActiveIndex >= 0 && currentActiveIndex < matches.length) {
		return currentActiveIndex;
	}

	return 0;
}

/**
 * Calculates the next match index in cyclical order.
 */
export function getNextMatchIndex(
	currentIndex: number,
	totalMatches: number,
): number {
	if (totalMatches <= 0) return -1;
	return (currentIndex + 1) % totalMatches;
}

/**
 * Calculates the previous match index in cyclical order.
 */
export function getPreviousMatchIndex(
	currentIndex: number,
	totalMatches: number,
): number {
	if (totalMatches <= 0) return -1;
	return (currentIndex - 1 + totalMatches) % totalMatches;
}

/**
 * Replaces a single targeted match with the replacement string.
 * Returns the modified content and the new cursor position directly after the replaced text.
 */
export function replaceSingleMatch(
	content: string,
	match: SearchMatch,
	replacement: string,
): { newContent: string; newCursor: number } {
	if (!match || match.start < 0 || match.end > content.length) {
		return { newContent: content, newCursor: 0 };
	}

	const before = content.slice(0, match.start);
	const after = content.slice(match.end);
	const newContent = before + replacement + after;
	const newCursor = match.start + replacement.length;

	return {
		newContent,
		newCursor,
	};
}

/**
 * Replaces all occurrences of query within content with the replacement string.
 * Returns the updated content and total number of replacements made.
 */
export function replaceAllMatches(
	content: string,
	query: string,
	replacement: string,
	caseSensitive: boolean,
): { newContent: string; count: number } {
	if (!query || !content) {
		return { newContent: content, count: 0 };
	}

	const matches = findMatches(content, query, caseSensitive);
	if (matches.length === 0) {
		return { newContent: content, count: 0 };
	}

	// Build new string from parts backwards to preserve offsets or forward with builder
	let result = "";
	let lastIndex = 0;

	for (const match of matches) {
		result += content.slice(lastIndex, match.start) + replacement;
		lastIndex = match.end;
	}
	result += content.slice(lastIndex);

	return {
		newContent: result,
		count: matches.length,
	};
}

/**
 * Formats user-facing match count summary text.
 */
export function formatMatchCountText(
	matchesCount: number,
	activeMatchIndex: number,
	query: string,
): string {
	if (!query) return "";
	if (matchesCount === 0) return "No results";
	return `${activeMatchIndex + 1} of ${matchesCount}`;
}
