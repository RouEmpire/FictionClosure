import { describe, test, expect } from "bun:test";
import { markdownToPlainText, extractWikilinks, countContentLines } from "../src/shared/domain/markdown";
import {
	slugifyTitle,
	getDocumentRelativePath,
	getDocumentSystemPath,
} from "../src/shared/domain/documentPaths";
import type { FictionDocument, ProjectFolder } from "../src/shared/types";

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

	test("extractWikilinks identifies both document and folder mentions in manuscript prose", () => {
		const prose = `# The Whispering Harbor

Elena paused at the gates of [[Valdor Citadel]] and surveyed [[Port of Shadows]].
She consulted her dossier on [[Elena Vance]] and cross-referenced [[Subplots/The Heist]].
Also check the [[Magic Systems]] documentation.
`;
		const mentions = extractWikilinks(prose);
		expect(mentions).toContain("Valdor Citadel");
		expect(mentions).toContain("Port of Shadows");
		expect(mentions).toContain("Elena Vance");
		expect(mentions).toContain("Subplots/The Heist");
		expect(mentions).toContain("Magic Systems");

		// Test matching against folders and documents
		const testFolders: ProjectFolder[] = [
			{
				id: "f-valdor",
				name: "Valdor Citadel",
				type: "world",
				icon: "fa-solid fa-fort-awesome",
				tags: ["capital"],
				relativePath: "world/locations/valdor",
				createdAt: "2026-10-20",
				updatedAt: "2026-10-20",
				parentId: null,
			},
			{
				id: "f-systems",
				name: "Magic Systems",
				type: "world",
				icon: "fa-solid fa-gears",
				tags: ["systems"],
				relativePath: "world/systems",
				createdAt: "2026-10-20",
				updatedAt: "2026-10-20",
				parentId: null,
			},
		];

		const testDocs: FictionDocument[] = [
			{
				id: "d-elena",
				title: "Elena Vance",
				type: "character",
				status: "draft",
				order: 1,
				content: "Main protagonist",
				tags: [],
				createdAt: "2026-10-20",
				updatedAt: "2026-10-20",
			},
		];

		for (const mention of mentions) {
			const targetLower = mention.toLowerCase();
			const matchedDoc = testDocs.find((d) => d.title.toLowerCase() === targetLower);
			const matchedFolder = testFolders.find((f) => f.name.toLowerCase() === targetLower);

			if (mention === "Elena Vance") {
				expect(matchedDoc).toBeDefined();
				expect(matchedFolder).toBeUndefined();
			} else if (mention === "Valdor Citadel" || mention === "Magic Systems") {
				expect(matchedFolder).toBeDefined();
				expect(matchedDoc).toBeUndefined();
			}
		}
	});

	test("preserves custom relativePath and folderId in document paths", () => {
		const docInSubfolder: FictionDocument = {
			id: "doc-nested",
			title: "Heist Beat 1",
			type: "plot",
			status: "draft",
			order: 1,
			content: "",
			tags: [],
			folderId: "folder-plots-subplots",
			relativePath: "plots/subplots/heist-beat-1.md",
			createdAt: "2026-10-20",
			updatedAt: "2026-10-20",
		};

		expect(getDocumentRelativePath(docInSubfolder)).toBe("plots/subplots/heist-beat-1.md");
		expect(getDocumentSystemPath(docInSubfolder, "/project")).toBe("/project/plots/subplots/heist-beat-1.md");
	});

	test("countContentLines ignores YAML frontmatter and accurately counts body lines", () => {
		// Empty and whitespace cases
		expect(countContentLines("")).toBe(0);
		expect(countContentLines("   \n\n\t  ")).toBe(0);

		// Frontmatter only
		const frontmatterOnly = `---
title: "Empty Chapter"
tags: [test]
---
`;
		expect(countContentLines(frontmatterOnly)).toBe(0);

		// Single line content
		const singleLine = `# Chapter 1: The Gathering`;
		expect(countContentLines(singleLine)).toBe(1);

		// Content with frontmatter and 5 body lines
		const fiveLinesWithFm = `---
id: "doc-123"
title: "The Silver Gate"
---
# Chapter 2

The wind howled through the ruined citadel.
Elena gripped the hilt of her blade.
No one answered.
`;
		expect(countContentLines(fiveLinesWithFm)).toBe(5);

		// Exactly 9 lines (less than 10)
		const nineLines = Array.from({ length: 9 }, (_, i) => `Paragraph line ${i + 1}`).join("\n");
		const count9 = countContentLines(nineLines);
		expect(count9).toBe(9);
		expect(count9 < 10).toBe(true);

		// Exactly 10 lines (not less than 10)
		const tenLines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join("\n");
		const count10 = countContentLines(tenLines);
		expect(count10).toBe(10);
		expect(count10 < 10).toBe(false);

		// 15 lines with frontmatter
		const fifteenLinesWithFm = `---
title: "Long Chapter"
---
${Array.from({ length: 15 }, (_, i) => `Prose sentence ${i + 1}`).join("\n")}
`;
		const count15 = countContentLines(fifteenLinesWithFm);
		expect(count15).toBe(15);
		expect(count15 < 10).toBe(false);
	});
});
