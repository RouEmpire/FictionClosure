import type { FictionDocument, ProjectInfo, RecentProject } from "@shared/types";
import { initialProject, sampleDocuments } from "@shared/fixtures/sampleData";
import { calculateWordCount } from "@shared/domain/markdown";

export const LOCAL_STORAGE_RECENT_PROJECTS = "fictionclosure_recent_projects_v1";

export interface DashboardStats {
	totalProjects: number;
	totalWords: number;
	totalCharacters: number;
	totalWorld: number;
	totalManuscripts: number;
	totalDocuments: number;
	genreCounts: Record<string, number>;
	projectProgress: { name: string; words: number; target: number; percent: number }[];
}

/**
 * Creates a RecentProject record from loaded ProjectInfo and Documents.
 */
export function buildRecentProjectRecord(
	project: ProjectInfo,
	documents: FictionDocument[],
	folderPath: string,
): RecentProject {
	let wordCount = 0;
	let manuscriptCount = 0;
	let characterCount = 0;
	let worldCount = 0;
	let notesCount = 0;

	for (const doc of documents) {
		const words = calculateWordCount(doc.content || "");
		wordCount += words;
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
	};
}

/**
 * Generates initial seed project from sample data.
 */
function getInitialSeedProject(): RecentProject {
	return buildRecentProjectRecord(
		initialProject,
		sampleDocuments,
		initialProject.folderPath || "~/FictionProjects/TheWhisperingTide",
	);
}

/**
 * Loads recent projects from localStorage, seeding sample data if empty.
 */
export function getRecentProjects(): RecentProject[] {
	if (typeof localStorage === "undefined") {
		return [getInitialSeedProject()];
	}

	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_RECENT_PROJECTS);
		if (!raw) {
			const seed = [getInitialSeedProject()];
			localStorage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, JSON.stringify(seed));
			return seed;
		}

		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed) && parsed.length > 0) {
			return parsed;
		}

		const seed = [getInitialSeedProject()];
		localStorage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, JSON.stringify(seed));
		return seed;
	} catch (err) {
		console.warn("Could not load recent projects from localStorage:", err);
		return [getInitialSeedProject()];
	}
}

/**
 * Adds or updates a recent project in localStorage.
 */
export function saveRecentProject(record: RecentProject): RecentProject[] {
	const list = getRecentProjects().filter(
		(p) => p.id !== record.id && p.folderPath !== record.folderPath,
	);
	list.unshift({ ...record, lastOpened: new Date().toISOString() });

	if (typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, JSON.stringify(list));
		} catch (err) {
			console.warn("Failed to save recent projects:", err);
		}
	}
	return list;
}

/**
 * Removes a recent project from localStorage (does NOT delete user files from disk).
 */
export function removeRecentProject(idOrPath: string): RecentProject[] {
	const current = getRecentProjects();
	const filtered = current.filter(
		(p) => p.id !== idOrPath && p.folderPath !== idOrPath,
	);

	if (typeof localStorage !== "undefined") {
		try {
			localStorage.setItem(LOCAL_STORAGE_RECENT_PROJECTS, JSON.stringify(filtered));
		} catch (err) {
			console.warn("Failed to remove recent project:", err);
		}
	}
	return filtered;
}

/**
 * Computes aggregate writing and worldbuilding statistics for the Home dashboard.
 */
export function calculateDashboardStats(projects: RecentProject[]): DashboardStats {
	let totalWords = 0;
	let totalCharacters = 0;
	let totalWorld = 0;
	let totalManuscripts = 0;
	let totalDocuments = 0;
	const genreCounts: Record<string, number> = {};
	const projectProgress: { name: string; words: number; target: number; percent: number }[] = [];

	for (const p of projects) {
		totalWords += p.wordCount || 0;
		totalCharacters += p.characterCount || 0;
		totalWorld += p.worldCount || 0;
		totalManuscripts += p.manuscriptCount || 0;
		totalDocuments += p.documentCount || 0;

		const genre = p.genre || "Uncategorized";
		genreCounts[genre] = (genreCounts[genre] || 0) + 1;

		const target = p.targetWordCount || 50000;
		const words = p.wordCount || 0;
		const percent = target > 0 ? Math.min(100, Math.round((words / target) * 100)) : 0;
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
