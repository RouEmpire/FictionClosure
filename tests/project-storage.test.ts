import { describe, expect, it, afterEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
	atomicWriteFile,
	clearCrashCache,
	exportPdfToFile,
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

	it("manages arbitrary nested folders with .directory.json and folder metadata", async () => {
		const project: ProjectInfo = {
			name: "Nested Folders Novel",
			author: "Author C",
			genre: "Epic Fantasy",
			targetWordCount: 100000,
		};

		const folders = [
			{
				id: "folder-manuscript",
				name: "Manuscript",
				type: "manuscript" as const,
				icon: "fa-solid fa-book-open",
				tags: ["main"],
				note: "Main manuscript chapters",
				relativePath: "manuscript",
				createdAt: "2026-10-20T00:00:00Z",
				updatedAt: "2026-10-20T00:00:00Z",
				parentId: null,
			},
			{
				id: "folder-act-1",
				name: "Act One: The Awakening",
				type: "manuscript" as const,
				icon: "fa-solid fa-folder-open",
				tags: ["act-1", "intro"],
				note: "The opening five chapters introducing the kingdom of Valdor.",
				relativePath: "manuscript/act-one",
				createdAt: "2026-10-20T00:00:00Z",
				updatedAt: "2026-10-20T00:00:00Z",
				parentId: "folder-manuscript",
			},
			{
				id: "folder-act-1-part-a",
				name: "Part A - Crossing",
				type: "manuscript" as const,
				icon: "fa-solid fa-compass",
				tags: ["journey", "depth-3"],
				note: "Subfolder at depth 3 containing early crossing drafts.",
				relativePath: "manuscript/act-one/part-a",
				createdAt: "2026-10-20T00:00:00Z",
				updatedAt: "2026-10-20T00:00:00Z",
				parentId: "folder-act-1",
			},
			{
				id: "folder-valdor-citadel",
				name: "Valdor Citadel",
				type: "world" as const,
				icon: "fa-solid fa-fort-awesome",
				tags: ["capital", "citadel", "fortress"],
				note: "Ancient fortified capital with three concentric walls.",
				relativePath: "world/locations/valdor/citadel",
				createdAt: "2026-10-20T00:00:00Z",
				updatedAt: "2026-10-20T00:00:00Z",
				parentId: null,
			},
		];

		const documents: FictionDocument[] = [
			{
				id: "ch-deep-1",
				title: "Chapter in Part A",
				type: "manuscript",
				status: "draft",
				tags: ["nested"],
				order: 1,
				folderId: "folder-act-1-part-a",
				createdAt: "2026-10-20T00:00:00Z",
				updatedAt: "2026-10-20T00:00:00Z",
				content: "# Chapter in Part A\n\nDeep nested content inside [[Act One: The Awakening]] and [[Valdor Citadel]].",
			},
		];

		const saveRes = await saveProjectToFolder(testDir, project, documents, undefined, undefined, folders);
		expect(saveRes.success).toBe(true);

		// 1. Verify .directory.json exists in each nested folder
		const act1DirJson = path.join(testDir, "manuscript", "act-one", ".directory.json");
		expect(fs.existsSync(act1DirJson)).toBe(true);
		const act1Meta = JSON.parse(fs.readFileSync(act1DirJson, "utf8"));
		expect(act1Meta.id).toBe("folder-act-1");
		expect(act1Meta.name).toBe("Act One: The Awakening");
		expect(act1Meta.tags).toEqual(["act-1", "intro"]);
		expect(act1Meta.note).toContain("The opening five chapters");

		const partADirJson = path.join(testDir, "manuscript", "act-one", "part-a", ".directory.json");
		expect(fs.existsSync(partADirJson)).toBe(true);
		const partAMeta = JSON.parse(fs.readFileSync(partADirJson, "utf8"));
		expect(partAMeta.id).toBe("folder-act-1-part-a");
		expect(partAMeta.tags).toEqual(["journey", "depth-3"]);

		const citadelDirJson = path.join(testDir, "world", "locations", "valdor", "citadel", ".directory.json");
		expect(fs.existsSync(citadelDirJson)).toBe(true);
		const citadelMeta = JSON.parse(fs.readFileSync(citadelDirJson, "utf8"));
		expect(citadelMeta.name).toBe("Valdor Citadel");
		expect(citadelMeta.tags).toContain("citadel");

		// 2. Verify document written inside the nested folder
		const deepDocPath = path.join(testDir, "manuscript", "act-one", "part-a", "01_chapter-in-part-a.md");
		expect(fs.existsSync(deepDocPath)).toBe(true);

		// 3. Load back project and verify folders hierarchy & document association
		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.folders).toBeDefined();

		const loadedAct1 = loadRes.folders?.find((f) => f.id === "folder-act-1" || f.relativePath === "manuscript/act-one");
		expect(loadedAct1).toBeDefined();
		expect(loadedAct1?.name).toBe("Act One: The Awakening");
		expect(loadedAct1?.tags).toEqual(["act-1", "intro"]);
		expect(loadedAct1?.note).toContain("The opening five chapters");

		const loadedDoc = loadRes.documents?.find((d) => d.id === "ch-deep-1");
		expect(loadedDoc).toBeDefined();
		expect(loadedDoc?.title).toBe("Chapter in Part A");
		expect(loadedDoc?.folderId).toBe("folder-act-1-part-a");
	});

	it("saves and loads project settings, custom README.md, and cover images across supported formats", async () => {
		const { isSupportedCoverFile, getCoverFormatLabel, SUPPORTED_COVER_EXTENSIONS } = await import(
			"../src/shared/domain/coverSupport"
		);

		// Verify supported extensions
		const requiredFormats = [
			".jpg",
			".jpeg",
			".jxl",
			".png",
			".avif",
			".webp",
			".gif",
			".tif",
			".tiff",
			".heic",
			".heif",
			".psd",
			".psb",
			".pdf",
			".apng",
		];
		for (const fmt of requiredFormats) {
			expect(SUPPORTED_COVER_EXTENSIONS).toContain(fmt as any);
			expect(isSupportedCoverFile(`my-book-cover${fmt}`)).toBe(true);
		}

		// Verify labels
		expect(getCoverFormatLabel("cover.psd")).toBe("PSD");
		expect(getCoverFormatLabel("cover.pdf")).toBe("PDF");
		expect(getCoverFormatLabel("cover.jxl")).toBe("JXL");
		expect(getCoverFormatLabel("cover.heic")).toBe("HEIC");

		// Test project with custom settings, custom README and base64 cover
		const customReadme = `# The Obsidian Spire\n\nA custom dark fantasy chronicle.\n\n## World Lore\nDetails about the realm.\n`;
		// 1x1 transparent PNG in base64
		const sampleCoverDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

		const project: ProjectInfo = {
			name: "The Obsidian Spire",
			author: "Morgan Blackwood",
			genre: "Dark Fantasy",
			targetWordCount: 120000,
			readme: customReadme,
			coverImage: sampleCoverDataUrl,
		};

		const documents: FictionDocument[] = [
			{
				id: "ch-1",
				title: "Chapter 1: Shadows Fall",
				type: "manuscript",
				status: "draft",
				tags: ["opening"],
				order: 1,
				createdAt: "2026-10-22T00:00:00Z",
				updatedAt: "2026-10-22T00:00:00Z",
				content: "# Shadows Fall\n\nThe gates slammed shut.\n",
			},
		];

		const saveRes = await saveProjectToFolder(testDir, project, documents);
		expect(saveRes.success).toBe(true);

		// 1. Verify README.md was saved with custom content
		const readmeOnDisk = fs.readFileSync(path.join(testDir, "README.md"), "utf8");
		expect(readmeOnDisk).toBe(customReadme);

		// 2. Verify cover image was decoded and written to media/covers/cover.png
		const coverOnDisk = path.join(testDir, "media", "covers", "cover.png");
		expect(fs.existsSync(coverOnDisk)).toBe(true);
		const coverBytes = fs.readFileSync(coverOnDisk);
		expect(coverBytes.length).toBeGreaterThan(0);

		// Add an alternate cover format (e.g. PSD cover) directly to media/covers/
		const psdCoverPath = path.join(testDir, "media", "covers", "alternate-jacket.psd");
		fs.writeFileSync(psdCoverPath, "8BPS mock photoshop buffer");

		// 3. Load back project
		const loadRes = await loadProjectFromFolder(testDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.project).toBeDefined();

		const loaded = loadRes.project!;
		expect(loaded.name).toBe("The Obsidian Spire");
		expect(loaded.author).toBe("Morgan Blackwood");
		expect(loaded.genre).toBe("Dark Fantasy");
		expect(loaded.targetWordCount).toBe(120000);
		expect(loaded.readme).toBe(customReadme);
		expect(loaded.coverImage).toBeDefined();
		expect(loaded.coverImage).toContain("data:image/png;base64");
		expect(loaded.covers).toBeDefined();
		expect(loaded.covers?.length).toBe(2);
		expect(loaded.covers?.some((c) => c.endsWith("alternate-jacket.psd"))).toBe(true);
	});

	it("saves exported PDF to exports/ directory atomically", () => {
		const pdfBytes = Buffer.from("%PDF-1.4 Mock PDF Binary Content");
		const base64 = pdfBytes.toString("base64");
		const fileName = "The_Obsidian_Spire_2026.pdf";

		const res = exportPdfToFile(testDir, fileName, base64);
		expect(res.success).toBe(true);
		expect(res.filePath).toBeDefined();

		const expectedFile = path.join(testDir, "exports", fileName);
		expect(fs.existsSync(expectedFile)).toBe(true);
		const content = fs.readFileSync(expectedFile);
		expect(content.toString()).toContain("%PDF-1.4");
	});
});
