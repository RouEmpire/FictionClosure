import { describe, expect, test, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
	HistoryManager,
	calculateMaxStackSize,
} from "../src/mainview/services/historyManager";
import {
	saveProjectToFolder,
	loadProjectFromFolder,
} from "../src/bun/project-storage";
import type { FictionDocument, ProjectInfo } from "../src/shared/types";

describe("HistoryManager & Undo/Redo Stacks", () => {
	test("calculates max stack size as exactly half of targetWordCount", () => {
		expect(calculateMaxStackSize(50000)).toBe(25000);
		expect(calculateMaxStackSize(10000)).toBe(5000);
		expect(calculateMaxStackSize(1000)).toBe(500);
		expect(calculateMaxStackSize(50)).toBe(25);
		// Minimum safe guard
		expect(calculateMaxStackSize(0)).toBe(10);
		expect(calculateMaxStackSize(undefined)).toBe(1000);
	});

	test("records edits and performs undo and redo with proper state transitions", () => {
		const mgr = new HistoryManager(100); // max size = 50
		const docId = "test-doc-1";

		expect(mgr.canUndo(docId)).toBe(false);
		expect(mgr.canRedo(docId)).toBe(false);

		// First edit burst
		mgr.recordEdit(docId, "Hello", "Hello world", 11, true);
		expect(mgr.canUndo(docId)).toBe(true);
		expect(mgr.canRedo(docId)).toBe(false);

		// Second edit burst
		mgr.recordEdit(docId, "Hello world", "Hello world!", 12, true);
		expect(mgr.canUndo(docId)).toBe(true);

		// Undo step 1
		const undo1 = mgr.undo(docId, "Hello world!", 12);
		expect(undo1).not.toBeNull();
		expect(undo1?.content).toBe("Hello world");
		expect(mgr.canRedo(docId)).toBe(true);

		// Undo step 2
		const undo2 = mgr.undo(docId, "Hello world", 11);
		expect(undo2).not.toBeNull();
		expect(undo2?.content).toBe("Hello");

		// Cannot undo past initial
		expect(mgr.undo(docId, "Hello", 5)).toBeNull();

		// Redo step 1
		const redo1 = mgr.redo(docId, "Hello", 5);
		expect(redo1).not.toBeNull();
		expect(redo1?.content).toBe("Hello world");

		// Redo step 2
		const redo2 = mgr.redo(docId, "Hello world", 11);
		expect(redo2).not.toBeNull();
		expect(redo2?.content).toBe("Hello world!");
		expect(mgr.canRedo(docId)).toBe(false);
	});

	test("new edit clears redo stack", () => {
		const mgr = new HistoryManager(100);
		const docId = "doc-branch";

		mgr.recordEdit(docId, "A", "AB", 2, true);
		mgr.recordEdit(docId, "AB", "ABC", 3, true);

		// Undo back to AB
		mgr.undo(docId, "ABC", 3);
		expect(mgr.canRedo(docId)).toBe(true);

		// User branches by typing "ABD" instead of redoing
		mgr.recordEdit(docId, "AB", "ABD", 3, true);
		expect(mgr.canRedo(docId)).toBe(false); // Redo stack was purged
	});

	test("strictly bounds undo and redo stacks to half of targetWordCount", () => {
		const targetWordCount = 20;
		const maxExpected = calculateMaxStackSize(targetWordCount); // 10
		expect(maxExpected).toBe(10);

		const mgr = new HistoryManager(targetWordCount);
		const docId = "doc-limit";

		// Record 25 immediate edits
		for (let i = 0; i < 25; i++) {
			mgr.recordEdit(docId, `Text ${i}`, `Text ${i + 1}`, i, true);
		}

		const stack = mgr.getOrCreateStack(docId);
		expect(stack.undo.length).toBe(10);
		expect(stack.undo.length).toBeLessThanOrEqual(maxExpected);
	});

	test("exports and imports stacks across sessions accurately", () => {
		const mgr1 = new HistoryManager(50000); // 25000 capacity
		const docId = "doc-persistent";

		mgr1.recordEdit(docId, "Chapter 1", "Chapter 1: The Beginning", 23, true);
		mgr1.recordEdit(docId, "Chapter 1: The Beginning", "Chapter 1: The Cold Sea", 22, true);

		const exported = mgr1.exportAllStacks(50000);
		expect(exported.schemaVersion).toBe(1);
		expect(exported.targetWordCount).toBe(50000);
		expect(exported.maxStackSize).toBe(25000);
		expect(exported.stacks[docId]).toBeDefined();
		expect(exported.stacks[docId].undo.length).toBe(2);

		// Simulate fresh app launch in a new HistoryManager instance
		const mgr2 = new HistoryManager(50000);
		mgr2.importAllStacks(exported, 50000);

		expect(mgr2.canUndo(docId)).toBe(true);
		const undone = mgr2.undo(docId, "Chapter 1: The Cold Sea", 22);
		expect(undone?.content).toBe("Chapter 1: The Beginning");
	});
});

describe("Project Storage Stacks & .gitignore Integration", () => {
	const testBaseDir = path.join(os.tmpdir(), `fictionclosure-stacks-test-${Date.now()}`);

	beforeEach(() => {
		if (fs.existsSync(testBaseDir)) {
			fs.rmSync(testBaseDir, { recursive: true, force: true });
		}
		fs.mkdirSync(testBaseDir, { recursive: true });
	});

	test("persists stacks.json and creates .gitignore ignoring stacks", async () => {
		const project: ProjectInfo = {
			name: "Stacks Test Project",
			author: "Arthur Vance",
			genre: "Fantasy",
			targetWordCount: 50000,
		};

		const docs: FictionDocument[] = [
			{
				id: "ch-1",
				title: "Chapter One",
				type: "manuscript",
				status: "draft",
				tags: ["opening"],
				order: 1,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				content: "# Chapter One\n\nIt began in thunder.\n",
			},
		];

		const historyMgr = new HistoryManager(50000);
		historyMgr.recordEdit("ch-1", "Initial draft", "# Chapter One\n\nIt began in thunder.\n", 30, true);
		const stacks = historyMgr.exportAllStacks(50000);

		// Save project with stacks
		const saveRes = await saveProjectToFolder(testBaseDir, project, docs, stacks);
		expect(saveRes.success).toBe(true);

		// Verify stacks.json was created on disk
		const stacksFilePath = path.join(testBaseDir, "stacks.json");
		expect(fs.existsSync(stacksFilePath)).toBe(true);
		const stacksContent = JSON.parse(fs.readFileSync(stacksFilePath, "utf8"));
		expect(stacksContent.schemaVersion).toBe(1);
		expect(stacksContent.targetWordCount).toBe(50000);
		expect(stacksContent.stacks["ch-1"].undo.length).toBe(1);

		// Verify .gitignore was created and ignores stacks.json
		const gitignorePath = path.join(testBaseDir, ".gitignore");
		expect(fs.existsSync(gitignorePath)).toBe(true);
		const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
		expect(gitignoreContent).toContain("stacks.json");
		expect(gitignoreContent).toContain(".stacks.json");

		// Load project back from disk
		const loadRes = await loadProjectFromFolder(testBaseDir);
		expect(loadRes.success).toBe(true);
		expect(loadRes.stacks).toBeDefined();
		expect(loadRes.stacks?.stacks["ch-1"].undo.length).toBe(1);

		// Clean up
		fs.rmSync(testBaseDir, { recursive: true, force: true });
	});
});
