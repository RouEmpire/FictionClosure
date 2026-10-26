import { describe, expect, it } from "bun:test";

// Polyfill window before electrobun/view evaluates
if (typeof (globalThis as unknown as { window: unknown }).window === "undefined") {
	(globalThis as unknown as { window: Record<string, unknown> }).window = {
		__electrobunWebviewId: undefined,
	};
}

const {
	checkIsGitRepo,
	commitWorkspaceChanges,
	fetchGitLog,
	fetchGitStatus,
	initializeGitRepo,
	revertCommit,
	fetchGitDiffFiles,
	fetchGitFileAtCommit,
	fetchGitFileBlame,
} = await import("../src/mainview/services/git");

describe("Frontend Git Service (Browser / Fallback environment)", () => {
	it("handles missing folderPath gracefully for repo check", async () => {
		const isRepo = await checkIsGitRepo("");
		expect(isRepo).toBe(false);
	});

	it("handles missing folderPath gracefully for status check", async () => {
		const status = await fetchGitStatus("");
		expect(status.isRepo).toBe(false);
		expect(status.clean).toBe(true);
		expect(status.files).toEqual([]);
	});

	it("handles missing folderPath gracefully for log check", async () => {
		const log = await fetchGitLog("");
		expect(log).toEqual([]);
	});

	it("guards commit action when folder path is missing or non-desktop", async () => {
		const res = await commitWorkspaceChanges("", {
			message: "Test commit",
		});
		expect(res.success).toBe(false);
		expect(res.error).toBeDefined();
	});

	it("guards init action when folder path is missing", async () => {
		const res = await initializeGitRepo("");
		expect(res.success).toBe(false);
		expect(res.error).toContain("Project must be saved to a folder");
	});

	it("guards revert action when folder path is missing", async () => {
		const res = await revertCommit("", "abcdef123");
		expect(res.success).toBe(false);
		expect(res.error).toContain("folder path is missing");
	});

	it("guards diff methods when folder path is missing", async () => {
		const files = await fetchGitDiffFiles("", "hash123");
		expect(files).toEqual([]);

		const content = await fetchGitFileAtCommit("", "hash123", "chapter.md");
		expect(content).toBe("");

		const blame = await fetchGitFileBlame("", "chapter.md");
		expect(blame).toEqual([]);
	});
});
