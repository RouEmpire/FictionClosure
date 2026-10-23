import { describe, test, expect, beforeEach } from "bun:test";
import {
	applyEditBurst,
	calculateMaxStackSize,
	createEmptyHistoryStack,
	createHistoryManager,
	deserializeHistoryMap,
	performRedo,
	performUndo,
	serializeHistoryMap,
	trimHistoryArray,
} from "../src/mainview/services/historyManager";
import {
	calculateDashboardStats,
	getRecentProjects,
	invalidateRecentProjectsCache,
	saveRecentProject,
	type KeyValueStorageAdapter,
} from "../src/mainview/services/recentProjects";
import {
	cleanInlineMarkdown,
	parseMarkdownBlocks,
	stripFrontmatter,
	stripWikilinks,
} from "../src/mainview/services/documentExport/markdownFormatter";
import { uint8ArrayToBase64 } from "../src/mainview/services/documentExport/exportDownloader";
import {
	applyPageNumbers,
	paintPageBackground,
	resolveFontVariant,
	type PdfStylingCanvas,
} from "../src/mainview/services/documentExport/pdfStyler";
import type { DocumentHistoryStack, RecentProject } from "../src/shared/types";

describe("SOLID & Functional Refactoring Verification", () => {
	describe("historyManager (Zero OOP / Pure Functions & Closures)", () => {
		test("trimHistoryArray limits history snapshot count using fast slicing", () => {
			const snapshots = Array.from({ length: 50 }, (_, i) => ({
				content: `version-${i}`,
				timestamp: 1000 + i,
			}));
			const trimmed = trimHistoryArray(snapshots, 20);
			expect(trimmed.length).toBe(20);
			expect(trimmed[0].content).toBe("version-30");
			expect(trimmed[19].content).toBe("version-49");
		});

		test("pure stack operations: applyEditBurst, performUndo, and performRedo", () => {
			const stack = createEmptyHistoryStack();
			const maxSize = 5;

			// Add edit bursts
			applyEditBurst(stack, "draft 1", 5, 1000, maxSize);
			applyEditBurst(stack, "draft 2", 10, 2000, maxSize);

			expect(stack.undo.length).toBe(2);
			expect(stack.redo.length).toBe(0);

			// Undo
			const restored1 = performUndo(stack, "draft 3", 15, 3000, maxSize);
			expect(restored1?.content).toBe("draft 2");
			expect(stack.undo.length).toBe(1);
			expect(stack.redo.length).toBe(1);

			// Redo
			const redone = performRedo(stack, "draft 2", 10, 4000, maxSize);
			expect(redone?.content).toBe("draft 3");
			expect(stack.undo.length).toBe(2);
			expect(stack.redo.length).toBe(0);
		});

		test("createHistoryManager provides functional closure with isolated state", () => {
			const manager = createHistoryManager(200); // max size = 100
			const docId = "chapter-1";

			expect(manager.canUndo(docId)).toBe(false);
			manager.recordEdit(docId, "A", "AB", 2, true);
			expect(manager.canUndo(docId)).toBe(true);

			const undoSnap = manager.undo(docId, "AB", 2);
			expect(undoSnap?.content).toBe("A");
			expect(manager.canRedo(docId)).toBe(true);

			// Serializing and deserializing
			const serialized = manager.exportAllStacks(200);
			expect(serialized.stacks[docId]).toBeDefined();

			const manager2 = createHistoryManager(200);
			manager2.importAllStacks(serialized, 200);
			expect(manager2.canRedo(docId)).toBe(true);
		});
	});

	describe("recentProjects (KeyValueStorage Dependency Inversion & Performance Caching)", () => {
		let mockStore: Map<string, string>;
		let adapter: KeyValueStorageAdapter;

		beforeEach(() => {
			mockStore = new Map();
			adapter = {
				getItem: (k) => mockStore.get(k) ?? null,
				setItem: (k, v) => {
					mockStore.set(k, v);
				},
				removeItem: (k) => {
					mockStore.delete(k);
				},
			};
			invalidateRecentProjectsCache();
		});

		test("injects custom KeyValueStorage adapter without touching global localStorage", () => {
			const initial = getRecentProjects(adapter);
			expect(initial.length).toBeGreaterThanOrEqual(1);

			const newRecord: RecentProject = {
				id: "custom-p1",
				name: "Custom Mock Novel",
				folderPath: "/path/custom",
				lastOpened: new Date().toISOString(),
				targetWordCount: 50000,
				wordCount: 15000,
				documentCount: 3,
				manuscriptCount: 2,
				characterCount: 1,
				worldCount: 0,
				notesCount: 0,
			};

			saveRecentProject(newRecord, adapter);
			const updated = getRecentProjects(adapter);
			expect(updated.some((p) => p.id === "custom-p1")).toBe(true);
		});

		test("memoizes parsed results in memory when storage payload is unchanged", () => {
			const res1 = getRecentProjects(adapter);
			const res2 = getRecentProjects(adapter);
			// Exact reference equality due to cache
			expect(res1).toBe(res2);
		});
	});

	describe("exportDownloader (32KB Chunked Base64 Batch Encoding)", () => {
		test("encodes large binary payloads (> 65KB) identically to native Buffer", () => {
			// Create a 70KB random byte array to test multiple 32KB chunks
			const largeBuffer = new Uint8Array(70000);
			for (let i = 0; i < largeBuffer.length; i++) {
				largeBuffer[i] = (i * 37) % 256;
			}

			const expectedBase64 = Buffer.from(largeBuffer).toString("base64");
			const actualBase64 = uint8ArrayToBase64(largeBuffer);

			expect(actualBase64).toBe(expectedBase64);
			expect(actualBase64.length).toBe(expectedBase64.length);
		});
	});

	describe("markdownFormatter (Fast-Path Bypasses & Precompiled Regexes)", () => {
		test("cleanInlineMarkdown bypasses regex operations when no markdown tokens exist", () => {
			const cleanProse = "The old lighthouse keeper watched the ships sail into the bay.";
			const result = cleanInlineMarkdown(cleanProse);
			expect(result).toBe(cleanProse);
		});

		test("cleanInlineMarkdown strips markdown formatting characters cleanly", () => {
			const formatted = "A **bold** warrior and an *agile* rogue found `treasure` at [Castle](http://c.com).";
			const result = cleanInlineMarkdown(formatted);
			expect(result).toBe("A bold warrior and an agile rogue found treasure at Castle.");
		});

		test("stripWikilinks resolves simple and aliased wikilinks", () => {
			const text = "He met [[John Doe]] in [[CapitalCity|The Great City]].";
			expect(stripWikilinks(text)).toBe("He met John Doe in The Great City.");
		});
	});

	describe("pdfStyler (Structural PdfStylingCanvas Interface & Zero 'any')", () => {
		test("paintPageBackground and applyPageNumbers work with mock canvas without 'any'", () => {
			const calls: string[] = [];
			const mockCanvas: PdfStylingCanvas = {
				page: { width: 612, height: 792 },
				save: () => calls.push("save"),
				restore: () => calls.push("restore"),
				rect: (x, y, w, h) => {
					calls.push(`rect(${x},${y},${w},${h})`);
					return { fill: (c) => calls.push(`fill(${c})`) };
				},
				font: (f) => {
					calls.push(`font(${f})`);
					return mockCanvas;
				},
				fontSize: (s) => {
					calls.push(`fontSize(${s})`);
					return mockCanvas;
				},
				fillColor: (c) => {
					calls.push(`fillColor(${c})`);
					return mockCanvas;
				},
				text: (t) => calls.push(`text(${t})`),
				switchToPage: (p) => calls.push(`switchToPage(${p})`),
				bufferedPageRange: () => ({ start: 0, count: 2 }),
			};

			paintPageBackground(mockCanvas, "#ffffff");
			expect(calls).toContain("rect(0,0,612,792)");
			expect(calls).toContain("fill(#ffffff)");

			applyPageNumbers(mockCanvas, {
				textColor: "#000000",
				fontFamily: "Helvetica",
				startFromPage: 0,
			});
			expect(calls).toContain("switchToPage(0)");
			expect(calls).toContain("switchToPage(1)");
			expect(calls).toContain("text(1/2)");
			expect(calls).toContain("text(2/2)");
		});
	});
});
