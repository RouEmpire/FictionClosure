/**
 * FictionClosure — Text Formatting & Keyboard Shortcuts Utilities
 *
 * Implements editor text transforms for bold, italic, wikilinks, blockquotes,
 * bullet lists, task items, and task completion toggling.
 */

export interface TextTransformResult {
	newText: string;
	newStart: number;
	newEnd: number;
}

/**
 * Wraps selection with prefix and suffix (e.g. **bold**, *italic*, [[wikilink]]).
 */
export function wrapSelection(
	text: string,
	start: number,
	end: number,
	prefix: string,
	suffix: string = prefix,
	defaultPlaceholder: string = "text",
): TextTransformResult {
	const selected = text.substring(start, end);
	const content = selected || defaultPlaceholder;
	const replacement = prefix + content + suffix;
	const newText = text.substring(0, start) + replacement + text.substring(end);

	if (selected.length > 0) {
		return {
			newText,
			newStart: start + prefix.length,
			newEnd: start + prefix.length + selected.length,
		};
	}

	// If no text was selected, select the placeholder so user can immediately overwrite it
	return {
		newText,
		newStart: start + prefix.length,
		newEnd: start + prefix.length + defaultPlaceholder.length,
	};
}

/**
 * Toggles line prefix (such as "> " for blockquote, "- " for list, or "- [ ] " for task).
 * Operates across all lines touched by the current cursor or selection.
 */
export function toggleLinePrefix(
	text: string,
	start: number,
	end: number,
	prefix: string,
): TextTransformResult {
	// Find beginning of the first line
	const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
	// Find end of the last line
	const nextNewline = text.indexOf("\n", end);
	const lineEnd = nextNewline === -1 ? text.length : nextNewline;

	const targetBlock = text.substring(lineStart, lineEnd);
	const lines = targetBlock.split("\n");

	// Determine if all lines currently have this prefix
	const trimmedPrefix = prefix.trimEnd();
	const allHavePrefix = lines.every((line) => {
		const trimmed = line.trimStart();
		return trimmed.startsWith(prefix) || trimmed === trimmedPrefix;
	});

	let transformedBlock: string;

	if (allHavePrefix) {
		// Remove prefix
		transformedBlock = lines
			.map((line) => {
				const leadingSpacesMatch = line.match(/^\s*/);
				const leading = leadingSpacesMatch ? leadingSpacesMatch[0] : "";
				const rest = line.slice(leading.length);
				if (rest.startsWith(prefix)) {
					return leading + rest.slice(prefix.length);
				}
				if (rest.startsWith(trimmedPrefix)) {
					return leading + rest.slice(trimmedPrefix.length);
				}
				return line;
			})
			.join("\n");
	} else {
		// Add prefix
		transformedBlock = lines
			.map((line) => {
				// Preserve existing leading indentation if any
				const leadingSpacesMatch = line.match(/^\s*/);
				const leading = leadingSpacesMatch ? leadingSpacesMatch[0] : "";
				const rest = line.slice(leading.length);
				return leading + prefix + rest;
			})
			.join("\n");
	}

	const newText = text.substring(0, lineStart) + transformedBlock + text.substring(lineEnd);
	const delta = transformedBlock.length - targetBlock.length;

	return {
		newText,
		newStart: Math.max(0, start + (allHavePrefix ? -prefix.length : prefix.length)),
		newEnd: Math.max(0, end + delta),
	};
}

/**
 * Toggles task checkbox state between [ ] and [x] on the active line(s).
 * - If line contains "- [ ]" -> toggles to "- [x]"
 * - If line contains "- [x]" or "- [X]" -> toggles to "- [ ]"
 * - If line has no checkbox -> converts line into "- [x]" (or "- [ ]" if empty)
 */
export function toggleTaskCheckbox(
	text: string,
	start: number,
	end: number,
): TextTransformResult {
	const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
	const nextNewline = text.indexOf("\n", end);
	const lineEnd = nextNewline === -1 ? text.length : nextNewline;

	const line = text.substring(lineStart, lineEnd);

	let transformedLine: string;

	// Case 1: Has unchecked box [ ] -> toggle to [x]
	if (/\[ \]/i.test(line)) {
		transformedLine = line.replace(/\[ \]/, "[x]");
	}
	// Case 2: Has checked box [x] or [X] -> toggle to [ ]
	else if (/\[[xX]\]/.test(line)) {
		transformedLine = line.replace(/\[[xX]\]/, "[ ]");
	}
	// Case 3: Starts with list bullet "- " -> convert to "- [x] "
	else if (/^\s*[-*]\s+/.test(line)) {
		transformedLine = line.replace(/^(\s*)[-*]\s+/, "$1- [x] ");
	}
	// Case 4: Plain line -> prepend "- [ ] "
	else {
		const leadingSpacesMatch = line.match(/^\s*/);
		const leading = leadingSpacesMatch ? leadingSpacesMatch[0] : "";
		const rest = line.slice(leading.length);
		transformedLine = leading + "- [ ] " + rest;
	}

	const newText = text.substring(0, lineStart) + transformedLine + text.substring(lineEnd);
	const delta = transformedLine.length - line.length;

	return {
		newText,
		newStart: Math.max(lineStart, start + delta),
		newEnd: Math.max(lineStart, end + delta),
	};
}
