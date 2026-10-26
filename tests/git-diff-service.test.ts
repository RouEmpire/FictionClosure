import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	createGitCommit,
	initGitRepo,
} from "../src/bun/git-service";
import {
	getGitDiffFiles,
	getGitFileAtCommit,
	getGitFileBlame,
} from "../src/bun/git-diff-service";

describe("Bun Git Diff Service", () => {
	let tempDir: string;

	beforeEach(async () => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-diff-test-"));
		await initGitRepo(tempDir);
	});

	afterEach(() => {
		try {
			if (fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		} catch {
			// ignore cleanup
		}
	});

	it("retrieves diff files between a selected commit and current tree", async () => {
		const filePath = path.join(tempDir, "chapter-1.md");
		fs.writeFileSync(filePath, "# Chapter 1\nOriginal paragraph.\n");

		const commitRes = await createGitCommit(tempDir, {
			gitmoji: "📝",
			message: "First commit",
			authorName: "Arthur",
			authorEmail: "arthur@story.local",
		});
		expect(commitRes.success).toBe(true);

		// Modify the file in working tree
		fs.writeFileSync(filePath, "# Chapter 1\nRevised paragraph.\nNew line added.\n");

		const changedFiles = await getGitDiffFiles(tempDir, commitRes.commitHash!);
		expect(changedFiles).toContain("chapter-1.md");
	});

	it("retrieves file content at a specific commit revision", async () => {
		const filePath = path.join(tempDir, "scene-notes.md");
		fs.writeFileSync(filePath, "---\ntitle: Scene\n---\nInitial scene outline.");

		const commitRes = await createGitCommit(tempDir, {
			gitmoji: "💡",
			message: "Initial scene",
		});

		// Overwrite scene notes
		fs.writeFileSync(filePath, "---\ntitle: Scene\n---\nCompletely different scene draft.");

		const contentAtCommit = await getGitFileAtCommit(tempDir, commitRes.commitHash!, "scene-notes.md");
		expect(contentAtCommit).toBe("Initial scene outline.");
	});

	it("parses line blame information from git blame porcelain", async () => {
		const filePath = path.join(tempDir, "dialogue.md");
		fs.writeFileSync(filePath, "Line 1: Hello\nLine 2: World\n");

		const commitRes = await createGitCommit(tempDir, {
			gitmoji: "💬",
			message: "Add dialogue",
			authorName: "Sherlock",
			authorEmail: "sherlock@baker.st",
		});

		const blame = await getGitFileBlame(tempDir, "dialogue.md", commitRes.commitHash);
		expect(blame.length).toBe(2);
		expect(blame[0].lineNumber).toBe(1);
		expect(blame[0].authorName).toBe("Sherlock");
		expect(blame[0].authorTime).toBeGreaterThan(0);
	});
});
