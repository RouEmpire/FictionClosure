import { describe, test, expect } from "bun:test";
import { markdownToPlainText } from "../src/mainview/utils/markdown";
import {
	slugifyTitle,
	getDocumentRelativePath,
	getDocumentSystemPath,
} from "../src/mainview/utils/documentPaths";
import type { FictionDocument } from "../src/shared/types";

describe("Document Management & Formatting Utilities", () => {
	test("markdownToPlainText strips markdown syntax and produces clean text", () => {
		const raw = `---
id: "doc-1"
title: "Chapter 1"
---
# Chapter 1: The Gathering Storm

> In the heart of the valley, a shadow stirred.

The brave scout **Elena Vance** consulted her [[Old Map|Ancient Cartography]] and checked the [[Silver Citadel]].
She noticed *unusual footprints* and \`strange arcane residue\` near the river.

Here is a plan:
- [x] Inspect perimeter
- [ ] Contact the **High Commander**
* Gather 5 herbal remedies
1. Light the beacon
2. Retreat to safety

\`\`\`typescript
const status = "ready";
\`\`\`

![Map Overview](https://example.com/map.png)
Read more in the [Archive](https://example.com/archive).
`;

		const plain = markdownToPlainText(raw);

		// Assert frontmatter is removed
		expect(plain).not.toContain("---");
		expect(plain).not.toContain("id: \"doc-1\"");

		// Assert headers are stripped of hash markers
		expect(plain).toContain("Chapter 1: The Gathering Storm");
		expect(plain).not.toContain("# Chapter 1");

		// Assert blockquote markers are removed
		expect(plain).toContain("In the heart of the valley, a shadow stirred.");
		expect(plain).not.toContain("> In the heart");

		// Assert bold and italics are stripped
		expect(plain).toContain("Elena Vance");
		expect(plain).not.toContain("**Elena Vance**");
		expect(plain).toContain("unusual footprints");
		expect(plain).not.toContain("*unusual footprints*");

		// Assert wikilinks use alias if present or target
		expect(plain).toContain("Ancient Cartography");
		expect(plain).toContain("Silver Citadel");
		expect(plain).not.toContain("[[");

		// Assert code ticks are removed while preserving code content
		expect(plain).toContain("strange arcane residue");
		expect(plain).toContain("const status = \"ready\";");
		expect(plain).not.toContain("```");

		// Assert lists and tasks are stripped of prefixes
		expect(plain).toContain("Inspect perimeter");
		expect(plain).not.toContain("- [x]");
		expect(plain).toContain("Contact the High Commander");
		expect(plain).not.toContain("- [ ]");
		expect(plain).toContain("Gather 5 herbal remedies");
		expect(plain).toContain("Light the beacon");
		expect(plain).not.toContain("1. ");

		// Assert links and images keep clean alt/text
		expect(plain).toContain("Map Overview");
		expect(plain).toContain("Read more in the Archive.");
		expect(plain).not.toContain("https://example.com");
	});

	test("slugifyTitle creates clean filesystem-safe slugs", () => {
		expect(slugifyTitle("Chapter 1: The Awakening!")).toBe("chapter-1-the-awakening");
		expect(slugifyTitle("Elena & Thorne's Codex")).toBe("elena-and-thorne-s-codex");
		expect(slugifyTitle("  Multiple   Spaces   ")).toBe("multiple-spaces");
		expect(slugifyTitle("???")).toBe("untitled");
	});

	test("getDocumentRelativePath accurately computes relative folder paths", () => {
		const docManuscript: FictionDocument = {
			id: "doc-1",
			title: "The Awakening",
			type: "manuscript",
			status: "draft",
			order: 1,
			content: "Text",
			tags: [],
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
		};
		expect(getDocumentRelativePath(docManuscript)).toBe("manuscript/01_the-awakening.md");

		const docChar: FictionDocument = {
			id: "doc-2",
			title: "Elena Vance",
			type: "character",
			status: "draft",
			order: 2,
			content: "Text",
			tags: [],
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
		};
		expect(getDocumentRelativePath(docChar)).toBe("characters/elena-vance.md");

		const docWorld: FictionDocument = {
			id: "doc-3",
			title: "Silver Citadel",
			type: "world",
			status: "draft",
			order: 3,
			content: "Text",
			tags: [],
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
		};
		expect(getDocumentRelativePath(docWorld)).toBe("world/silver-citadel.md");

		const docNote: FictionDocument = {
			id: "doc-4",
			title: "Plot Outline",
			type: "note",
			status: "draft",
			order: 4,
			content: "Text",
			tags: [],
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
		};
		expect(getDocumentRelativePath(docNote)).toBe("notes/plot-outline.md");
	});

	test("getDocumentSystemPath combines folder root with relative path across OS formats", () => {
		const doc: FictionDocument = {
			id: "doc-1",
			title: "Chapter 1",
			type: "manuscript",
			status: "draft",
			order: 1,
			content: "",
			tags: [],
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
		};

		// Unix style path
		expect(getDocumentSystemPath(doc, "/home/user/Novel")).toBe(
			"/home/user/Novel/manuscript/01_chapter-1.md",
		);

		// Windows style path
		expect(getDocumentSystemPath(doc, "C:\\Users\\Author\\Novel")).toBe(
			"C:\\Users\\Author\\Novel\\manuscript\\01_chapter-1.md",
		);

		// Fallback when folderPath is empty
		expect(getDocumentSystemPath(doc, "")).toBe("manuscript/01_chapter-1.md");
	});
});
