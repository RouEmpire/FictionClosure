/**
 * FictionClosure — Rendered Lines Calculation Engine
 *
 * Accurately measures and tracks wrapped lines in the writing canvas so that
 * the line-number gutter aligns 1:1 with soft-wrapped paragraphs in the textarea.
 */

import type { ZenModeType } from "@shared/types";

export interface RenderedLine {
	/** 1-based paragraph/logical line number (1, 2, 3...) */
	paragraphIndex: number;
	/** 0-based sub-line index within the paragraph (0 = first line, 1, 2... = wrapped lines) */
	subLineIndex: number;
	/** True if this is the start of a logical paragraph */
	isParagraphStart: boolean;
	/** Display string for the gutter: e.g. "1" or "-" */
	display: string;
	/** Character index in the full text where this rendered line starts */
	startOffset: number;
	/** Character index in the full text where this rendered line ends */
	endOffset: number;
}

export interface MeasureOptions {
	content: string;
	wordWrap: boolean;
	textareaEl: HTMLTextAreaElement | null;
	mirrorEl: HTMLDivElement | null;
	lineHeight?: number;
	fontSize?: number;
	textIndent?: string;
	activeFont?: string;
}

interface CachedParagraphLines {
	lineCount: number;
	/** Character offsets (relative to paragraph start) where each rendered line starts */
	subStarts: number[];
}

/**
 * In-memory cache for paragraph measurements:
 * Key: `${font}:::${width}:::${paragraphText}`
 */
const paragraphCache = new Map<string, CachedParagraphLines>();
const MAX_CACHE_ENTRIES = 1000;

function getCacheKey(
	font: string,
	width: number,
	text: string,
	fontSize: number = 15,
	textIndent: string = "",
): string {
	return `${font}:::${fontSize}:::${textIndent}:::${width}:::${text}`;
}

function setCacheEntry(key: string, value: CachedParagraphLines) {
	if (paragraphCache.size >= MAX_CACHE_ENTRIES) {
		// Evict oldest 200 entries to prevent memory growth
		let count = 0;
		for (const k of paragraphCache.keys()) {
			paragraphCache.delete(k);
			if (++count > 200) break;
		}
	}
	paragraphCache.set(key, value);
}

/**
 * Calculates rendered lines when word wrapping is disabled (1 line per logical paragraph).
 * Also serves as the canonical fallback in headless or non-DOM environments.
 */
export function calculateUnwrappedLines(content: string): RenderedLine[] {
	const paragraphs = content.split("\n");
	const lines: RenderedLine[] = [];
	let currentOffset = 0;

	for (let i = 0; i < paragraphs.length; i++) {
		const text = paragraphs[i];
		const startOffset = currentOffset;
		const endOffset = currentOffset + text.length;
		currentOffset = endOffset + 1; // skip '\n'

		lines.push({
			paragraphIndex: i + 1,
			subLineIndex: 0,
			isParagraphStart: true,
			display: String(i + 1),
			startOffset,
			endOffset,
		});
	}

	return lines.length > 0
		? lines
		: [
				{
					paragraphIndex: 1,
					subLineIndex: 0,
					isParagraphStart: true,
					display: "1",
					startOffset: 0,
					endOffset: 0,
				},
			];
}

/**
 * Measures the character offset where each wrapped line starts within a single paragraph element.
 */
