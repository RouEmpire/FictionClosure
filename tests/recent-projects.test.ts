import { describe, test, expect, beforeEach } from "bun:test";
import {
	buildRecentProjectRecord,
	calculateDashboardStats,
	getRecentProjects,
	saveRecentProject,
	removeRecentProject,
	LOCAL_STORAGE_RECENT_PROJECTS,
} from "../src/mainview/services/recentProjects";
import { analyzeProject } from "../src/mainview/utils/projectAnalysis";
import type { FictionDocument, ProjectInfo, RecentProject } from "../src/shared/types";

// Mock localStorage for headless tests
const localStorageStore = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
	getItem: (key: string) => localStorageStore.get(key) ?? null,
	setItem: (key: string, value: string) => localStorageStore.set(key, value),
	removeItem: (key: string) => localStorageStore.delete(key),
	clear: () => localStorageStore.clear(),
	key: () => null,
	length: 0,
};

describe("Recent Projects Service & Dashboard Stats", () => {
	beforeEach(() => {
		localStorageStore.clear();
	});

	const mockProject: ProjectInfo = {
		name: "Chronicles of Aethelgard",
		author: "Morgan Thorne",
		genre: "Epic Fantasy",
		targetWordCount: 80000,
	};

	const mockDocs: FictionDocument[] = [
		{
			id: "ch1",
			title: "Chapter 1: The Awakening",
			type: "manuscript",
			status: "completed",
			tags: [],
			order: 1,
			createdAt: "2026-01-01",
			updatedAt: "2026-01-02",
			content: "The old bell tower struck thirteen times as darkness fell upon the valley.",
		},
		{
			id: "char-1",
			title: "Elena Vance",
			type: "character",
			status: "draft",
			tags: ["protagonist"],
			order: 2,
			createdAt: "2026-01-01",
			updatedAt: "2026-01-02",
			content: "# Elena Vance\n\nSkilled cartographer and navigator.",
		},
		{
			id: "world-1",
			title: "The Silver Citadel",
			type: "world",
			status: "draft",
			tags: ["location"],
			order: 3,
			createdAt: "2026-01-01",
			updatedAt: "2026-01-02",
			content: "# The Silver Citadel\n\nAncient mountain fortress.",
		},
	];

	test("buildRecentProjectRecord accurately calculates word and type counts", () => {
		const record = buildRecentProjectRecord(mockProject, mockDocs, "/home/user/projects/aethelgard");
		expect(record.name).toBe("Chronicles of Aethelgard");
		expect(record.folderPath).toBe("/home/user/projects/aethelgard");
		expect(record.manuscriptCount).toBe(1);
		expect(record.characterCount).toBe(1);
		expect(record.worldCount).toBe(1);
		expect(record.documentCount).toBe(3);
		expect(record.wordCount).toBeGreaterThan(15);
	});

	test("calculateDashboardStats aggregates totals across multiple projects", () => {
		const projects: RecentProject[] = [
			{
				id: "p1",
				name: "Book One",
				folderPath: "/path/one",
				lastOpened: "2026-10-10",
				targetWordCount: 50000,
				wordCount: 12000,
				documentCount: 5,
				manuscriptCount: 3,
				characterCount: 1,
				worldCount: 1,
				notesCount: 0,
				genre: "Fantasy",
			},
			{
				id: "p2",
				name: "Book Two",
				folderPath: "/path/two",
				lastOpened: "2026-10-12",
				targetWordCount: 60000,
				wordCount: 18000,
				documentCount: 7,
				manuscriptCount: 4,
				characterCount: 2,
				worldCount: 1,
				notesCount: 0,
				genre: "Sci-Fi",
			},
		];

		const stats = calculateDashboardStats(projects);
		expect(stats.totalProjects).toBe(2);
		expect(stats.totalWords).toBe(30000);
		expect(stats.totalManuscripts).toBe(7);
		expect(stats.totalCharacters).toBe(3);
		expect(stats.totalWorld).toBe(2);
		expect(stats.totalDocuments).toBe(12);
		expect(stats.genreCounts["Fantasy"]).toBe(1);
		expect(stats.genreCounts["Sci-Fi"]).toBe(1);
	});

	test("saveRecentProject and removeRecentProject manage localStorage without deleting user files", () => {
		const p1: RecentProject = {
			id: "/path/p1",
			name: "Project 1",
			folderPath: "/path/p1",
			lastOpened: "2026-10-01",
			targetWordCount: 50000,
			wordCount: 1000,
			documentCount: 2,
			manuscriptCount: 1,
			characterCount: 1,
			worldCount: 0,
			notesCount: 0,
		};

		saveRecentProject(p1);
		let list = getRecentProjects();
		expect(list.some((p) => p.folderPath === "/path/p1")).toBe(true);

		removeRecentProject("/path/p1");
		list = getRecentProjects();
		expect(list.some((p) => p.folderPath === "/path/p1")).toBe(false);
	});
});

describe("Project Structure Analyzer", () => {
	test("analyzes a valid project correctly", () => {
		const project: ProjectInfo = {
			name: "The Long Way Home",
			author: "Alex",
			genre: "Drama",
			targetWordCount: 70000,
		};

		const docs: FictionDocument[] = [
			{
				id: "doc-1",
				title: "Act 1",
				type: "manuscript",
				status: "in-progress",
				tags: [],
				order: 1,
				createdAt: "2026-01-01",
				updatedAt: "2026-01-01",
				content: "Opening scene with dialogue.",
			},
		];

		const result = analyzeProject("/test/path", project, docs, true, true);
		expect(result.isValid).toBe(true);
		expect(result.status).toBe("valid");
		expect(result.manifestFound).toBe(true);
		expect(result.manifestValid).toBe(true);
		expect(result.manuscriptCount).toBe(1);
		expect(result.hasStacks).toBe(true);
		expect(result.hasGitignore).toBe(true);
		expect(result.issues.length).toBe(0);
	});

	test("detects missing manifest and reports invalid status", () => {
		const result = analyzeProject("/empty/path", null, []);
		expect(result.isValid).toBe(false);
		expect(result.status).toBe("invalid");
		expect(result.manifestFound).toBe(false);
		expect(result.issues.length).toBeGreaterThan(0);
	});

	test("reports warnings for empty documents or missing title", () => {
		const project: ProjectInfo = {
			name: "Untitled Project",
			author: "",
			genre: "",
			targetWordCount: 50000,
		};
		const result = analyzeProject("/empty/docs", project, []);
		expect(result.isValid).toBe(true);
		expect(result.status).toBe("warning");
		expect(result.warnings.some((w) => w.includes("No documents"))).toBe(true);
	});
});
