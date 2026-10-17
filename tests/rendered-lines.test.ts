import { describe, expect, test } from "bun:test";
import {
	calculateRenderedLines,
	calculateUnwrappedLines,
	resolveTeleportOffset,
	type RenderedLine,
} from "../src/mainview/utils/renderedLines";

describe("renderedLines", () => {
	test("calculates unwrapped lines for single line", () => {
		const text = "A solitary sentence in the dark.";
		const lines = calculateUnwrappedLines(text);

		expect(lines).toHaveLength(1);
		expect(lines[0].paragraphIndex).toBe(1);
		expect(lines[0].subLineIndex).toBe(0);
		expect(lines[0].isParagraphStart).toBe(true);
		expect(lines[0].display).toBe("1");
		expect(lines[0].startOffset).toBe(0);
		expect(lines[0].endOffset).toBe(text.length);
	});

	test("calculates unwrapped lines for multi-paragraph document with exact offsets", () => {
		const text = "First paragraph.\nSecond paragraph.\nThird.";
		const lines = calculateUnwrappedLines(text);

		expect(lines).toHaveLength(3);

		// Line 1
		expect(lines[0].paragraphIndex).toBe(1);
		expect(lines[0].display).toBe("1");
		expect(lines[0].startOffset).toBe(0);
		expect(lines[0].endOffset).toBe(16); // "First paragraph." length = 16

		// Line 2
		expect(lines[1].paragraphIndex).toBe(2);
		expect(lines[1].display).toBe("2");
		expect(lines[1].startOffset).toBe(17); // after '\n'
		expect(lines[1].endOffset).toBe(17 + 17); // "Second paragraph." length = 17 -> 34

		// Line 3
		expect(lines[2].paragraphIndex).toBe(3);
		expect(lines[2].display).toBe("3");
		expect(lines[2].startOffset).toBe(35); // after '\n'
		expect(lines[2].endOffset).toBe(35 + 6); // "Third." length = 6 -> 41
	});

	test("accurately handles empty lines and trailing newlines", () => {
		const text = "Line 1\n\nLine 3\n";
		const lines = calculateUnwrappedLines(text);

		expect(lines).toHaveLength(4);

		expect(lines[0].display).toBe("1");
		expect(lines[0].startOffset).toBe(0);
		expect(lines[0].endOffset).toBe(6);

		expect(lines[1].display).toBe("2");
		expect(lines[1].startOffset).toBe(7);
		expect(lines[1].endOffset).toBe(7); // empty line

		expect(lines[2].display).toBe("3");
		expect(lines[2].startOffset).toBe(8);
		expect(lines[2].endOffset).toBe(14);

		expect(lines[3].display).toBe("4");
		expect(lines[3].startOffset).toBe(15);
		expect(lines[3].endOffset).toBe(15); // trailing empty paragraph
	});

	test("resolves teleportation offsets for click and Alt+click", () => {
		const line: RenderedLine = {
			paragraphIndex: 2,
			subLineIndex: 1,
			isParagraphStart: false,
			display: "-",
			startOffset: 45,
			endOffset: 92,
		};

		// Regular click teleports to start of line
		expect(resolveTeleportOffset(line, false)).toBe(45);

		// Alt+click teleports to end of line
		expect(resolveTeleportOffset(line, true)).toBe(92);
	});

	test("paragraph highlight condition highlights both number and dashes for active paragraph", () => {
		// Simulated 3-line wrapped paragraph (1 start + 2 dashes) followed by 1 unwrapped paragraph
		const simulatedLines: RenderedLine[] = [
			{
				paragraphIndex: 1,
				subLineIndex: 0,
				isParagraphStart: true,
				display: "1",
				startOffset: 0,
				endOffset: 50,
			},
			{
				paragraphIndex: 1,
				subLineIndex: 1,
				isParagraphStart: false,
				display: "-",
				startOffset: 50,
				endOffset: 100,
			},
			{
				paragraphIndex: 1,
				subLineIndex: 2,
				isParagraphStart: false,
				display: "-",
				startOffset: 100,
				endOffset: 150,
			},
			{
				paragraphIndex: 2,
				subLineIndex: 0,
				isParagraphStart: true,
				display: "2",
				startOffset: 151,
				endOffset: 190,
			},
		];

		const activeCursorParagraph = 1;

		// Lines belonging to active paragraph should be highlighted
		const highlightedLines = simulatedLines.filter(
			(line) => line.paragraphIndex === activeCursorParagraph,
		);

		expect(highlightedLines).toHaveLength(3);
		expect(highlightedLines[0].display).toBe("1");
		expect(highlightedLines[1].display).toBe("-");
		expect(highlightedLines[2].display).toBe("-");

		// Paragraph 2 should not be highlighted
		expect(simulatedLines[3].paragraphIndex === activeCursorParagraph).toBe(false);
	});

	test("calculateRenderedLines falls back gracefully in non-DOM test environments", () => {
		const text = "Alpha\nBeta\nGamma";
		const lines = calculateRenderedLines({
			content: text,
			wordWrap: true,
			textareaEl: null,
			mirrorEl: null,
		});

		expect(lines).toHaveLength(3);
		expect(lines.map((l) => l.display)).toEqual(["1", "2", "3"]);
	});
});
