/**
 * FictionClosure — Recent Projects Service (Pure Functional & SOLID).
 *
 * Provides:
 * - Decoupled KeyValueStorageAdapter (Dependency Inversion)
 * - In-memory parsing cache (eliminates repeated JSON.parse overhead)
 * - Pure record builder and dashboard statistics calculations
 * - Zero OOP classes or mutable object state
 */

import type {
	FictionDocument,
	ProjectInfo,
	RecentProject,
} from "@shared/types";
import { initialProject, sampleDocuments } from "@shared/fixtures/sampleData";
import { calculateWordCount } from "@shared/domain/markdown";

export const LOCAL_STORAGE_RECENT_PROJECTS = "fictionclosure_recent_projects_v1";

// ============================================================================
// 1. Interfaces & Types (Interface Segregation & Dependency Inversion)
// ============================================================================

export interface KeyValueStorageAdapter {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem?(key: string): void;
}

export interface DashboardProjectProgress {
	name: string;
	words: number;
	target: number;
	percent: number;
}

export interface DashboardStats {
	totalProjects: number;
	totalWords: number;
	totalCharacters: number;
	totalWorld: number;
	totalManuscripts: number;
	totalDocuments: number;
	genreCounts: Record<string, number>;
	projectProgress: DashboardProjectProgress[];
}

// In-memory cache to avoid repeated JSON parsing during reactive Svelte renders
let cachedProjects: RecentProject[] | null = null;
let cachedStorageRaw: string | null = null;

/**
 * Creates a browser-backed storage adapter, falling back gracefully if unavailable.
 */
export function getBrowserStorageAdapter(): KeyValueStorageAdapter {
	if (typeof localStorage !== "undefined") {
		return localStorage;
	}
	// In-memory fallback adapter
	const memory = new Map<string, string>();
	return {
		getItem: (k) => memory.get(k) ?? null,
		setItem: (k, v) => {
			memory.set(k, v);
		},
		removeItem: (k) => {
			memory.delete(k);
		},
	};
}

/**
 * Invalidates the in-memory parsed projects cache.
 */
export function invalidateRecentProjectsCache(): void {
	cachedProjects = null;
	cachedStorageRaw = null;
}

// ============================================================================
// 2. Pure Mapping & Calculation Functions (Single Responsibility)
// ============================================================================

/**
 * Creates a RecentProject record from loaded ProjectInfo and Documents.
 */
export function buildRecentProjectRecord(
	project: ProjectInfo,
	documents: readonly FictionDocument[],
	folderPath: string,
): RecentProject {
	let wordCount = 0;
	let manuscriptCount = 0;
	let characterCount = 0;
	let worldCount = 0;
	let notesCount = 0;

	for (let i = 0; i < documents.length; i++) {
		const doc = documents[i];
		if (!doc) continue;

		wordCount += calculateWordCount(doc.content || "");
		if (doc.type === "manuscript") manuscriptCount++;
		else if (doc.type === "character") characterCount++;
		else if (doc.type === "world") worldCount++;
		else notesCount++;
	}

	return {
		id: folderPath || `proj-${Date.now()}`,
		name: project.name || "Untitled Project",
		folderPath,
		lastOpened: new Date().toISOString(),
		lastSaved: project.lastSaved,
		targetWordCount: project.targetWordCount || 50000,
		wordCount,
		documentCount: documents.length,
		manuscriptCount,
		characterCount,
		worldCount,
		notesCount,
		author: project.author,
		genre: project.genre,
		coverImage: project.coverImage,
	};
}

/**
 * Generates initial seed project from sample data.
 */
export function getInitialSeedProject(): RecentProject {
	return buildRecentProjectRecord(
		initialProject,
		sampleDocuments,
		initialProject.folderPath || "~/FictionProjects/TheWhisperingTide",
	);
}

/**
 * Computes aggregate writing and worldbuilding statistics for the Home dashboard.
 * Executes in a single high-efficiency linear pass.
 */
