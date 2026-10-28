import type { ShortcutsConfig, ResolvedShortcutGroup } from "./types";
import type { KeybindingActionId } from "@shared/domain/keybindings";

export function isMacPlatform(): boolean {
	if (typeof navigator === "undefined") return false;
	const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
	const platform = nav.userAgentData?.platform || nav.platform || "";
	return /Mac|iPhone|iPad|iPod/.test(platform);
}

export function resolveModKey(isMac: boolean = isMacPlatform()): string {
	return isMac ? "⌘" : "Ctrl";
}

export function resolveShortcutKeys(keys: string[], modKey: string): string[] {
	return keys.map((key) => (key === "$mod" ? modKey : key));
}

const DESC_ACTION_MAP: [RegExp, KeybindingActionId][] = [
	[/command palette/i, "commandPalette"],
	[/preferences & settings/i, "settings"],
	[/cheatsheet/i, "help"],
	[/save project and current/i, "save"],
	[/save as/i, "saveAs"],
	[/edit view/i, "viewEdit"],
	[/split view/i, "viewSplit"],
	[/read view/i, "viewRead"],
	[/word wrap/i, "toggleWordWrap"],
	[/toggle document tree/i, "toggleSidebar"],
	[/inspector drawer/i, "toggleInspector"],
	[/concentrate zen mode/i, "toggleCzm"],
	[/focus zen mode/i, "toggleFocusZen"],
	[/toggle zen mode/i, "toggleZen"],
	[/focus sidebar tree/i, "focusSidebar"],
	[/undo edit/i, "undo"],
	[/redo edit/i, "redo"],
	[/find & replace/i, "findReplace"],
	[/find in document/i, "find"],
	[/bold selected/i, "bold"],
	[/italicize/i, "italic"],
	[/wikilink/i, "wikilink"],
	[/blockquote/i, "blockquote"],
	[/bullet list/i, "bulletList"],
	[/insert task checkbox/i, "taskItem"],
	[/toggle task checkbox/i, "toggleTask"],
];

function findActionForDesc(desc: string): KeybindingActionId | null {
	for (const [regex, actionId] of DESC_ACTION_MAP) {
		if (regex.test(desc)) return actionId;
	}
	return null;
}

export function resolveShortcutGroups(
	groups: ShortcutsConfig["groups"],
	isMac: boolean = isMacPlatform(),
	userKeybindings?: Partial<Record<KeybindingActionId, string[]>>,
): ResolvedShortcutGroup[] {
	const modKey = resolveModKey(isMac);
	return groups.map((group) => ({
		id: group.id,
		title: group.title,
		shortcuts: group.shortcuts.map((sc) => {
			let rawKeys = sc.keys;
			if (userKeybindings) {
				const actionId = findActionForDesc(sc.desc);
				if (actionId && userKeybindings[actionId]) {
					rawKeys = userKeybindings[actionId]!;
				}
			}
			return {
				desc: sc.desc,
				keys: resolveShortcutKeys(rawKeys, modKey),
			};
		}),
	}));
}
