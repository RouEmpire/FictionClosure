import type { ShortcutsConfig, ResolvedShortcutGroup } from "./types";

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

export function resolveShortcutGroups(
	groups: ShortcutsConfig["groups"],
	isMac: boolean = isMacPlatform(),
): ResolvedShortcutGroup[] {
	const modKey = resolveModKey(isMac);
	return groups.map((group) => ({
		id: group.id,
		title: group.title,
		shortcuts: group.shortcuts.map((sc) => ({
			desc: sc.desc,
			keys: resolveShortcutKeys(sc.keys, modKey),
		})),
	}));
}