export function calculateDashboardStats(
	projects: readonly RecentProject[],
): DashboardStats {
	let totalWords = 0;
	let totalCharacters = 0;
	let totalWorld = 0;
	let totalManuscripts = 0;
	let totalDocuments = 0;
	const genreCounts: Record<string, number> = {};
	const projectProgress: DashboardProjectProgress[] = [];

	for (let i = 0; i < projects.length; i++) {
		const p = projects[i];
		if (!p) continue;

		const words = p.wordCount || 0;
		const target = p.targetWordCount || 50000;
		const percent =
			target > 0 ? Math.min(100, Math.round((words / target) * 100)) : 0;

		totalWords += words;
		totalCharacters += p.characterCount || 0;
		totalWorld += p.worldCount || 0;
		totalManuscripts += p.manuscriptCount || 0;
		totalDocuments += p.documentCount || 0;

		const genre = p.genre || "Uncategorized";
		genreCounts[genre] = (genreCounts[genre] || 0) + 1;

		projectProgress.push({
			name: p.name,
			words,
			target,
			percent,
		});
	}

	return {
		totalProjects: projects.length,
		totalWords,
		totalCharacters,
		totalWorld,
		totalManuscripts,
		totalDocuments,
		genreCounts,
		projectProgress,
	};
}

// ============================================================================
// 3. Storage I/O Operations (Decoupled with Cached Reads)
// ============================================================================

/**
 * Loads recent projects from storage, seeding sample data if empty.
 * Uses an in-memory parsed cache to avoid repeated JSON serialization overhead.
 */
export function getRecentProjects(
	storage: KeyValueStorageAdapter = getBrowserStorageAdapter(),
): RecentProject[] {
	try {
		const raw = storage.getItem(LOCAL_STORAGE_RECENT_PROJECTS);

		// If storage payload has not changed, return cached in-memory reference
		if (raw !== null && raw === cachedStorageRaw && cachedProjects !== null) {
			return cachedProjects;
		}

		if (!raw) {
			const seed = [getInitialSeedProject()];
			const seedRaw = JSON.stringify(seed);
			storage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, seedRaw);
			cachedProjects = seed;
			cachedStorageRaw = seedRaw;
			return seed;
		}

		const parsed: unknown = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			cachedProjects = parsed as RecentProject[];
			cachedStorageRaw = raw;
			return cachedProjects;
		}

		const seed = [getInitialSeedProject()];
		const seedRaw = JSON.stringify(seed);
		storage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, seedRaw);
		cachedProjects = seed;
		cachedStorageRaw = seedRaw;
		return seed;
	} catch (err) {
		console.warn("Could not load recent projects from storage:", err);
		return [getInitialSeedProject()];
	}
}

/**
 * Adds or updates a recent project in storage and updates the in-memory cache.
 */
export function saveRecentProject(
	record: RecentProject,
	storage: KeyValueStorageAdapter = getBrowserStorageAdapter(),
): RecentProject[] {
	const currentList = getRecentProjects(storage);
	const filtered = currentList.filter(
		(p) => p.id !== record.id && p.folderPath !== record.folderPath,
	);
	filtered.unshift({ ...record, lastOpened: new Date().toISOString() });

	try {
		const raw = JSON.stringify(filtered);
		storage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, raw);
		cachedProjects = filtered;
		cachedStorageRaw = raw;
	} catch (err) {
		console.warn("Failed to save recent projects:", err);
	}
	return filtered;
}

/**
 * Removes a recent project from storage (does NOT delete user files from disk).
 */
export function removeRecentProject(
	idOrPath: string,
	storage: KeyValueStorageAdapter = getBrowserStorageAdapter(),
): RecentProject[] {
	const currentList = getRecentProjects(storage);
	const filtered = currentList.filter(
		(p) => p.id !== idOrPath && p.folderPath !== idOrPath,
	);

	try {
		const raw = JSON.stringify(filtered);
		storage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, raw);
		cachedProjects = filtered;
		cachedStorageRaw = raw;
	} catch (err) {
		console.warn("Failed to remove recent project:", err);
	}
	return filtered;
}
