import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as child_process from "node:child_process";
import { calculateWordCount } from "../shared/domain/markdown";
import type {
	CrashRecoveryData,
	DocumentHistoryStack,
	FictionDocument,
	LoadProjectResult,
	ProjectHistoryStacks,
	ProjectInfo,
	ProjectManifest,
	ProjectManifestDoc,
	SaveProjectResult,
	SessionState,
	WorkspaceState,
} from "../shared/types";

const CONFIG_DIR_NAME = "fictionclosure";
const CONFIG_FILE_NAME = "recent.json";

/**
 * Get config file path for persisting user preferences like recent project folder.
 */
function getConfigFilePath(): string {
	const xdgConfig = process.env.XDG_CONFIG_HOME;
	const baseDir = xdgConfig && xdgConfig.trim() !== ""
		? xdgConfig
		: path.join(os.homedir(), ".config");
	return path.join(baseDir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

/**
 * Get the last remembered project folder.
 */
export function getLastProjectFolder(): string | null {
	try {
		const filePath = getConfigFilePath();
		if (!fs.existsSync(filePath)) {
			return null;
		}
		const raw = fs.readFileSync(filePath, "utf8");
		const data = JSON.parse(raw);
		if (typeof data.lastProjectFolder === "string" && fs.existsSync(data.lastProjectFolder)) {
			return data.lastProjectFolder;
		}
		return null;
	} catch {
		return null;
	}
}

/**
 * Remember the last used project folder path.
 */
export function setLastProjectFolder(folderPath: string): void {
	try {
		const filePath = getConfigFilePath();
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		const payload = {
			lastProjectFolder: folderPath,
			updatedAt: new Date().toISOString(),
		};
		atomicWriteFile(filePath, JSON.stringify(payload, null, 2));
	} catch (err) {
		console.warn("Failed to persist last project folder:", err);
	}
}

/**
 * Safe filename slugifier that prevents path traversal and removes filesystem-hostile characters.
 */
export function slugifyTitle(title: string): string {
	const cleaned = title
		.trim()
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");

	return cleaned || "untitled";
}

/**
 * Resolves a folder path, expanding tilde (~) to the user's home directory.
 */
export function resolveFolderPath(folderPath: string): string {
	if (!folderPath) return "";
	if (folderPath === "~") {
		return os.homedir();
	}
	if (folderPath.startsWith("~/") || folderPath.startsWith("~\\")) {
		return path.join(os.homedir(), folderPath.slice(2));
	}
	return path.resolve(folderPath);
}

/**
 * Atomic file writer: writes to a unique temporary file and renames it over the target.
 * Guarantees that target files are never left corrupted or partially written.
 */
export function atomicWriteFile(targetPath: string, content: string): void {
	const targetDir = path.dirname(targetPath);
	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	const tempPath = path.join(
		targetDir,
		`.${path.basename(targetPath)}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
	);

	try {
		fs.writeFileSync(tempPath, content, "utf8");
		fs.renameSync(tempPath, targetPath);
	} catch (err) {
		if (fs.existsSync(tempPath)) {
			try {
				fs.unlinkSync(tempPath);
			} catch {
				// ignore cleanup error
			}
		}
		throw err;
	}
}

/**
 * Verifies that a resolved path is strictly within the allowed root directory.
 */
function assertWithinRoot(root: string, candidate: string): void {
	const rel = path.relative(root, candidate);
	if (rel.startsWith("..") || path.isAbsolute(rel)) {
		throw new Error(`Security error: path "${candidate}" escapes project root "${root}"`);
	}
}

/**
 * Format document content with YAML frontmatter.
 */
export function serializeDocumentToMarkdown(doc: FictionDocument): string {
	const frontmatterLines: string[] = [
		"---",
		`id: ${JSON.stringify(doc.id)}`,
		`title: ${JSON.stringify(doc.title)}`,
		`type: ${JSON.stringify(doc.type)}`,
		`status: ${JSON.stringify(doc.status)}`,
		`order: ${doc.order}`,
		`createdAt: ${JSON.stringify(doc.createdAt)}`,
		`updatedAt: ${JSON.stringify(doc.updatedAt)}`,
	];

	if (doc.pov) {
		frontmatterLines.push(`pov: ${JSON.stringify(doc.pov)}`);
	}

	if (doc.summary) {
		frontmatterLines.push(`summary: ${JSON.stringify(doc.summary)}`);
	}

	if (Array.isArray(doc.tags) && doc.tags.length > 0) {
		frontmatterLines.push("tags:");
		for (const tag of doc.tags) {
			frontmatterLines.push(`  - ${JSON.stringify(tag)}`);
		}
	}

	frontmatterLines.push("---");
	frontmatterLines.push("");

	// If content already contains frontmatter, strip it first
	const body = doc.content.replace(/^---[\s\S]*?---\r?\n\r?\n?/, "");

	return frontmatterLines.join("\n") + body;
}

/**
 * Parse Markdown file and extract frontmatter metadata if present.
 */
export function parseDocumentFromMarkdown(rawContent: string, defaultMeta: Partial<FictionDocument>): FictionDocument {
	const frontmatterRegex = /^---[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*/;
	const match = frontmatterRegex.exec(rawContent);

	let content = rawContent;
	const meta: Record<string, unknown> = {};

	if (match && match[1]) {
		content = rawContent.slice(match[0].length);
		const lines = match[1].split(/\r?\n/);
		let currentArrayKey: string | null = null;
		let arrayValues: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			if (trimmed.startsWith("- ") && currentArrayKey) {
				const item = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
				arrayValues.push(item);
				continue;
			}

			if (currentArrayKey) {
				meta[currentArrayKey] = arrayValues;
				currentArrayKey = null;
				arrayValues = [];
			}

			const colonIdx = line.indexOf(":");
			if (colonIdx !== -1) {
				const key = line.slice(0, colonIdx).trim();
				const val = line.slice(colonIdx + 1).trim();
				if (!val) {
					currentArrayKey = key;
					arrayValues = [];
				} else {
					try {
						meta[key] = JSON.parse(val);
					} catch {
						meta[key] = val.replace(/^["']|["']$/g, "");
					}
				}
			}
		}

		if (currentArrayKey) {
			meta[currentArrayKey] = arrayValues;
		}
	}

	return {
		id: (meta.id as string) || defaultMeta.id || `doc-${Date.now()}`,
		title: (meta.title as string) || defaultMeta.title || "Untitled",
		type: (meta.type as FictionDocument["type"]) || defaultMeta.type || "manuscript",
		status: (meta.status as FictionDocument["status"]) || defaultMeta.status || "draft",
		tags: Array.isArray(meta.tags) ? (meta.tags as string[]) : (defaultMeta.tags || []),
		pov: (meta.pov as string) || defaultMeta.pov,
		summary: (meta.summary as string) || defaultMeta.summary,
		order: typeof meta.order === "number" ? meta.order : (defaultMeta.order ?? 1),
		createdAt: (meta.createdAt as string) || defaultMeta.createdAt || new Date().toISOString(),
		updatedAt: (meta.updatedAt as string) || defaultMeta.updatedAt || new Date().toISOString(),
		content,
	};
}

/**
 * Initializes a Git repository in the project folder if one does not already exist.
 * Satisfies the requirement: Initialize Git repository when user creates or imports a non-git project.
 */
export function initGitRepository(absFolder: string): boolean {
	const gitDir = path.join(absFolder, ".git");
	if (fs.existsSync(gitDir)) {
		return true;
	}
	try {
		child_process.execSync("git init", { cwd: absFolder, stdio: "ignore" });
		return true;
	} catch (err) {
		console.warn("Could not auto-initialize Git repository:", err);
		return false;
	}
}

/**
 * Ensures .gitignore exists with comprehensive rules for FictionClosure projects.
 * Ignores internal history stacks, session state, crash cache, search index, and exports.
 */
export function ensureGitignore(absFolder: string): void {
	const gitignorePath = path.join(absFolder, ".gitignore");
	const defaultRules = [
		"# FictionClosure Project Git Ignore",
		"# Internal state, local edit history, and crash recovery cache",
		".fictionclosure/history/",
		".fictionclosure/cache/",
		".fictionclosure/state/",
		".fictionclosure/index/",
		"!.fictionclosure/schema.json",
		"",
		"# Export artifacts",
		"exports/",
		"",
		"# Legacy history stacks and temporary files",
		"stacks.json",
		".stacks.json",
		"*.stack.json",
		"*.tmp.*",
		".cache/",
		".DS_Store",
		"Thumbs.db",
		"",
	].join("\n");

	if (!fs.existsSync(gitignorePath)) {
		atomicWriteFile(gitignorePath, defaultRules);
	} else {
		const existing = fs.readFileSync(gitignorePath, "utf8");
		let updated = existing;
		const requiredRules = [
			".fictionclosure/history/",
			".fictionclosure/cache/",
			".fictionclosure/state/",
			"!.fictionclosure/schema.json",
			"stacks.json",
		];
		let modified = false;
		for (const rule of requiredRules) {
			if (!updated.includes(rule)) {
				updated = updated.trimEnd() + "\n" + rule + "\n";
				modified = true;
			}
		}
		if (modified) {
			atomicWriteFile(gitignorePath, updated);
		}
	}
}

/**
 * Saves user writing inside `.fictionclosure/cache/unsaved-recovery.json`.
 * Used for crash recovery when the application is interrupted before a manual save.
 */
export function saveCrashCache(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
): { success: boolean; error?: string } {
	try {
		const absFolder = resolveFolderPath(folderPath);
		const cacheDir = path.join(absFolder, ".fictionclosure", "cache");
		if (!fs.existsSync(cacheDir)) {
			fs.mkdirSync(cacheDir, { recursive: true });
		}
		const cachePath = path.join(cacheDir, "unsaved-recovery.json");
		const payload: CrashRecoveryData = {
			hasUnsavedChanges: true,
			cachedAt: new Date().toISOString(),
			projectName: project.name,
			documents: documents.map((d) => ({
				id: d.id,
				title: d.title,
				type: d.type,
				content: d.content,
				wordCount: calculateWordCount(d.content || ""),
				lastModified: d.updatedAt || new Date().toISOString(),
			})),
		};
		atomicWriteFile(cachePath, JSON.stringify(payload, null, 2));
		return { success: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

/**
 * Clears the unsaved crash recovery cache (e.g. after clean manual save).
 */
export function clearCrashCache(folderPath: string): { success: boolean; error?: string } {
	try {
		const absFolder = resolveFolderPath(folderPath);
		const cachePath = path.join(absFolder, ".fictionclosure", "cache", "unsaved-recovery.json");
		if (fs.existsSync(cachePath)) {
			const payload = {
				hasUnsavedChanges: false,
				cachedAt: new Date().toISOString(),
				documents: [],
			};
			atomicWriteFile(cachePath, JSON.stringify(payload, null, 2));
		}
		return { success: true };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		return { success: false, error: msg };
	}
}

/**
 * Retrieves uncommitted crash recovery data if present.
 */
export function getCrashRecovery(absFolder: string): CrashRecoveryData | null {
	try {
		const cachePath = path.join(absFolder, ".fictionclosure", "cache", "unsaved-recovery.json");
		if (!fs.existsSync(cachePath)) {
			return null;
		}
		const raw = fs.readFileSync(cachePath, "utf8");
		const data = JSON.parse(raw) as CrashRecoveryData;
		if (!data) return null;
		return {
			hasUnsavedChanges: Boolean(data.hasUnsavedChanges),
			cachedAt: data.cachedAt || new Date().toISOString(),
			projectName: data.projectName || "",
			documents: Array.isArray(data.documents) ? data.documents : [],
		};
	} catch {
		return null;
	}
}

/**
 * Save project files to folder using the advanced FictionClosure project layout:
 * - Canonical content: manuscript/, characters/, plots/, world/, notes/, media/, exports/
 * - Internal system: .fictionclosure/ (schema.json, state/, history/, index/, cache/, migrations/, extensions/)
 * - Git: auto-initializes repository and enforces .gitignore
 */
export async function saveProjectToFolder(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
	stacks?: ProjectHistoryStacks,
	workspaceState?: WorkspaceState,
): Promise<SaveProjectResult> {
	try {
		const absFolder = resolveFolderPath(folderPath);

		if (!fs.existsSync(absFolder)) {
			fs.mkdirSync(absFolder, { recursive: true });
		}

		// 1. Ensure all canonical content directories exist
		const canonicalDirs = [
			"manuscript",
			"characters",
			path.join("plots", "subplots"),
			path.join("plots", "arcs"),
			path.join("world", "locations"),
			path.join("world", "cultures"),
			path.join("world", "systems"),
			path.join("world", "history"),
			path.join("notes", "outlines"),
			path.join("notes", "research"),
			path.join("notes", "ideas"),
			path.join("media", "images"),
			path.join("media", "covers"),
			path.join("media", "audio"),
			path.join("media", "attachments"),
			"exports",
		];
		for (const sub of canonicalDirs) {
			const subPath = path.join(absFolder, sub);
			if (!fs.existsSync(subPath)) {
				fs.mkdirSync(subPath, { recursive: true });
			}
		}

		// 2. Ensure all .fictionclosure internal system directories exist
		const internalDirs = [
			path.join(".fictionclosure", "state"),
			path.join(".fictionclosure", "history", "documents"),
			path.join(".fictionclosure", "history", "transactions"),
			path.join(".fictionclosure", "history", "checkpoints"),
			path.join(".fictionclosure", "index"),
			path.join(".fictionclosure", "cache"),
			path.join(".fictionclosure", "migrations"),
			path.join(".fictionclosure", "extensions"),
		];
		for (const sub of internalDirs) {
			const subPath = path.join(absFolder, sub);
			if (!fs.existsSync(subPath)) {
				fs.mkdirSync(subPath, { recursive: true });
			}
		}

		// 3. Write .fictionclosure/schema.json specification contract
		const schemaPath = path.join(absFolder, ".fictionclosure", "schema.json");
		const schemaPayload = {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			title: "FictionClosure Project Specification",
			schemaVersion: 2,
			format: "fictionclosure-project-v2",
			description: "Desktop-first, Markdown-first fiction writing workspace project specification",
			createdWith: "FictionClosure",
			directories: {
				canonical: [
					"manuscript",
					"characters",
					"plots",
					"world",
					"notes",
					"media",
					"exports",
				],
				internal: [
					".fictionclosure/state",
					".fictionclosure/history/documents",
					".fictionclosure/history/transactions",
					".fictionclosure/history/checkpoints",
					".fictionclosure/index",
					".fictionclosure/cache",
					".fictionclosure/migrations",
					".fictionclosure/extensions",
				],
			},
		};
		atomicWriteFile(schemaPath, JSON.stringify(schemaPayload, null, 2));

		// 4. Write .fictionclosure/state/workspace.json & session.json
		const now = new Date().toISOString();
		const workspaceStatePath = path.join(absFolder, ".fictionclosure", "state", "workspace.json");
		const workspacePayload: WorkspaceState = workspaceState || {
			schemaVersion: 1,
			viewMode: "editor",
			isSidebarOpen: true,
			showInspector: false,
			zenMode: "none",
			updatedAt: now,
		};
		atomicWriteFile(workspaceStatePath, JSON.stringify(workspacePayload, null, 2));

		const sessionStatePath = path.join(absFolder, ".fictionclosure", "state", "session.json");
		const totalWords = documents.reduce((sum, d) => sum + calculateWordCount(d.content || ""), 0);
		const sessionPayload: SessionState = {
			schemaVersion: 1,
			lastOpenedAt: now,
			lastSavedAt: now,
			totalWords,
			appVersion: "1.0.0",
		};
		atomicWriteFile(sessionStatePath, JSON.stringify(sessionPayload, null, 2));

		// 5. Serialize and write canonical Markdown documents
		const manifestDocs: ProjectManifestDoc[] = [];

		for (const doc of documents) {
			let relativeFolder = "notes";
			let filename = "";

			const safeSlug = slugifyTitle(doc.title);
			if (doc.type === "manuscript") {
				relativeFolder = "manuscript";
				const prefix = String(doc.order ?? 1).padStart(2, "0");
				filename = `${prefix}_${safeSlug}.md`;
			} else if (doc.type === "character") {
				relativeFolder = "characters";
				filename = `${safeSlug}.md`;
			} else if (doc.type === "world") {
				relativeFolder = "world";
				filename = `${safeSlug}.md`;
			} else if (doc.type === "plot") {
				relativeFolder = "plots";
				filename = `${safeSlug}.md`;
			} else {
				relativeFolder = "notes";
				filename = `${safeSlug}.md`;
			}

			// Preserve nested relative paths if already specified (e.g. plots/subplots/heist.md)
			const customRelPath = (doc as unknown as { relativePath?: string }).relativePath;
			const relativePath = customRelPath && customRelPath.trim() !== ""
				? customRelPath
				: path.join(relativeFolder, filename);

			const fullDocPath = path.join(absFolder, relativePath);
			assertWithinRoot(absFolder, fullDocPath);

			const fileMarkdown = serializeDocumentToMarkdown(doc);
			atomicWriteFile(fullDocPath, fileMarkdown);

			manifestDocs.push({
				id: doc.id,
				title: doc.title,
				type: doc.type,
				status: doc.status,
				tags: doc.tags,
				pov: doc.pov,
				summary: doc.summary,
				order: doc.order,
				createdAt: doc.createdAt,
				updatedAt: doc.updatedAt,
				relativePath,
			});
		}

		// 6. Write project.json manifest
		const manifest: ProjectManifest = {
			schemaVersion: 2,
			name: project.name,
			author: project.author,
			genre: project.genre,
			targetWordCount: project.targetWordCount,
			updatedAt: now,
			documents: manifestDocs,
		};

		const manifestPath = path.join(absFolder, "project.json");
		assertWithinRoot(absFolder, manifestPath);
		atomicWriteFile(manifestPath, JSON.stringify(manifest, null, 2));

		// 7. Write README.md if not present
		const readmePath = path.join(absFolder, "README.md");
		if (!fs.existsSync(readmePath)) {
			const readmeContent = [
				`# ${project.name}`,
				"",
				"Created with [FictionClosure](https://github.com/fictionclosure) — Desktop-first, Markdown-first fiction writing workspace.",
				"",
				`- **Author**: ${project.author || "Unknown"}`,
				`- **Genre**: ${project.genre || "Fiction"}`,
				`- **Target Word Count**: ${(project.targetWordCount || 50000).toLocaleString()} words`,
				"",
				"## Project Structure",
				"- `manuscript/`: Canonical fiction chapters in Markdown format",
				"- `characters/`: Character profiles and dossiers",
				"- `plots/`: Main plot, subplots, and story arcs",
				"- `world/`: Worldbuilding, locations, systems, and lore",
				"- `notes/`: Outlines, research notes, and creative ideas",
				"- `media/`: Attached images, audio, and book covers",
				"- `exports/`: Compiled manuscript outputs (EPUB, PDF, Markdown bundles)",
				"- `.fictionclosure/`: Internal workspace state, per-document edit history, and cache",
				"",
			].join("\n");
			atomicWriteFile(readmePath, readmeContent);
		}

		// 8. Write per-document history stacks in .fictionclosure/history/documents/<id>/
		if (stacks && stacks.stacks) {
			const historyBaseDir = path.join(absFolder, ".fictionclosure", "history", "documents");
			for (const [docId, docStack] of Object.entries(stacks.stacks)) {
				const docHistDir = path.join(historyBaseDir, docId);
				if (!fs.existsSync(docHistDir)) {
					fs.mkdirSync(docHistDir, { recursive: true });
				}
				const undoPath = path.join(docHistDir, "undo.json");
				const undoPayload = {
					documentId: docId,
					updatedAt: now,
					undo: docStack.undo,
					redo: docStack.redo,
				};
				atomicWriteFile(undoPath, JSON.stringify(undoPayload, null, 2));

				const checkpointPath = path.join(docHistDir, "checkpoint.json");
				const matchingDoc = documents.find((d) => d.id === docId);
				const checkpointPayload = {
					documentId: docId,
					timestamp: now,
					checkpointCount: docStack.undo.length,
					lastWordCount: matchingDoc ? calculateWordCount(matchingDoc.content || "") : 0,
				};
				atomicWriteFile(checkpointPath, JSON.stringify(checkpointPayload, null, 2));
			}

			// Backwards compatibility: Also write root stacks.json for legacy loaders and tests
			const stacksPath = path.join(absFolder, "stacks.json");
			assertWithinRoot(absFolder, stacksPath);
			atomicWriteFile(stacksPath, JSON.stringify(stacks, null, 2));
		}

		// 9. Git Integration: Auto-initialize Git repository and enforce .gitignore
		initGitRepository(absFolder);
		ensureGitignore(absFolder);

		// 10. Clear unsaved crash recovery cache since files are now safely saved
		clearCrashCache(absFolder);

		setLastProjectFolder(absFolder);

		return {
			success: true,
			savedAt: now,
			folderPath: absFolder,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("saveProjectToFolder error:", message);
		return {
			success: false,
			savedAt: new Date().toISOString(),
			folderPath,
			error: message,
		};
	}
}

/**
 * Load project files from folder.
 * Supports:
 * - New schemaVersion 2 project.json and backwards compatibility with schemaVersion 1
 * - Per-document history stacks (.fictionclosure/history/documents/<id>/undo.json) with fallback to stacks.json
 * - Crash recovery detection (.fictionclosure/cache/unsaved-recovery.json)
 */
export async function loadProjectFromFolder(folderPath: string): Promise<LoadProjectResult> {
	try {
		const absFolder = resolveFolderPath(folderPath);
		const manifestPath = path.join(absFolder, "project.json");

		// Also check backwards compatibility for fictionclosure.json
		const legacyManifestPath = path.join(absFolder, "fictionclosure.json");
		const targetManifestPath = fs.existsSync(manifestPath)
			? manifestPath
			: fs.existsSync(legacyManifestPath)
				? legacyManifestPath
				: null;

		if (!targetManifestPath) {
			return {
				success: false,
				error: `project.json not found in "${absFolder}". Is this a FictionClosure project folder?`,
			};
		}

		const manifestRaw = fs.readFileSync(targetManifestPath, "utf8");
		const manifest = JSON.parse(manifestRaw) as ProjectManifest;

		const loadedDocs: FictionDocument[] = [];

		if (Array.isArray(manifest.documents)) {
			for (const manifestDoc of manifest.documents) {
				const fullDocPath = path.join(absFolder, manifestDoc.relativePath);
				assertWithinRoot(absFolder, fullDocPath);

				if (fs.existsSync(fullDocPath)) {
					const raw = fs.readFileSync(fullDocPath, "utf8");
					const doc = parseDocumentFromMarkdown(raw, manifestDoc);
					loadedDocs.push(doc);
				} else {
					// Fallback if file was moved or deleted externally
					loadedDocs.push({
						...manifestDoc,
						content: `# ${manifestDoc.title}\n\n[File was not found on disk at ${manifestDoc.relativePath}]\n`,
					});
				}
			}
		}

		// 1. Try loading per-document history stacks from .fictionclosure/history/documents/<id>/undo.json
		let loadedStacks: ProjectHistoryStacks | undefined = undefined;
		const historyDocsDir = path.join(absFolder, ".fictionclosure", "history", "documents");

		if (fs.existsSync(historyDocsDir)) {
			try {
				const docDirs = fs.readdirSync(historyDocsDir, { withFileTypes: true });
				const stacksObj: Record<string, DocumentHistoryStack> = {};
				let foundAny = false;

				for (const d of docDirs) {
					if (d.isDirectory()) {
						const undoFile = path.join(historyDocsDir, d.name, "undo.json");
						if (fs.existsSync(undoFile)) {
							const rawUndo = fs.readFileSync(undoFile, "utf8");
							const parsed = JSON.parse(rawUndo);
							if (parsed && Array.isArray(parsed.undo) && Array.isArray(parsed.redo)) {
								stacksObj[d.name] = {
									undo: parsed.undo,
									redo: parsed.redo,
								};
								foundAny = true;
							}
						}
					}
				}

				if (foundAny) {
					loadedStacks = {
						schemaVersion: 2,
						updatedAt: manifest.updatedAt || new Date().toISOString(),
						targetWordCount: manifest.targetWordCount || 50000,
						maxStackSize: Math.floor((manifest.targetWordCount || 50000) / 2),
						stacks: stacksObj,
					};
				}
			} catch (err) {
				console.warn("Could not read per-document history stacks:", err);
			}
		}

		// 2. Fallback to legacy stacks.json or .stacks.json if per-document stacks not found
		if (!loadedStacks) {
			const stacksPath = path.join(absFolder, "stacks.json");
			const altStacksPath = path.join(absFolder, ".stacks.json");
			const targetStacksFile = fs.existsSync(stacksPath)
				? stacksPath
				: fs.existsSync(altStacksPath)
					? altStacksPath
					: null;

			if (targetStacksFile) {
				try {
					const stacksRaw = fs.readFileSync(targetStacksFile, "utf8");
					loadedStacks = JSON.parse(stacksRaw) as ProjectHistoryStacks;
				} catch (err) {
					console.warn("Could not parse stacks.json:", err);
				}
			}
		}

		// 3. Check for unsaved crash recovery cache
		const recoveryData = getCrashRecovery(absFolder);

		const project: ProjectInfo = {
			name: manifest.name,
			author: manifest.author,
			genre: manifest.genre,
			targetWordCount: manifest.targetWordCount,
			folderPath: absFolder,
			lastSaved: manifest.updatedAt,
		};

		setLastProjectFolder(absFolder);

		return {
			success: true,
			project,
			documents: loadedDocs,
			stacks: loadedStacks,
			recoveryData,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			error: message,
		};
	}
}
