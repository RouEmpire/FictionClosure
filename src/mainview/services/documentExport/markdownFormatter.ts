/**
 * FictionClosure — Markdown Content Parser for PDFKit Export (Optimized & SOLID).
 *
 * Responsibilities:
 * - Parsing manuscript markdown into structured document blocks
 * - Pre-compiled regex caches & fast-path short circuits for maximum performance
 * - Pure, deterministic formatting pipeline (zero side effects)
 */

export interface MarkdownBlock {
	type: "heading" | "paragraph" | "blockquote" | "divider" | "listItem";
	level?: number;
	text?: string;
}

// ============================================================================
// Pre-Compiled Static Regular Expressions (Performance Cache)
// ============================================================================

const BOLD_ITALIC_REGEX = /(\*\*\*|___)(.*?)\1/g;
const BOLD_REGEX = /(\*\*|__)(.*?)\1/g;
const ITALIC_REGEX = /(\*|_)(.*?)\1/g;
const STRIKETHROUGH_REGEX = /~~(.*?)~~/g;
const INLINE_CODE_REGEX = /`([^`]+)`/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\([^)]+\)/g;
const WIKILINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const HORIZONTAL_RULE_REGEX = /^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/;
const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const BULLET_LIST_REGEX = /^[-*+]\s+/;

// Quick character existence tester to bypass regexes on clean prose
const INLINE_MARKDOWN_TEST = /[*_~`[]/;

// ============================================================================
// Pure Text Pipeline Functions
// ============================================================================

/**
 * Strips YAML frontmatter from document text if present.
 */
export function stripFrontmatter(text: string): string {
	if (!text) return "";
	const trimmed = text.trimStart();
	if (!trimmed.startsWith("---")) return text;

	const endIdx = trimmed.indexOf("\n---", 3);
	if (endIdx === -1) return text;

	const afterFrontmatter = trimmed.slice(endIdx + 4);
	return afterFrontmatter.replace(/^\r?\n/, "");
}

/**
 * Resolves wikilinks [[Target|Display]] or [[Target]] to plain display text.
 * Uses fast-path check to avoid regex invocation on link-free strings.
 */
export function stripWikilinks(text: string): string {
	if (!text || !text.includes("[[")) return text;
	return text.replace(WIKILINK_REGEX, (_, target: string, alias?: string) => {
		return alias ? alias.trim() : target.trim();
	});
}

/**
 * Removes markdown formatting characters for clean plain text rendering in PDF.
 * Applies a fast-path bypass when no markdown tokens are detected.
 */
export function cleanInlineMarkdown(text: string): string {
	if (!text || !INLINE_MARKDOWN_TEST.test(text)) {
		return text;
	}

	return text
		.replace(BOLD_ITALIC_REGEX, "$2")
		.replace(BOLD_REGEX, "$2")
		.replace(ITALIC_REGEX, "$2")
		.replace(STRIKETHROUGH_REGEX, "$1")
		.replace(INLINE_CODE_REGEX, "$1")
		.replace(MARKDOWN_LINK_REGEX, "$1");
}

// ============================================================================
// Block Parsing Engine
// ============================================================================

/**
 * Parses markdown manuscript content into a sequential list of structured blocks.
 */
export function parseMarkdownBlocks(rawContent: string): MarkdownBlock[] {
	const cleaned = stripFrontmatter(rawContent);
	const withCleanLinks = stripWikilinks(cleaned);
	const lines = withCleanLinks.split(/\r?\n/);
	const blocks: MarkdownBlock[] = [];

	let currentParagraphLines: string[] = [];

	function flushParagraph(): void {
		if (currentParagraphLines.length > 0) {
			const fullText = cleanInlineMarkdown(
				currentParagraphLines.join(" ").trim(),
			);
			if (fullText) {
				blocks.push({
					type: "paragraph",
					text: fullText,
				});
			}
			currentParagraphLines = [];
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (!line) {
			flushParagraph();
			continue;
		}

		const trimmed = line.trim();
		if (!trimmed) {
			flushParagraph();
			continue;
		}

		// Horizontal rule / scene break: ***, ---, ___
		if (HORIZONTAL_RULE_REGEX.test(trimmed)) {
			flushParagraph();
			blocks.push({ type: "divider" });
			continue;
		}

		// Headings: # H1, ## H2, ### H3
		const headingMatch = trimmed.match(HEADING_REGEX);
		if (headingMatch && headingMatch[1] && headingMatch[2]) {
			flushParagraph();
			const level = Math.min(3, headingMatch[1].length);
			blocks.push({
				type: "heading",
				level,
				text: cleanInlineMarkdown(headingMatch[2].trim()),
			});
			continue;
		}

		// Blockquote: > text
		if (trimmed.startsWith(">")) {
			flushParagraph();
			const quoteText = cleanInlineMarkdown(
				trimmed.replace(/^>\s*/, "").trim(),
			);
			if (quoteText) {
				blocks.push({
					type: "blockquote",
					text: quoteText,
				});
			}
			continue;
		}

		// Bullet list items: - item, * item, + item
		if (BULLET_LIST_REGEX.test(trimmed)) {
			flushParagraph();
			const itemText = cleanInlineMarkdown(
				trimmed.replace(BULLET_LIST_REGEX, "").trim(),
			);
			if (itemText) {
				blocks.push({
					type: "listItem",
					text: itemText,
				});
			}
			continue;
		}

		// Regular line of prose belongs to paragraph
		currentParagraphLines.push(trimmed);
	}

	flushParagraph();
	return blocks;
}
