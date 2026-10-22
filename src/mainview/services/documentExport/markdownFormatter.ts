export interface MarkdownBlock {
	type: "heading" | "paragraph" | "blockquote" | "divider" | "listItem";
	level?: number;
	text?: string;
}

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
 */
export function stripWikilinks(text: string): string {
	if (!text) return "";
	return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
		return alias ? alias.trim() : target.trim();
	});
}

/**
 * Removes markdown formatting characters for clean plain text rendering in PDF.
 */
export function cleanInlineMarkdown(text: string): string {
	if (!text) return "";
	return text
		// Bold and italic: ***text*** or ___text___
		.replace(/(\*\*\*|___)(.*?)\1/g, "$2")
		// Bold: **text** or __text__
		.replace(/(\*\*|__)(.*?)\1/g, "$2")
		// Italic: *text* or _text_
		.replace(/(\*|_)(.*?)\1/g, "$2")
		// Strikethrough: ~~text~~
		.replace(/~~(.*?)~~/g, "$1")
		// Inline code: `code`
		.replace(/`([^`]+)`/g, "$1")
		// Markdown links: [text](url) -> text
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

/**
 * Parses markdown manuscript content into a sequential list of structured blocks.
 */
export function parseMarkdownBlocks(rawContent: string): MarkdownBlock[] {
	const cleaned = stripFrontmatter(rawContent);
	const withCleanLinks = stripWikilinks(cleaned);
	const lines = withCleanLinks.split(/\r?\n/);
	const blocks: MarkdownBlock[] = [];

	let currentParagraphLines: string[] = [];

	function flushParagraph() {
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

	for (const line of lines) {
		const trimmed = line.trim();

		// Empty line flushes current paragraph
		if (!trimmed) {
			flushParagraph();
			continue;
		}

		// Horizontal rule / scene break: ***, ---, ___
		if (/^(?:\*\s*){3,}$|^(?:-\s*){3,}$|^(?:_\s*){3,}$/.test(trimmed)) {
			flushParagraph();
			blocks.push({ type: "divider" });
			continue;
		}

		// Headings: # H1, ## H2, ### H3
		const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
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

		// Bullet list items: - item, * item
		if (/^[-*+]\s+/.test(trimmed)) {
			flushParagraph();
			const itemText = cleanInlineMarkdown(
				trimmed.replace(/^[-*+]\s+/, "").trim(),
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
