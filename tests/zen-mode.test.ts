import { describe, test, expect } from "bun:test";
import { getGutterRowDisplay, type RenderedLine } from "../src/mainview/utils/renderedLines";
import type { ZenModeType } from "../src/shared/types";

describe("Zen Mode & Focus Gutter Display", () => {
	// Sample rendered lines simulating:
	// Paragraph 1: wrapped into 2 lines
	// Paragraph 2: single line
	// Paragraph 3: wrapped into 3 lines
	const mockLines: RenderedLine[] = [
		{
			paragraphIndex: 1,
			subLineIndex: 0,
			isParagraphStart: true,
			display: "1",
			startOffset: 0,
			endOffset: 20,
		},
		{
			paragraphIndex: 1,
			subLineIndex: 1,
			isParagraphStart: false,
			display: "-",
			startOffset: 20,
			endOffset: 45,
		},
		{
			paragraphIndex: 2,
			subLineIndex: 0,
			isParagraphStart: true,
			display: "2",
			startOffset: 46,
			endOffset: 70,
		},
		{
			paragraphIndex: 3,
			subLineIndex: 0,
			isParagraphStart: true,
			display: "3",
			startOffset: 71,
			endOffset: 95,
		},
		{
			paragraphIndex: 3,
			subLineIndex: 1,
			isParagraphStart: false,
			display: "-",
			startOffset: 95,
			endOffset: 120,
		},
		{
			paragraphIndex: 3,
			subLineIndex: 2,
			isParagraphStart: false,
			display: "-",
			startOffset: 120,
			endOffset: 140,
		},
	];

	test("Standard / Normal Mode: displays line numbers and all dashes with paragraph highlight", () => {
		// Cursor at paragraph 1
		const row0 = getGutterRowDisplay(mockLines[0], 1, "none");
		expect(row0.text).toBe("1");
		expect(row0.isCurrent).toBe(true);
		expect(row0.isDash).toBe(false);
		expect(row0.isDimmed).toBe(false);

		const row1 = getGutterRowDisplay(mockLines[1], 1, "none");
		expect(row1.text).toBe("-");
		expect(row1.isCurrent).toBe(true);
		expect(row1.isDash).toBe(true);
		expect(row1.isDimmed).toBe(false);

		const row2 = getGutterRowDisplay(mockLines[2], 1, "none");
		expect(row2.text).toBe("2");
		expect(row2.isCurrent).toBe(false);
		expect(row2.isDimmed).toBe(false);

		const row4 = getGutterRowDisplay(mockLines[4], 1, "none");
		expect(row4.text).toBe("-");
		expect(row4.isCurrent).toBe(false);
		expect(row4.isDash).toBe(true);
	});

	test("Focus Zen Mode: active cursor paragraph displays numbers and dashes normally", () => {
		// Cursor at paragraph 3 (which has 1 start line and 2 wrapped lines)
		const p3_start = getGutterRowDisplay(mockLines[3], 3, "focus");
		expect(p3_start.text).toBe("3");
		expect(p3_start.isCurrent).toBe(true);
		expect(p3_start.isDimmed).toBe(false);

		const p3_wrap1 = getGutterRowDisplay(mockLines[4], 3, "focus");
		expect(p3_wrap1.text).toBe("-");
		expect(p3_wrap1.isCurrent).toBe(true);
		expect(p3_wrap1.isDash).toBe(true);
		expect(p3_wrap1.isDimmed).toBe(false);

		const p3_wrap2 = getGutterRowDisplay(mockLines[5], 3, "focus");
		expect(p3_wrap2.text).toBe("-");
		expect(p3_wrap2.isCurrent).toBe(true);
		expect(p3_wrap2.isDash).toBe(true);
		expect(p3_wrap2.isDimmed).toBe(false);
	});

	test("Focus Zen Mode: other paragraphs show line numbers only and NO dashes at all, with dimmed opacity", () => {
		// Cursor at paragraph 3, inspecting paragraph 1 (wrapped) and paragraph 2
		const p1_start = getGutterRowDisplay(mockLines[0], 3, "focus");
		expect(p1_start.text).toBe("1");
		expect(p1_start.isCurrent).toBe(false);
		expect(p1_start.isDimmed).toBe(true);

		const p1_wrap = getGutterRowDisplay(mockLines[1], 3, "focus");
		// Wrapped line of non-active paragraph must NOT display '-'
		expect(p1_wrap.text).toBe("");
		expect(p1_wrap.isCurrent).toBe(false);
		expect(p1_wrap.isDash).toBe(false);
		expect(p1_wrap.isDimmed).toBe(true);

		const p2_start = getGutterRowDisplay(mockLines[2], 3, "focus");
		expect(p2_start.text).toBe("2");
		expect(p2_start.isCurrent).toBe(false);
		expect(p2_start.isDimmed).toBe(true);
	});

	test("State transitions: switching cursor instantly shifts active highlight and unhides dashes", () => {
		// Moving cursor to paragraph 1
		const p1_wrap_now_active = getGutterRowDisplay(mockLines[1], 1, "focus");
		expect(p1_wrap_now_active.text).toBe("-");
		expect(p1_wrap_now_active.isCurrent).toBe(true);
		expect(p1_wrap_now_active.isDimmed).toBe(false);

		// Paragraph 3 wrap is now inactive -> dashes disappear
		const p3_wrap_now_inactive = getGutterRowDisplay(mockLines[4], 1, "focus");
		expect(p3_wrap_now_inactive.text).toBe("");
		expect(p3_wrap_now_inactive.isDimmed).toBe(true);
	});
});
