import { describe, test, expect, mock } from "bun:test";
import type { FictionDocument } from "../src/shared/types";
import {
	buildStaticActions,
	filterPaletteItems,
	getDocIcon,
	getDocSnippet,
} from "../src/mainview/components/CommandPalette/paletteHelpers";

describe("CommandPalette Helpers & Search Filtering", () => {
	const mockHandlers = {
		onNewDoc: mock(() => {}),
		onSave: mock(() => {}),
		onSetViewMode: mock(() => {}),
		onChangeFolder: mock(() => {}),
		onOpenSettings: mock(() => {}),
	};

	const sampleDocs: FictionDocument[] = [
		{
			id: "doc-1",
			title: "Chapter 1: The Departure",
			content: "# Chapter 1\nThe wind was howling across the dark sea.",
			type: "manuscript",
			tags: ["act1", "intro"],
			createdAt: 1000,
			updatedAt: 1000,
		},
		{
			id: "doc-2",
			title: "Kaelen Character Sheet",
			summary: "A rogue navigator with an ancient compass.",
			content: "Skills: lockpicking, navigation, archery.",
			type: "character",
			tags: ["protagonist"],
			createdAt: 1000,
			updatedAt: 1000,
		},
		{
			id: "doc-3",
			title: "The Silver Archipelago",
			content: "A cluster of seven floating islands in the southern sea.",
			type: "world",
			tags: ["islands", "magic"],
			createdAt: 1000,
			updatedAt: 1000,
		},
	];

	test("buildStaticActions provides 9 workspace actions and executes callbacks", () => {
		const actions = buildStaticActions(mockHandlers);
		expect(actions.length).toBe(9);

		const saveAction = actions.find((a) => a.id === "act-save");
		expect(saveAction).toBeDefined();
		saveAction?.execute();
		expect(mockHandlers.onSave).toHaveBeenCalled();

		const charAction = actions.find((a) => a.id === "act-new-char");
		expect(charAction).toBeDefined();
		charAction?.execute();
		expect(mockHandlers.onNewDoc).toHaveBeenCalledWith("character");
	});

	test("filterPaletteItems returns all documents followed by actions when query is empty", () => {
		const actions = buildStaticActions(mockHandlers);
		const items = filterPaletteItems("", sampleDocs, actions);

		expect(items.length).toBe(sampleDocs.length + actions.length);
		expect(items[0].type).toBe("document");
		expect(items[sampleDocs.length].type).toBe("action");
	});

	test("filterPaletteItems matches documents by title, tags, or content", () => {
		const actions = buildStaticActions(mockHandlers);

		// Match by title
		const titleMatch = filterPaletteItems("Departure", sampleDocs, actions);
		expect(titleMatch.some((i) => i.id === "doc-1")).toBe(true);

		// Match by tag
		const tagMatch = filterPaletteItems("protagonist", sampleDocs, actions);
		expect(tagMatch.some((i) => i.id === "doc-2")).toBe(true);

		// Match by content
		const contentMatch = filterPaletteItems("floating islands", sampleDocs, actions);
		expect(contentMatch.some((i) => i.id === "doc-3")).toBe(true);
	});

	test("filterPaletteItems matches actions by title or subtitle", () => {
		const actions = buildStaticActions(mockHandlers);

		const splitMatch = filterPaletteItems("split", sampleDocs, actions);
		expect(splitMatch.some((i) => i.id === "act-split")).toBe(true);

		const fontMatch = filterPaletteItems("typography", sampleDocs, actions);
		expect(fontMatch.some((i) => i.id === "act-settings")).toBe(true);
	});

	test("getDocIcon maps document types to FontAwesome icons correctly", () => {
		expect(getDocIcon("manuscript")).toBe("fa-solid fa-book-open");
		expect(getDocIcon("character")).toBe("fa-solid fa-user");
		expect(getDocIcon("plot")).toBe("fa-solid fa-chart-line");
		expect(getDocIcon("world")).toBe("fa-solid fa-map");
		expect(getDocIcon("note")).toBe("fa-solid fa-file-lines");
	});

	test("getDocSnippet prioritizes summary and strips markdown header symbols from content", () => {
		expect(getDocSnippet(sampleDocs[1])).toBe("A rogue navigator with an ancient compass.");
		expect(getDocSnippet(sampleDocs[0])).toBe("Chapter 1\nThe wind was howling across the dark sea.");
	});
});