function measureParagraphLineStarts(
	div: HTMLDivElement,
	paraText: string,
	lineHeight: number,
): CachedParagraphLines {
	const textLength = paraText.length;
	if (textLength === 0) {
		return { lineCount: 1, subStarts: [0] };
	}

	const height = div.getBoundingClientRect().height;
	const estimatedLines = Math.max(1, Math.round(height / lineHeight));

	// If it fits on 1 line, no further Range measurement needed
	if (estimatedLines <= 1) {
		return { lineCount: 1, subStarts: [0] };
	}

	const textNode = div.firstChild as Text | null;
	if (!textNode || typeof document === "undefined" || !document.createRange) {
		// Fallback: estimate uniform division
		const subStarts: number[] = [0];
		for (let s = 1; s < estimatedLines; s++) {
			subStarts.push(Math.floor((s * textLength) / estimatedLines));
		}
		return { lineCount: estimatedLines, subStarts };
	}

	try {
		const range = document.createRange();
		range.selectNodeContents(textNode);
		const rects = range.getClientRects();

		// Find distinct line vertical tops
		const lineTops: number[] = [];
		for (let i = 0; i < rects.length; i++) {
			const r = rects[i];
			if (r.height < 5) continue;
			if (lineTops.length === 0 || r.top >= lineTops[lineTops.length - 1] + lineHeight * 0.5) {
				lineTops.push(r.top);
			}
		}

		const actualLineCount = Math.max(estimatedLines, lineTops.length);
		if (actualLineCount <= 1 || lineTops.length <= 1) {
			return { lineCount: 1, subStarts: [0] };
		}

		const subStarts: number[] = [0];

		// Binary search the first character on each line
		for (let lineIdx = 1; lineIdx < lineTops.length; lineIdx++) {
			const targetTop = lineTops[lineIdx];
			let low = subStarts[lineIdx - 1] + 1;
			let high = textLength - 1;
			let foundStart = high;

			while (low <= high) {
				const mid = (low + high) >> 1;
				try {
					range.setStart(textNode, mid);
					range.setEnd(textNode, mid + 1);
					const charRects = range.getClientRects();
					if (charRects.length > 0) {
						const charTop = charRects[0].top;
						if (charTop >= targetTop - 4) {
							foundStart = mid;
							high = mid - 1;
						} else {
							low = mid + 1;
						}
					} else {
						low = mid + 1;
					}
				} catch {
					low = mid + 1;
				}
			}

			// Ensure monotonic progress
			if (foundStart > subStarts[subStarts.length - 1]) {
				subStarts.push(foundStart);
			} else {
				subStarts.push(subStarts[subStarts.length - 1] + 1);
			}
		}

		return {
			lineCount: Math.max(subStarts.length, actualLineCount),
			subStarts,
		};
	} catch {
		// In case of any Range failure, fallback gracefully
		const subStarts: number[] = [0];
		for (let s = 1; s < estimatedLines; s++) {
			subStarts.push(Math.floor((s * textLength) / estimatedLines));
		}
		return { lineCount: estimatedLines, subStarts };
	}
}

/**
 * Calculates the exact rendered lines for the document, taking soft wrapping into account.
 */
