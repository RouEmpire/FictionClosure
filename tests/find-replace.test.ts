import { describe, test, expect } from "bun:test";
import {
	findMatches,
	formatMatchCountText,
	getNextMatchIndex,
	getPreviousMatchIndex,
	replaceAllMatches,
	replaceSingleMatch,
	resolveActiveMatchIndex,
} from "../src/mainview/components/Workspace/Editor/findReplaceLogic";
import {
	handleEditorKeyDown,
	type EditorKeyContext,
} from "../src/mainview/components/Workspace/Editor/editorKeybindings";

describe("Editor Find & Replace Logic & Keybindings", () => {
	const sampleText = `The ancient tower loomed over the valley.
The stone steps were cold, and the wind whispered ancient secrets.
Tower guards watched from high above.`;

	test("findMatches performs case-insensitive search by default", () => {
		const matches = findMatches(sampleText, "ancient", false);
		expect(matches.length).toBe(2);
		expect(matches[0].start).toBe(4);
		expect(matches[0].end).toBe(11);
		expect(matches[1].start).toBe(92);
		expect(matches[1].end).toBe(99);

		// Finds "The" and "the"
		const theMatches = findMatches(sampleText, "the", false);
		expect(theMatches.length).toBe(4);
	});

	test("findMatches respects case sensitivity when toggled on", () => {
		const caseSensitiveMatches = findMatches(sampleText, "The", true);
		expect(caseSensitiveMatches.length).toBe(2); // "The" at start of line 1 and line 2

		const lowerMatches = findMatches(sampleText, "the", true);
		expect(lowerMatches.length).toBe(2); // "the" in lowercase
	});

	test("findMatches safely handles special markdown characters and punctuation", () => {
		const markdownDoc = `Check [[Elena Vance]] or [[Ancient Vault]] for **critical** items!`;
		const wikilinkMatches = findMatches(markdownDoc, "[[", false);
		expect(wikilinkMatches.length).toBe(2);
		expect(wikilinkMatches[0].start).toBe(6);

		const starMatches = findMatches(markdownDoc, "**", false);
		expect(starMatches.length).toBe(2);

		const punctuationMatches = findMatches(markdownDoc, "!", false);
		expect(punctuationMatches.length).toBe(1);
	});

	test("findMatches returns empty array on empty query or content", () => {
		expect(findMatches("", "word", false)).toEqual([]);
		expect(findMatches("Some text", "", false)).toEqual([]);
		expect(findMatches("", "", false)).toEqual([]);
	});

	test("resolveActiveMatchIndex identifies match at cursor or next match", () => {
		const matches = findMatches(sampleText, "ancient", false);
		// Cursor at index 7 (inside first "ancient", 4..11)
		expect(resolveActiveMatchIndex(matches, 7, 0)).toBe(0);

		// Cursor at index 50 (after first match, before second match at 92)
		expect(resolveActiveMatchIndex(matches, 50, 0)).toBe(1);

		// Cursor past all matches (e.g. index 120)
		expect(resolveActiveMatchIndex(matches, 120, 0)).toBe(0);

		// Empty matches
		expect(resolveActiveMatchIndex([], 10, 0)).toBe(-1);
	});

	test("getNextMatchIndex and getPreviousMatchIndex cycle matches accurately", () => {
		const total = 3;
		// Next: 0 -> 1 -> 2 -> 0
		expect(getNextMatchIndex(0, total)).toBe(1);
		expect(getNextMatchIndex(1, total)).toBe(2);
		expect(getNextMatchIndex(2, total)).toBe(0);

		// Previous: 0 -> 2 -> 1 -> 0
		expect(getPreviousMatchIndex(0, total)).toBe(2);
		expect(getPreviousMatchIndex(2, total)).toBe(1);
		expect(getPreviousMatchIndex(1, total)).toBe(0);

		// Empty
		expect(getNextMatchIndex(0, 0)).toBe(-1);
		expect(getPreviousMatchIndex(0, 0)).toBe(-1);
	});

	test("replaceSingleMatch replaces target match and calculates new cursor offset", () => {
		const matches = findMatches(sampleText, "tower", false);
		expect(matches.length).toBe(2);

		// Replace first occurrence of "tower" (at 12..17) with "citadel"
		const result = replaceSingleMatch(sampleText, matches[0], "citadel");
		expect(result.newContent.startsWith("The ancient citadel loomed")).toBe(true);
		expect(result.newCursor).toBe(12 + "citadel".length);
		// Second occurrence "Tower" at end remains intact
		expect(result.newContent.includes("Tower guards watched")).toBe(true);
	});

	test("replaceAllMatches replaces all occurrences and counts replacements", () => {
		const result = replaceAllMatches(sampleText, "ancient", "venerable", false);
		expect(result.count).toBe(2);
		expect(result.newContent).toContain("The venerable tower");
		expect(result.newContent).toContain("venerable secrets");
		expect(result.newContent).not.toContain("ancient");
	});

	test("replaceAllMatches respects case sensitivity", () => {
		const result = replaceAllMatches(sampleText, "The", "That", true);
		expect(result.count).toBe(2);
		expect(result.newContent.startsWith("That ancient tower")).toBe(true);
		// Lowercase "the" must remain untouched
		expect(result.newContent).toContain("the valley");
	});

	test("formatMatchCountText formats count badge appropriately", () => {
		expect(formatMatchCountText(0, -1, "")).toBe("");
		expect(formatMatchCountText(0, -1, "dragon")).toBe("No results");
		expect(formatMatchCountText(5, 0, "dragon")).toBe("1 of 5");
		expect(formatMatchCountText(5, 2, "dragon")).toBe("3 of 5");
	});

	test("handleEditorKeyDown triggers Find on Ctrl+F and Find & Replace on Ctrl+Shift+F", () => {
		let openedWithReplace: boolean | null = null;
		let closedFind = false;

		const ctx: EditorKeyContext = {
			zenMode: "none",
			isMentionOpen: false,
			mentionCandidates: [],
			selectedMentionIndex: 0,
			onSelectMentionIndex: () => {},
			onInsertMention: () => {},
			onCloseMention: () => {},
			onSave: () => {},
			onUndo: () => {},
			onRedo: () => {},
			onToggleWordWrap: () => {},
			applyTransform: () => {},
			onInsertTab: () => {},
			onOpenFind: (withReplace) => {
				openedWithReplace = !!withReplace;
			},
			isFindOpen: false,
			onCloseFind: () => {
				closedFind = true;
			},
		};

		function createMockKeyEvent(init: {
			key: string;
			ctrlKey?: boolean;
			shiftKey?: boolean;
			altKey?: boolean;
			metaKey?: boolean;
		}): KeyboardEvent {
			return {
				key: init.key,
				ctrlKey: !!init.ctrlKey,
				shiftKey: !!init.shiftKey,
				altKey: !!init.altKey,
				metaKey: !!init.metaKey,
				code: init.key,
				preventDefault: () => {},
			} as unknown as KeyboardEvent;
		}

		// Ctrl+F -> open find without replace
		const findEvent = createMockKeyEvent({
			key: "f",
			ctrlKey: true,
			shiftKey: false,
		});
		const handledFind = handleEditorKeyDown(findEvent, ctx);
		expect(handledFind).toBe(true);
		expect(openedWithReplace).toBe(false);

		// Ctrl+Shift+F -> open find WITH replace
		const replaceEvent = createMockKeyEvent({
			key: "F",
			ctrlKey: true,
			shiftKey: true,
		});
		const handledReplace = handleEditorKeyDown(replaceEvent, ctx);
		expect(handledReplace).toBe(true);
		expect(openedWithReplace).toBe(true);

		// Escape when isFindOpen = true -> close find
		const escapeCtx = { ...ctx, isFindOpen: true };
		const escEvent = createMockKeyEvent({ key: "Escape" });
		const handledEsc = handleEditorKeyDown(escEvent, escapeCtx);
		expect(handledEsc).toBe(true);
		expect(closedFind).toBe(true);
	});
});
