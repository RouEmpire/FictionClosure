/**
 * Utility functions for safe Markdown parsing, word counting, and link extraction.
 * Complies with FictionClosure security rules: all content is sanitized against untrusted HTML.
 */

export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function extractWikilinks(text: string): string[] {
	const regex = /\[\[([^\]]+)\]\]/g;
	const links = new Set<string>();
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) {
		const target = match[1]?.trim();
		if (target) {
			links.add(target);
		}
	}
	return Array.from(links);
}

export function calculateWordCount(text: string): number {
	const cleaned = text
		.replace(/^---[\s\S]*?---/, "") // strip frontmatter if present
		.replace(/#+\s+/g, "") // strip headings
		.replace(/\[\[(.*?)\]\]/g, "$1") // replace wikilinks with inner text
		.replace(/\[(.*?)\]\(.*?\)/g, "$1") // replace links with text
		.trim();

	if (!cleaned) return 0;
	const words = cleaned.match(/[\p{L}\p{N}'-]+/gu);
	return words ? words.length : 0;
}

export function estimateReadingTimeMinutes(wordCount: number): number {
	// Average adult reading speed: ~225 words per minute
	return Math.max(1, Math.ceil(wordCount / 225));
}

/**
 * Count the number of content lines in a document, excluding YAML frontmatter.
 */
export function countContentLines(text: string): number {
	if (!text) return 0;
	// Strip YAML frontmatter if present at the start of text
	const body = text.replace(/^---[\r\n]+[\s\S]*?[\r\n]+---[\r\n]*/, "");
	if (!body || body.trim() === "") return 0;
	// Strip single trailing newline so final newline doesn't count as an extra empty line
	const normalized = body.replace(/\r?\n$/, "");
	return normalized.split(/\r?\n/).length;
}

/**
 * Lightweight and safe Markdown to HTML converter.
 */
export function renderMarkdown(markdown: string): string {
	if (!markdown) return "";

	// Split by code blocks first to protect code content
	const lines = markdown.split("\n");
	const htmlParts: string[] = [];
	let inCodeBlock = false;
	let codeBlockLang = "";
	let codeBlockLines: string[] = [];
	let inList = false;
	let listType: "ul" | "ol" = "ul";

	function closeList() {
		if (inList) {
			htmlParts.push(listType === "ul" ? "</ul>" : "</ol>");
			inList = false;
		}
	}

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i] ?? "";

		// Code block delimiter
		if (rawLine.startsWith("```")) {
			if (inCodeBlock) {
				htmlParts.push(
					`<pre class="code-block" data-lang="${escapeHtml(codeBlockLang)}"><code>${codeBlockLines.map(escapeHtml).join("\n")}</code></pre>`,
				);
				inCodeBlock = false;
				codeBlockLang = "";
				codeBlockLines = [];
			} else {
				closeList();
				inCodeBlock = true;
				codeBlockLang = rawLine.slice(3).trim();
			}
			continue;
		}

		if (inCodeBlock) {
			codeBlockLines.push(rawLine);
			continue;
		}

		// Empty line
		if (rawLine.trim() === "") {
			closeList();
			continue;
		}

		// Headings
		const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch && headingMatch[1] && headingMatch[2]) {
			closeList();
			const level = headingMatch[1].length;
			const headingText = formatInline(headingMatch[2]);
			htmlParts.push(`<h${level} class="doc-heading h${level}">${headingText}</h${level}>`);
			continue;
		}

		// Horizontal rule
		if (/^(\*{3,}|-{3,}|_{3,})$/.test(rawLine.trim())) {
			closeList();
			htmlParts.push('<hr class="divider" />');
			continue;
		}

		// Blockquote
		if (rawLine.startsWith("> ")) {
			closeList();
			const quoteText = formatInline(rawLine.slice(2));
			htmlParts.push(`<blockquote class="doc-blockquote">${quoteText}</blockquote>`);
			continue;
		}

		// Checklist item: - [ ] or - [x]
		const checkMatch = rawLine.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
		if (checkMatch && checkMatch[1] !== undefined && checkMatch[2] !== undefined) {
			if (!inList || listType !== "ul") {
				closeList();
				htmlParts.push('<ul class="doc-checklist">');
				inList = true;
				listType = "ul";
			}
			const isChecked = checkMatch[1].toLowerCase() === "x";
			const itemText = formatInline(checkMatch[2]);
			htmlParts.push(
				`<li class="task-item"><input type="checkbox" disabled ${isChecked ? "checked" : ""} /> <span>${itemText}</span></li>`,
			);
			continue;
		}

		// Unordered list item: - or *
		const ulMatch = rawLine.match(/^[-*]\s+(.*)$/);
		if (ulMatch && ulMatch[1]) {
			if (!inList || listType !== "ul") {
				closeList();
				htmlParts.push('<ul class="doc-list">');
				inList = true;
				listType = "ul";
			}
			htmlParts.push(`<li>${formatInline(ulMatch[1])}</li>`);
			continue;
		}

		// Ordered list item: 1.
		const olMatch = rawLine.match(/^(\d+)\.\s+(.*)$/);
		if (olMatch && olMatch[2]) {
			if (!inList || listType !== "ol") {
				closeList();
				htmlParts.push('<ol class="doc-ordered-list">');
				inList = true;
				listType = "ol";
			}
			htmlParts.push(`<li>${formatInline(olMatch[2])}</li>`);
			continue;
		}

		// Regular paragraph
		closeList();
		htmlParts.push(`<p class="doc-paragraph">${formatInline(rawLine)}</p>`);
	}

	closeList();
	return htmlParts.join("\n");
}

