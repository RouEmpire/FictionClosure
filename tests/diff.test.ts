import { describe, expect, it } from "bun:test";
import {
	attachBlameToDiff,
	computeLineDiff,
	formatBlameInfo,
	type GitLineBlame,
} from "../src/shared/domain/diff";

describe("Diff Domain Logic & Line Blame", () => {
	it("computes line diff for added, removed, and unmodified lines", () => {
		const oldText = "Chapter 1\nIt was a dark night.\nThe end.";
		const newText = "Chapter 1\nIt was a dark and stormy night.\nSuddenly, a scream.\nThe end.";

		const diff = computeLineDiff(oldText, newText);
		expect(diff.length).toBeGreaterThan(3);

		// Line 1: unmodified
		expect(diff[0].type).toBe("unmodified");
		expect(diff[0].text).toBe("Chapter 1");

		// Contains removed line
		const removed = diff.find((d) => d.type === "removed");
		expect(removed).toBeDefined();
		expect(removed?.text).toBe("It was a dark night.");

		// Contains added lines
		const added = diff.filter((d) => d.type === "added");
		expect(added.length).toBe(2);
		expect(added.some((d) => d.text.includes("stormy"))).toBe(true);
		expect(added.some((d) => d.text.includes("scream"))).toBe(true);

		// Last line: unmodified
		expect(diff[diff.length - 1].type).toBe("unmodified");
		expect(diff[diff.length - 1].text).toBe("The end.");
	});

	it("handles completely new or completely removed content safely", () => {
		const fromEmpty = computeLineDiff("", "Line 1\nLine 2");
		expect(fromEmpty.length).toBe(2);
		expect(fromEmpty.every((d) => d.type === "added")).toBe(true);

		const toEmpty = computeLineDiff("Line 1\nLine 2", "");
		expect(toEmpty.length).toBe(2);
		expect(toEmpty.every((d) => d.type === "removed")).toBe(true);

		const emptyDiff = computeLineDiff("", "");
		expect(emptyDiff).toEqual([]);
	});

	it("formats blame info according to the user specification", () => {
		const now = Date.now();
		const threeDaysAgoSec = Math.floor((now - 3 * 24 * 60 * 60 * 1000) / 1000);

		// Case 1: Writer commit (writer matches author)
		const writerBlame = formatBlameInfo("Arthur Conan Doyle", threeDaysAgoSec, "Arthur Conan Doyle", now);
		expect(writerBlame.name).toBe("Arthur Conan Doyle");
		expect(writerBlame.daysAgoText).toBe("3 Days ago");
		expect(writerBlame.isWriter).toBe(true);
		expect(writerBlame.iconClass).toBe("fa-solid fa-code-commit");

		// Case 2: Someone else commit (different person)
		const collaboratorBlame = formatBlameInfo("John Watson", threeDaysAgoSec, "Arthur Conan Doyle", now);
		expect(collaboratorBlame.name).toBe("John Watson");
		expect(collaboratorBlame.daysAgoText).toBe("3 Days ago");
		expect(collaboratorBlame.isWriter).toBe(false);
		expect(collaboratorBlame.iconClass).toBe("fa-solid fa-wave-square");
	});

	it("attaches blame records to diff items accurately", () => {
		const diff = computeLineDiff("Old line", "New line");
		const blameMap = new Map<number, GitLineBlame>([
			[
				1,
				{
					lineNumber: 1,
					commitHash: "abc1234",
					authorName: "Jane Austen",
					authorEmail: "jane@fiction.local",
					authorTime: 1700000000,
				},
			],
		]);

		const enriched = attachBlameToDiff(diff, blameMap);
		expect(enriched.length).toBe(2);

		const added = enriched.find((d) => d.type === "added");
		expect(added?.authorName).toBe("Jane Austen");
		expect(added?.commitHash).toBe("abc1234");
	});
});
