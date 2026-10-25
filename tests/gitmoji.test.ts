import { describe, expect, it } from "bun:test";
import {
	DEFAULT_WRITING_GITMOJI,
	FICTION_GITMOJIS,
	formatCommitMessage,
	getGitmojiByCodeOrEmoji,
	parseCommitMessage,
	searchGitmojis,
} from "../src/shared/domain/gitmoji";

describe("Fiction Writing Gitmoji Domain", () => {
	it("contains standard gitmojis with fiction writing adaptations", () => {
		expect(FICTION_GITMOJIS.length).toBeGreaterThan(20);

		// Verify recycle is adapted for storyline/plot restructuring
		const recycle = getGitmojiByCodeOrEmoji(":recycle:");
		expect(recycle).toBeDefined();
		expect(recycle?.emoji).toBe("♻️");
		expect(recycle?.writingDescription.toLowerCase()).toContain("storyline");
		expect(recycle?.category).toBe("plot");

		// Verify bug is adapted for plot holes / continuity
		const bug = getGitmojiByCodeOrEmoji(":bug:");
		expect(bug).toBeDefined();
		expect(bug?.writingDescription.toLowerCase()).toContain("plot holes");

		// Verify memo is default writing gitmoji
		expect(DEFAULT_WRITING_GITMOJI.code).toBe(":memo:");
		expect(DEFAULT_WRITING_GITMOJI.emoji).toBe("📝");
	});

	it("finds gitmoji items by code and emoji symbol", () => {
		const byCode = getGitmojiByCodeOrEmoji(":memo:");
		const byEmoji = getGitmojiByCodeOrEmoji("📝");
		expect(byCode).toEqual(byEmoji);
		expect(byCode?.emoji).toBe("📝");

		const nonExistent = getGitmojiByCodeOrEmoji(":not_a_valid_gitmoji:");
		expect(nonExistent).toBeUndefined();
	});

	it("parses commit messages starting with shortcode", () => {
		const res = parseCommitMessage(":recycle: Restructure Act II climax");
		expect(res.gitmoji).toBe("♻️");
		expect(res.gitmojiCode).toBe(":recycle:");
		expect(res.cleanMessage).toBe("Restructure Act II climax");
		expect(res.item?.writingDescription).toContain("storyline");
	});

	it("parses commit messages starting with unicode emoji", () => {
		const res = parseCommitMessage("📝 Draft Chapter 4 opening scene");
		expect(res.gitmoji).toBe("📝");
		expect(res.gitmojiCode).toBe(":memo:");
		expect(res.cleanMessage).toBe("Draft Chapter 4 opening scene");
	});

	it("parses commit messages without gitmoji cleanly", () => {
		const res = parseCommitMessage("Fixed dialogue in scene 2");
		expect(res.gitmoji).toBe("");
		expect(res.cleanMessage).toBe("Fixed dialogue in scene 2");
		expect(res.item).toBeUndefined();
	});

	it("formats commit messages following the Gitmoji standard", () => {
		const formatted1 = formatCommitMessage(":recycle:", "Restructure prologue");
		expect(formatted1).toBe("♻️ Restructure prologue");

		const formatted2 = formatCommitMessage("📝", "Draft Chapter 1");
		expect(formatted2).toBe("📝 Draft Chapter 1");

		// Does not duplicate prefix if user already typed it
		const formatted3 = formatCommitMessage("📝", "📝 Draft Chapter 1");
		expect(formatted3).toBe("📝 Draft Chapter 1");
	});

	it("searches gitmojis across terms and categories", () => {
		const plotResults = searchGitmojis("plot", "plot");
		expect(plotResults.length).toBeGreaterThan(0);
		expect(plotResults.some((g) => g.code === ":recycle:")).toBe(true);

		const writingResults = searchGitmojis("", "writing");
		expect(writingResults.length).toBeGreaterThan(0);
		expect(writingResults.every((g) => g.category === "writing")).toBe(true);

		const dialogueResults = searchGitmojis("dialogue");
		expect(dialogueResults.some((g) => g.code === ":speech_balloon:")).toBe(true);
	});
});
