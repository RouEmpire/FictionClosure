import { describe, expect, it, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
	atomicWriteFile,
	clearCrashCache,
	loadProjectFromFolder,
	parseDocumentFromMarkdown,
	saveCrashCache,
	saveProjectToFolder,
	serializeDocumentToMarkdown,
	slugifyTitle,
} from "../src/bun/project-storage";
import type { FictionDocument, ProjectHistoryStacks, ProjectInfo } from "../src/shared/types";

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

	it("creates advanced project structure, .gitignore, README.md, and initializes git", async () => {
		const project: ProjectInfo = {
			name: "Advanced Structure Novel",
			author: "Author B",
			genre: "Sci-Fi",
			targetWordCount: 75000,
		};

		const documents: FictionDocument[] = [
			{
				id: "plot-1",
				title: "Main Heist Arc",
				type: "plot",
				status: "in-progress",
				tags: ["Heist", "Arc"],
				order: 1,
				createdAt: "2026-10-10T00:00:00Z",
				updatedAt: "2026-10-10T00:00:00Z",
				content: "# Main Heist Arc\n\nStakes are high.",
			},
		];

		const saveRes = await saveProjectToFolder(testDir, project, documents);
		expect(saveRes.success).toBe(true);

		// Verify canonical directories
		expect(fs.existsSync(path.join(testDir, "manuscript"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "characters"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "plots"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "plots", "subplots"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "plots", "arcs"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "world", "locations"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "world", "cultures"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "world", "systems"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "world", "history"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "notes", "outlines"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "notes", "research"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "notes", "ideas"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "media", "images"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "media", "covers"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "media", "audio"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "media", "attachments"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, "exports"))).toBe(true);

		// Verify README.md and .gitignore
		expect(fs.existsSync(path.join(testDir, "README.md"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".gitignore"))).toBe(true);
		const gitignoreContent = fs.readFileSync(path.join(testDir, ".gitignore"), "utf8");
		expect(gitignoreContent).toContain(".fictionclosure/history/");
		expect(gitignoreContent).toContain(".fictionclosure/cache/");
		expect(gitignoreContent).toContain("!.fictionclosure/schema.json");

		// Verify Git repository initialized
		expect(fs.existsSync(path.join(testDir, ".git"))).toBe(true);

		// Verify .fictionclosure structure
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "schema.json"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "state", "workspace.json"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "state", "session.json"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "history", "transactions"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "history", "checkpoints"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "index"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "cache"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "migrations"))).toBe(true);
		expect(fs.existsSync(path.join(testDir, ".fictionclosure", "extensions"))).toBe(true);

		// Verify plot document was saved in plots/
		expect(fs.existsSync(path.join(testDir, "plots", "main-heist-arc.md"))).toBe(true);

		// Verify loading back plot document
		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		const plotDoc = loadRes.documents?.find((d) => d.id === "plot-1");
		expect(plotDoc).toBeDefined();
		expect(plotDoc?.type).toBe("plot");
		expect(plotDoc?.title).toBe("Main Heist Arc");
	});

	it("saves and restores per-document history stacks", async () => {
		const project: ProjectInfo = {
			name: "History Project",
			targetWordCount: 50000,
		};

		const documents: FictionDocument[] = [
			{
				id: "doc-1",
				title: "Chapter 1",
				type: "manuscript",
				status: "draft",
				tags: [],
				order: 1,
				createdAt: "2026-10-10T00:00:00Z",
				updatedAt: "2026-10-10T00:00:00Z",
				content: "Draft text",
			},
		];

		const stacks: ProjectHistoryStacks = {
			schemaVersion: 1,
			updatedAt: new Date().toISOString(),
			targetWordCount: 50000,
			maxStackSize: 25000,
			stacks: {
				"doc-1": {
					undo: [
						{ content: "Draft initial", timestamp: 1000 },
						{ content: "Draft text", timestamp: 2000 },
					],
					redo: [],
				},
			},
		};

		const saveRes = await saveProjectToFolder(testDir, project, documents, stacks);
		expect(saveRes.success).toBe(true);

		// Check per-document undo.json & checkpoint.json
		const undoPath = path.join(testDir, ".fictionclosure", "history", "documents", "doc-1", "undo.json");
		const checkpointPath = path.join(testDir, ".fictionclosure", "history", "documents", "doc-1", "checkpoint.json");
		expect(fs.existsSync(undoPath)).toBe(true);
		expect(fs.existsSync(checkpointPath)).toBe(true);

		const parsedUndo = JSON.parse(fs.readFileSync(undoPath, "utf8"));
		expect(parsedUndo.undo.length).toBe(2);
		expect(parsedUndo.undo[0].content).toBe("Draft initial");

		// Load project and verify stacks restored
		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.stacks?.stacks["doc-1"]).toBeDefined();
		expect(loadRes.stacks?.stacks["doc-1"].undo.length).toBe(2);
		expect(loadRes.stacks?.stacks["doc-1"].undo[1].content).toBe("Draft text");
	});

	it("manages crash recovery cache correctly", async () => {
		const project: ProjectInfo = {
			name: "Crash Cache Novel",
			folderPath: testDir,
		};

		const documents: FictionDocument[] = [
			{
				id: "doc-live",
				title: "Live Chapter",
				type: "manuscript",
				status: "draft",
				tags: [],
				order: 1,
				createdAt: "2026-10-10T00:00:00Z",
				updatedAt: "2026-10-10T00:00:00Z",
				content: "Disk version of chapter",
			},
		];

		// First save project to disk
		await saveProjectToFolder(testDir, project, documents);

		// Simulate unsaved user edits cached during crash
		const unsavedDocs: FictionDocument[] = [
			{
				...documents[0],
				content: "Disk version of chapter with 500 words of brilliant uncommitted writing",
			},
		];

		saveCrashCache(testDir, project, unsavedDocs);

		// Verify cache file exists
		const cacheFile = path.join(testDir, ".fictionclosure", "cache", "unsaved-recovery.json");
		expect(fs.existsSync(cacheFile)).toBe(true);
		const cacheContent = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
		expect(cacheContent.hasUnsavedChanges).toBe(true);
		expect(cacheContent.documents[0].content).toContain("brilliant uncommitted writing");

		// Load project - should detect recoveryData with hasUnsavedChanges === true
		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.recoveryData).toBeDefined();
		expect(loadRes.recoveryData?.hasUnsavedChanges).toBe(true);
		expect(loadRes.recoveryData?.documents[0].content).toContain("brilliant uncommitted writing");

		// Simulate user discarding cache or successfully saving
		clearCrashCache(testDir);
		const loadResAfterClear = await loadProjectFromFolder(testDir);
		expect(loadResAfterClear.recoveryData?.hasUnsavedChanges).toBe(false);
	});
});
