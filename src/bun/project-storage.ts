import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type {
	FictionDocument,
	LoadProjectResult,
	ProjectHistoryStacks,
	ProjectInfo,
	ProjectManifest,
	ProjectManifestDoc,
	SaveProjectResult,
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
 * Save project files to folder.
 */
export async function saveProjectToFolder(
	folderPath: string,
	project: ProjectInfo,
	documents: FictionDocument[],
	stacks?: ProjectHistoryStacks,
): Promise<SaveProjectResult> {
	try {
		const absFolder = path.resolve(folderPath);

		if (!fs.existsSync(absFolder)) {
			fs.mkdirSync(absFolder, { recursive: true });
		}

		// Ensure categorized subfolders exist
		const subdirs = ["manuscript", "characters", "world", "notes"];
		for (const sub of subdirs) {
			const subPath = path.join(absFolder, sub);
			if (!fs.existsSync(subPath)) {
				fs.mkdirSync(subPath, { recursive: true });
			}
		}

		const manifestDocs: ProjectManifestDoc[] = [];

		for (const doc of documents) {
			let relativeFolder = "notes";
			let filename = "";

			const safeSlug = slugifyTitle(doc.title);
			if (doc.type === "manuscript") {
				relativeFolder = "manuscript";
				const prefix = String(doc.order).padStart(2, "0");
				filename = `${prefix}_${safeSlug}.md`;
			} else if (doc.type === "character") {
				relativeFolder = "characters";
				filename = `${safeSlug}.md`;
			} else if (doc.type === "world") {
				relativeFolder = "world";
				filename = `${safeSlug}.md`;
			} else {
				relativeFolder = "notes";
				filename = `${safeSlug}.md`;
			}

			const relativePath = path.join(relativeFolder, filename);
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

		const now = new Date().toISOString();
		const manifest: ProjectManifest = {
			schemaVersion: 1,
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

		// Save undo/redo history stacks if provided
		if (stacks) {
			const stacksPath = path.join(absFolder, "stacks.json");
			assertWithinRoot(absFolder, stacksPath);
			atomicWriteFile(stacksPath, JSON.stringify(stacks, null, 2));
		}

		// Ensure .gitignore exists and ignores stacks.json
		const gitignorePath = path.join(absFolder, ".gitignore");
		assertWithinRoot(absFolder, gitignorePath);
		const defaultGitignore = [
			"# FictionClosure Project Git Ignore",
			"# Stacks and local edit history (user-specific / session-specific)",
			"stacks.json",
			".stacks.json",
			"*.stack.json",
			"",
			"# Temporary files",
			"*.tmp.*",
			".cache/",
			"",
		].join("\n");

		if (!fs.existsSync(gitignorePath)) {
			atomicWriteFile(gitignorePath, defaultGitignore);
		} else {
			const existingGitignore = fs.readFileSync(gitignorePath, "utf8");
			if (!existingGitignore.includes("stacks.json")) {
				atomicWriteFile(
					gitignorePath,
					existingGitignore.trimEnd() + "\n\n# Stacks\nstacks.json\n.stacks.json\n*.stack.json\n",
				);
			}
		}

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
 */
export async function loadProjectFromFolder(folderPath: string): Promise<LoadProjectResult> {
	try {
		const absFolder = path.resolve(folderPath);
		const manifestPath = path.join(absFolder, "project.json");

		if (!fs.existsSync(manifestPath)) {
			return {
				success: false,
				error: `project.json not found in "${absFolder}". Is this a FictionClosure project folder?`,
			};
		}

		const manifestRaw = fs.readFileSync(manifestPath, "utf8");
		const manifest = JSON.parse(manifestRaw) as ProjectManifest;

		const loadedDocs: FictionDocument[] = [];

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

		// Load undo/redo history stacks if available
		let loadedStacks: ProjectHistoryStacks | undefined = undefined;
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
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			error: message,
		};
	}
}