/**
 * Format inline markdown: bold, italic, code, links, and [[wikilinks]]
 */
function formatInline(text: string): string {
	let escaped = escapeHtml(text);

	// Inline code: `code`
	escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

	// Wikilinks: [[Target Name]]
	escaped = escaped.replace(
		/\[\[([^\]]+)\]\]/g,
		'<button type="button" class="wikilink-btn" data-wikilink="$1" title="Jump to $1">[[ $1 ]]</button>',
	);

	// Standard Markdown links: [text](url)
	escaped = escaped.replace(
		/\[([^\]]+)\]\(([^)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer" class="doc-link">$1</a>',
	);

	// Bold: **text** or __text__
	escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	escaped = escaped.replace(/__([^_]+)__/g, "<strong>$1</strong>");

	// Italic: *text* or _text_
	escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");
	escaped = escaped.replace(/_([^_]+)_/g, "<em>$1</em>");

	// Strikethrough: ~~text~~
	escaped = escaped.replace(/~~([^~]+)~~/g, "<del>$1</del>");

	return escaped;
}

/**
 * Strips all Markdown syntax, frontmatter, and formatting to produce clean, natural plain text.
 */
export function markdownToPlainText(markdown: string): string {
	if (!markdown) return "";

	return markdown
		// Remove YAML frontmatter
		.replace(/^---[\s\S]*?---\n*/, "")
		// Remove HTML comments
		.replace(/<!--[\s\S]*?-->/g, "")
		// Remove fenced code blocks delimiters (preserve code contents)
		.replace(/```[^\n]*\n([\s\S]*?)```/g, "$1")
		// Remove inline code ticks
		.replace(/`([^`]+)`/g, "$1")
		// Remove images ![alt](url) -> alt
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
		// Convert Markdown links [text](url) -> text
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		// Convert wikilinks [[target|label]] -> label, [[target]] -> target
		.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
		.replace(/\[\[([^\]]+)\]\]/g, "$1")
		// Remove headers markers (# Header -> Header)
		.replace(/^(#{1,6})\s+(.*)$/gm, "$2")
		// Remove blockquote markers (> Quote -> Quote)
		.replace(/^>\s*/gm, "")
		// Remove task list markers (- [x] Task -> Task)
		.replace(/^(\s*)[-*+]\s+\[[ xX]\]\s+/gm, "$1")
		// Remove bullet list markers (- Item -> Item)
		.replace(/^(\s*)[-*+]\s+/gm, "$1")
		// Remove ordered list numbers (1. Item -> Item)
		.replace(/^(\s*)\d+\.\s+/gm, "$1")
		// Remove horizontal rules
		.replace(/^[-*_]{3,}\s*$/gm, "")
		// Remove bold and italic formatting (**bold**, *italic*, __bold__, _italic_, ~~strike~~)
		.replace(/(\*\*|__)(.*?)\1/g, "$2")
		.replace(/(\*|_)(.*?)\1/g, "$2")
		.replace(/~~(.*?)~~/g, "$1")
		// Clean up multiple consecutive empty lines
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