export function calculateRenderedLines(options: MeasureOptions): RenderedLine[] {
	const {
		content,
		wordWrap,
		textareaEl,
		mirrorEl,
		lineHeight = 26,
		fontSize,
		textIndent,
		activeFont = "",
	} = options;

	if (!wordWrap || !textareaEl || !mirrorEl || typeof window === "undefined") {
		return calculateUnwrappedLines(content);
	}

	const clientWidth = textareaEl.clientWidth;
	if (clientWidth <= 0) {
		return calculateUnwrappedLines(content);
	}

	// Align mirror element width with textarea inner content box
	mirrorEl.style.width = `${clientWidth}px`;

	const paragraphs = content.split("\n");
	const result: RenderedLine[] = [];
	let currentOffset = 0;

	// Check which paragraphs need DOM measurement vs cache
	const toMeasureIndices: number[] = [];
	const cachedParaData: (CachedParagraphLines | null)[] = new Array(paragraphs.length).fill(null);

	for (let i = 0; i < paragraphs.length; i++) {
		const paraText = paragraphs[i];
		if (paraText.length === 0) {
			cachedParaData[i] = { lineCount: 1, subStarts: [0] };
			continue;
		}

		const key = getCacheKey(activeFont, clientWidth, paraText, fontSize, textIndent);
		const cached = paragraphCache.get(key);
		if (cached) {
			cachedParaData[i] = cached;
		} else {
			toMeasureIndices.push(i);
		}
	}

	// If any paragraphs require DOM measurement, populate the mirror element
	if (toMeasureIndices.length > 0) {
		mirrorEl.textContent = "";
		const frag = document.createDocumentFragment();
		const divMap = new Map<number, HTMLDivElement>();

		for (const idx of toMeasureIndices) {
			const div = document.createElement("div");
			div.style.lineHeight = `${lineHeight}px`;
			if (fontSize) {
				div.style.fontSize = `${fontSize}px`;
			}
			if (textIndent) {
				div.style.textIndent = textIndent;
			}
			div.style.margin = "0";
			div.style.padding = "0";
			div.style.whiteSpace = "pre-wrap";
			div.style.overflowWrap = "break-word";
			div.style.wordBreak = "normal";
			div.textContent = paragraphs[idx];
			frag.appendChild(div);
			divMap.set(idx, div);
		}

		mirrorEl.appendChild(frag);

		// Now measure each paragraph
		for (const idx of toMeasureIndices) {
			const div = divMap.get(idx);
			if (div) {
				const measured = measureParagraphLineStarts(div, paragraphs[idx], lineHeight);
				cachedParaData[idx] = measured;
				setCacheEntry(getCacheKey(activeFont, clientWidth, paragraphs[idx], fontSize, textIndent), measured);
			} else {
				cachedParaData[idx] = { lineCount: 1, subStarts: [0] };
			}
		}

		mirrorEl.textContent = "";
	}

	// Build the final RenderedLine array
	for (let i = 0; i < paragraphs.length; i++) {
		const paraText = paragraphs[i];
		const paraLength = paraText.length;
		const startParaOffset = currentOffset;
		const endParaOffset = startParaOffset + paraLength;
		const paraData = cachedParaData[i] ?? { lineCount: 1, subStarts: [0] };
		const subStarts = paraData.subStarts;

		for (let s = 0; s < subStarts.length; s++) {
			const subStart = subStarts[s];
			const nextSubStart = s + 1 < subStarts.length ? subStarts[s + 1] : paraLength;

			result.push({
				paragraphIndex: i + 1,
				subLineIndex: s,
				isParagraphStart: s === 0,
				display: s === 0 ? String(i + 1) : "-",
				startOffset: startParaOffset + subStart,
				endOffset: startParaOffset + nextSubStart,
			});
		}

		// Advance past the trailing newline character
		currentOffset = endParaOffset + 1;
	}

	return result.length > 0
		? result
		: [
				{
					paragraphIndex: 1,
					subLineIndex: 0,
					isParagraphStart: true,
					display: "1",
					startOffset: 0,
					endOffset: 0,
				},
			];
}

/**
 * Resolves the target cursor offset when a gutter row is clicked.
 * - Regular click -> start of that rendered line
 * - Alt + click -> end of that rendered line (prioritizing visible end before trailing newline)
 */
export function resolveTeleportOffset(line: RenderedLine, isAltKey: boolean): number {
	return isAltKey ? line.endOffset : line.startOffset;
}

export interface GutterRowDisplay {
	text: string;
	isCurrent: boolean;
	isDash: boolean;
	isDimmed: boolean;
}

/**
 * Calculates display text and style flags for a gutter row.
 * In Focus Zen Mode:
 * - Active paragraph displays normally (line number or dash) with full opacity and highlight.
 * - Non-active paragraphs display line number only (no dashes at all) with 50% opacity.
 */
export function getGutterRowDisplay(
	line: RenderedLine,
	cursorLine: number,
	zenMode: ZenModeType = "none",
): GutterRowDisplay {
	const isCursorParagraph = line.paragraphIndex === cursorLine;

	if (zenMode === "focus") {
		if (isCursorParagraph) {
			return {
				text: line.display,
				isCurrent: true,
				isDash: !line.isParagraphStart,
				isDimmed: false,
			};
		}
		// Non-active paragraphs in Focus Zen Mode:
		// "will not display `-` at all, only display its line number (with 50% less opaque of course)"
		return {
			text: line.isParagraphStart ? String(line.paragraphIndex) : "",
			isCurrent: false,
			isDash: false,
			isDimmed: true,
		};
	}

	// Normal / Standard Zen mode:
	return {
		text: line.display,
		isCurrent: isCursorParagraph,
		isDash: !line.isParagraphStart,
		isDimmed: false,
	};
}
