import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
	createGitCommit,
	getGitLog,
	getGitStatus,
	initGitRepo,
	isGitRepo,
	revertGitCommit,
} from "../src/bun/git-service";

describe("Bun Git Service", () => {
	let tempDir: string;

	beforeEach(() => {
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "fc-git-test-"));
	});

	afterEach(() => {
		try {
			if (fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true, force: true });
			}
		} catch {
			// ignore cleanup error
		}
	});

	it("correctly identifies non-repo and initializes a Git repository", async () => {
		const before = await isGitRepo(tempDir);
		expect(before).toBe(false);

		const initRes = await initGitRepo(tempDir);
		expect(initRes.success).toBe(true);

		const after = await isGitRepo(tempDir);
		expect(after).toBe(true);

		// Default .gitignore should have been created
		const gitignorePath = path.join(tempDir, ".gitignore");
		expect(fs.existsSync(gitignorePath)).toBe(true);
		const content = fs.readFileSync(gitignorePath, "utf8");
		expect(content).toContain(".fictionclosure/cache/");
	});

	it("reports accurate git status for untracked and modified files", async () => {
		await initGitRepo(tempDir);

		const initialStatus = await getGitStatus(tempDir);
		expect(initialStatus.isRepo).toBe(true);
		expect(initialStatus.clean).toBe(false); // .gitignore is untracked or untracked count > 0

		// Commit the .gitignore so status becomes clean
		await createGitCommit(tempDir, {
			gitmoji: ":tada:",
			message: "Project setup",
		});

		const cleanStatus = await getGitStatus(tempDir);
		expect(cleanStatus.clean).toBe(true);
		expect(cleanStatus.modifiedCount).toBe(0);

		// Create a manuscript file
		fs.writeFileSync(path.join(tempDir, "chapter-1.md"), "# Chapter 1\nOnce upon a time...");

		const dirtyStatus = await getGitStatus(tempDir);
		expect(dirtyStatus.clean).toBe(false);
		expect(dirtyStatus.untrackedCount).toBe(1);
	});

	it("creates commits with Gitmoji standards and retrieves parsed log records", async () => {
		await initGitRepo(tempDir);

		// First commit: writing chapter 1
		fs.writeFileSync(path.join(tempDir, "chapter-1.md"), "# Chapter 1\nOnce upon a time...");
		const commit1 = await createGitCommit(tempDir, {
			gitmoji: "📝",
			message: "Draft Chapter 1 opening",
		});
		expect(commit1.success).toBe(true);
		expect(commit1.commitHash).toBeDefined();

		// Second commit: storyline refactor
		fs.writeFileSync(
			path.join(tempDir, "chapter-1.md"),
			"# Chapter 1\nIn a realm forgotten by time...",
		);
		const commit2 = await createGitCommit(tempDir, {
			gitmoji: ":recycle:",
			message: "Refactor opening scene hook",
		});
		expect(commit2.success).toBe(true);

		// Retrieve commit log
		const logs = await getGitLog(tempDir);
		expect(logs.length).toBe(2);

		// Most recent commit should be commit2
		expect(logs[0].message).toContain("Refactor opening scene hook");
		expect(logs[0].gitmoji).toBe("♻️");
		expect(logs[0].cleanMessage).toBe("Refactor opening scene hook");

		// Initial commit
		expect(logs[1].message).toContain("Draft Chapter 1 opening");
		expect(logs[1].gitmoji).toBe("📝");
	});

	it("safely reverts a commit without destroying history", async () => {
		await initGitRepo(tempDir);

		const testFile = path.join(tempDir, "plot-outline.md");
		fs.writeFileSync(testFile, "Original Plot Idea");
		await createGitCommit(tempDir, {
			gitmoji: "💡",
			message: "Initial plot idea",
		});

		// Second commit that will be reverted
		fs.writeFileSync(testFile, "Experimental plot twist that ruins the story");
		const badCommit = await createGitCommit(tempDir, {
			gitmoji: "🚧",
			message: "Add experimental plot twist",
		});
		expect(badCommit.success).toBe(true);
		expect(badCommit.commitHash).toBeDefined();

		// Introduce dirty uncommitted modifications and an untracked file to simulate workspace edits
		fs.writeFileSync(testFile, "Dirty local edits that were not committed");
		const untrackedFile = path.join(tempDir, "scratchpad.tmp");
		fs.writeFileSync(untrackedFile, "Temporary scratch notes");

		// Revert the bad commit with force (should discard dirty uncommitted changes and revert cleanly)
		const revertRes = await revertGitCommit(tempDir, badCommit.commitHash!);
		expect(revertRes.success).toBe(true);
		expect(revertRes.revertCommitHash).toBeDefined();

		// Content should be reverted back to original
		const revertedContent = fs.readFileSync(testFile, "utf8");
		expect(revertedContent).toBe("Original Plot Idea");
		expect(fs.existsSync(untrackedFile)).toBe(false);

		// Git log should have 3 commits now (initial, bad, revert)
		const logs = await getGitLog(tempDir);
		expect(logs.length).toBe(3);
		expect(logs[0].message).toContain("Revert");
	});
});
