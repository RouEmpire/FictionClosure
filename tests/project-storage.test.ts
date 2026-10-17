import { describe, expect, it, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
	atomicWriteFile,
	loadProjectFromFolder,
	parseDocumentFromMarkdown,
	saveProjectToFolder,
	serializeDocumentToMarkdown,
	slugifyTitle,
} from "../src/bun/project-storage";
import type { FictionDocument, ProjectInfo } from "../src/shared/types";

describe("project-storage", () => {
	const testDir = path.join(os.tmpdir(), `fictionclosure_test_${Date.now()}`);

	afterEach(() => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	it("slugifies titles safely", () => {
		expect(slugifyTitle("Chapter 1: The Ash Harbor?")).toBe("chapter-1-the-ash-harbor");
		expect(slugifyTitle("Special / Characters & Names: Test*")).toBe("special-characters-and-names-test");
		expect(slugifyTitle("   Spaces   ")).toBe("spaces");
	});

	it("atomically writes file content", () => {
		const target = path.join(testDir, "test.txt");
		atomicWriteFile(target, "Hello FictionClosure");
		expect(fs.existsSync(target)).toBe(true);
		expect(fs.readFileSync(target, "utf8")).toBe("Hello FictionClosure");
	});

	it("serializes and parses markdown with YAML frontmatter", () => {
		const doc: FictionDocument = {
			id: "doc-1",
			title: "Chapter 1",
			type: "manuscript",
			status: "revised",
			tags: ["Act I", "Opening"],
			pov: "Elena",
			summary: "The opening scene",
			order: 1,
			createdAt: "2026-10-10T00:00:00Z",
			updatedAt: "2026-10-12T00:00:00Z",
			content: "# Chapter 1\n\nThe tide rose high.\n",
		};

		const serialized = serializeDocumentToMarkdown(doc);
		expect(serialized).toContain('title: "Chapter 1"');
		expect(serialized).toContain('pov: "Elena"');
		expect(serialized).toContain("- \"Act I\"");
		expect(serialized).toContain("# Chapter 1\n\nThe tide rose high.");

		const parsed = parseDocumentFromMarkdown(serialized, { id: "doc-1" });
		expect(parsed.title).toBe("Chapter 1");
		expect(parsed.pov).toBe("Elena");
		expect(parsed.tags).toEqual(["Act I", "Opening"]);
		expect(parsed.content.trim()).toBe("# Chapter 1\n\nThe tide rose high.");
	});

	it("saves a project to disk and loads it back accurately", async () => {
		const project: ProjectInfo = {
			name: "Test Novel",
			author: "Author A",
			genre: "Fantasy",
			targetWordCount: 50000,
		};

		const documents: FictionDocument[] = [
			{
				id: "ch-1",
				title: "Chapter One",
				type: "manuscript",
				status: "draft",
				tags: ["Opening"],
				order: 1,
				createdAt: "2026-10-10T00:00:00Z",
				updatedAt: "2026-10-10T00:00:00Z",
				content: "# Chapter One\n\nIt began in silence.",
			},
			{
				id: "char-1",
				title: "Elena Vance",
				type: "character",
				status: "completed",
				tags: ["Lead"],
				order: 1,
				createdAt: "2026-10-10T00:00:00Z",
				updatedAt: "2026-10-10T00:00:00Z",
				content: "# Elena Vance\n\nCartographer of the Isles.",
			},
		];

		const saveRes = await saveProjectToFolder(testDir, project, documents);
		expect(saveRes.success).toBe(true);
		expect(fs.existsSync(path.join(testDir, "project.json"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "manuscript", "01_chapter-one.md"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "characters", "elena-vance.md"))).toBe(true);

		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.project?.name).toBe("Test Novel");
		expect(loadRes.documents?.length).toBe(2);

		const loadedCh1 = loadRes.documents?.find((d) => d.id === "ch-1");
		expect(loadedCh1).toBeDefined();
		expect(loadedCh1?.title).toBe("Chapter One");
		expect(loadedCh1?.content.trim()).toBe("# Chapter One\n\nIt began in silence.");
	});
});
