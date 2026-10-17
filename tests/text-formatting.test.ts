import { describe, expect, test } from "bun:test";
import {
	wrapSelection,
	toggleLinePrefix,
	toggleTaskCheckbox,
} from "../src/mainview/utils/textFormatting";

describe("Text Formatting Shortcuts", () => {
	describe("wrapSelection", () => {
		test("wraps selected text with bold (**)", () => {
			const text = "He whispered softly into the wind.";
			// select "softly" (indices 13 to 19)
			const res = wrapSelection(text, 13, 19, "**", "**");
			expect(res.newText).toBe("He whispered **softly** into the wind.");
			expect(res.newStart).toBe(15);
			expect(res.newEnd).toBe(21);
		});

		test("inserts bold placeholder when selection is empty", () => {
			const text = "The end.";
			// cursor at 4 (between "The " and "end.")
			const res = wrapSelection(text, 4, 4, "**", "**", "text");
			expect(res.newText).toBe("The **text**end.");
			expect(res.newStart).toBe(6);
			expect(res.newEnd).toBe(10);
		});

		test("wraps text in wikilink [[...]]", () => {
			const text = "Elena Vance arrived yesterday.";
			// select "Elena Vance" (indices 0 to 11)
			const res = wrapSelection(text, 0, 11, "[[", "]]");
			expect(res.newText).toBe("[[Elena Vance]] arrived yesterday.");
		});

		test("wraps text in italic (*)", () => {
			const text = "Never say never.";
			// select "Never" (indices 0 to 5)
			const res = wrapSelection(text, 0, 5, "*", "*");
			expect(res.newText).toBe("*Never* say never.");
		});
	});

	describe("toggleLinePrefix", () => {
		test("prepends blockquote prefix > to single line", () => {
			const text = "Chapter 1\nA quotation line\nNext line";
			// cursor inside "A quotation line" (index 15)
			const res = toggleLinePrefix(text, 15, 15, "> ");
			expect(res.newText).toBe("Chapter 1\n> A quotation line\nNext line");
		});

		test("removes blockquote prefix > when already present", () => {
			const text = "Chapter 1\n> A quotation line\nNext line";
			const res = toggleLinePrefix(text, 17, 17, "> ");
			expect(res.newText).toBe("Chapter 1\nA quotation line\nNext line");
		});

		test("prepends list item prefix - to line", () => {
			const text = "First item";
			const res = toggleLinePrefix(text, 5, 5, "- ");
			expect(res.newText).toBe("- First item");
		});

		test("removes list item prefix - when already present", () => {
			const text = "- First item";
			const res = toggleLinePrefix(text, 4, 4, "- ");
			expect(res.newText).toBe("First item");
		});

		test("prepends task prefix - [ ] to line", () => {
			const text = "Chapter Outline Beat";
			const res = toggleLinePrefix(text, 8, 8, "- [ ] ");
			expect(res.newText).toBe("- [ ] Chapter Outline Beat");
		});
	});

	describe("toggleTaskCheckbox", () => {
		test("toggles unchecked [ ] to checked [x]", () => {
			const text = "- [ ] Finish first draft of Chapter 2";
			const res = toggleTaskCheckbox(text, 10, 10);
			expect(res.newText).toBe("- [x] Finish first draft of Chapter 2");
		});

		test("toggles checked [x] to unchecked [ ]", () => {
			const text = "- [x] Finish first draft of Chapter 2";
			const res = toggleTaskCheckbox(text, 10, 10);
			expect(res.newText).toBe("- [ ] Finish first draft of Chapter 2");
		});

		test("toggles uppercase [X] to unchecked [ ]", () => {
			const text = "- [X] Read prologue revision";
			const res = toggleTaskCheckbox(text, 5, 5);
			expect(res.newText).toBe("- [ ] Read prologue revision");
		});

		test("converts standard bullet list line to checked task", () => {
			const text = "- Review lore timeline";
			const res = toggleTaskCheckbox(text, 5, 5);
			expect(res.newText).toBe("- [x] Review lore timeline");
		});

		test("converts plain line to task item [ ]", () => {
			const text = "Outline the climax scene";
			const res = toggleTaskCheckbox(text, 5, 5);
			expect(res.newText).toBe("- [ ] Outline the climax scene");
		});
	});
});
