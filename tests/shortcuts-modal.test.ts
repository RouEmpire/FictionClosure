import { describe, test, expect } from "bun:test";
import defaultShortcutsConfig from "../src/mainview/components/ShortcutsModal/shortcutsData.json";
import {
	resolveModKey,
	resolveShortcutKeys,
	resolveShortcutGroups,
} from "../src/mainview/components/ShortcutsModal/shortcutsHelper";

describe("ShortcutsModal Programmatic View & Config", () => {
	test("shortcutsData.json has valid header and footer schema", () => {
		expect(defaultShortcutsConfig.header.title).toBe("Keyboard Shortcuts");
		expect(defaultShortcutsConfig.header.icon).toBe("fa-solid fa-keyboard");
		expect(defaultShortcutsConfig.footer.buttonText).toBe("Done");
		expect(defaultShortcutsConfig.footer.tipKey).toBe("?");
	});

	test("contains all 6 required shortcut categories", () => {
		const groupIds = defaultShortcutsConfig.groups.map((g) => g.id);
		expect(groupIds).toEqual([
			"general",
			"document",
			"workspace",
			"sidebar",
			"formatting",
			"editor",
		]);
	});

	test("every shortcut row has a description and keys array", () => {
		for (const group of defaultShortcutsConfig.groups) {
			expect(group.title.length).toBeGreaterThan(0);
			expect(group.shortcuts.length).toBeGreaterThan(0);
			for (const sc of group.shortcuts) {
				expect(sc.desc.length).toBeGreaterThan(0);
				expect(sc.keys.length).toBeGreaterThan(0);
			}
		}
	});

	test("resolves $mod key appropriately across platforms", () => {
		expect(resolveModKey(true)).toBe("⌘");
		expect(resolveModKey(false)).toBe("Ctrl");

		const macKeys = resolveShortcutKeys(["$mod", "Shift", "S"], "⌘");
		expect(macKeys).toEqual(["⌘", "Shift", "S"]);

		const winKeys = resolveShortcutKeys(["$mod", "Shift", "S"], "Ctrl");
		expect(winKeys).toEqual(["Ctrl", "Shift", "S"]);
	});

	test("resolveShortcutGroups transforms groups for target platform", () => {
		const resolvedMac = resolveShortcutGroups(defaultShortcutsConfig.groups, true);
		const resolvedWin = resolveShortcutGroups(defaultShortcutsConfig.groups, false);

		// General group first shortcut is $mod+K
		expect(resolvedMac[0].shortcuts[0].keys).toEqual(["⌘", "K"]);
		expect(resolvedWin[0].shortcuts[0].keys).toEqual(["Ctrl", "K"]);

		// Non-mod shortcuts remain untouched
		const questionShortcut = resolvedMac[0].shortcuts.find((s) => s.desc.includes("cheatsheet"));
		expect(questionShortcut?.keys).toEqual(["?"]);
	});
});
