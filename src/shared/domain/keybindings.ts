/**
 * FictionClosure — Keybindings Domain Subsystem.
 *
 * Provides typed actions, default mappings, keyboard event matching,
 * user keybinding overrides with localStorage persistence, and conflict detection.
 */

export type KeybindingActionId =
    | "commandPalette"
    | "settings"
    | "help"
    | "save"
    | "saveAs"
    | "viewEdit"
    | "viewSplit"
    | "viewRead"
    | "toggleWordWrap"
    | "toggleSidebar"
    | "toggleInspector"
    | "toggleZen"
    | "toggleFocusZen"
    | "toggleCzm"
    | "focusSidebar"
    | "undo"
    | "redo"
    | "find"
    | "findReplace"
    | "bold"
    | "italic"
    | "wikilink"
    | "blockquote"
    | "bulletList"
    | "taskItem"
    | "toggleTask";

export type KeybindingCategory =
    | "general"
    | "document"
    | "workspace"
    | "navigation"
    | "formatting"
    | "editor";

export interface KeybindingDefinition {
    id: KeybindingActionId;
    category: KeybindingCategory;
    label: string;
    description: string;
    defaultKeys: string[];
}

export interface KeyMatchEvent {
    key: string;
    code?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
}

export const LOCAL_STORAGE_KEYBINDINGS_KEY = "fc_user_keybindings";

export const KEYBINDING_DEFINITIONS: KeybindingDefinition[] = [
    // General & Navigation
    { id: "commandPalette", category: "general", label: "Command Palette", description: "Open quick command palette & document search", defaultKeys: ["$mod", "K"] },
    { id: "settings", category: "general", label: "Preferences & Settings", description: "Open application settings modal", defaultKeys: ["$mod", "P"] },
    { id: "help", category: "general", label: "Shortcuts Cheatsheet", description: "Open keyboard shortcuts guide", defaultKeys: ["F1"] },
    // Document
    { id: "save", category: "document", label: "Save Document", description: "Save current document and project to disk", defaultKeys: ["$mod", "S"] },
    { id: "saveAs", category: "document", label: "Save As / Change Folder", description: "Choose a new folder for project storage", defaultKeys: ["$mod", "Shift", "S"] },
    // Workspace & Views
    { id: "viewEdit", category: "workspace", label: "Edit View", description: "Switch to dedicated editor layout", defaultKeys: ["$mod", "1"] },
    { id: "viewSplit", category: "workspace", label: "Split View", description: "Switch to side-by-side editor and markdown preview", defaultKeys: ["$mod", "2"] },
    { id: "viewRead", category: "workspace", label: "Read View", description: "Switch to reader preview layout", defaultKeys: ["$mod", "3"] },
    { id: "toggleWordWrap", category: "workspace", label: "Toggle Word Wrap", description: "Toggle between wrapped and scrolling lines", defaultKeys: ["$mod", "W"] },
    { id: "toggleSidebar", category: "workspace", label: "Toggle Document Sidebar", description: "Show or hide the document explorer tree", defaultKeys: ["$mod", "Alt", "B"] },
    { id: "toggleInspector", category: "workspace", label: "Toggle Document Inspector", description: "Show or hide document metadata & stats drawer", defaultKeys: ["$mod", "J"] },
    { id: "toggleZen", category: "workspace", label: "Toggle Zen Mode", description: "Zen writing mode with centered clean canvas", defaultKeys: ["$mod", "\\"] },
    { id: "toggleFocusZen", category: "workspace", label: "Toggle Focus Zen Mode", description: "Dim non-active paragraphs by 50%", defaultKeys: ["$mod", "Shift", "\\"] },
    { id: "toggleCzm", category: "workspace", label: "Toggle Concentrate Zen (CZM)", description: "Extreme distraction-free full textarea mode", defaultKeys: ["$mod", "Alt", "\\"] },
    { id: "focusSidebar", category: "navigation", label: "Focus Sidebar Tree", description: "Move keyboard focus to document explorer", defaultKeys: ["$mod", "Tab"] },
    // Editor & Text
    { id: "undo", category: "editor", label: "Undo Edit", description: "Revert the last text modification", defaultKeys: ["$mod", "Z"] },
    { id: "redo", category: "editor", label: "Redo Edit", description: "Re-apply reverted edit", defaultKeys: ["$mod", "Alt", "Z"] },
    { id: "find", category: "editor", label: "Find in Document", description: "Open document search bar", defaultKeys: ["$mod", "F"] },
    { id: "findReplace", category: "editor", label: "Find & Replace", description: "Open search and replacement bar", defaultKeys: ["$mod", "Shift", "F"] },
    // Formatting & Markdown
    { id: "bold", category: "formatting", label: "Bold Text", description: "Wrap selected text in **bold** markdown", defaultKeys: ["$mod", "B"] },
    { id: "italic", category: "formatting", label: "Italic Text", description: "Wrap selected text in *italic* markdown", defaultKeys: ["$mod", "I"] },
    { id: "wikilink", category: "formatting", label: "Wikilink Reference", description: "Wrap selected text in [[Wikilink]] tags", defaultKeys: ["$mod", "L"] },
    { id: "blockquote", category: "formatting", label: "Blockquote Line", description: "Toggle markdown quote prefix (> )", defaultKeys: ["$mod", "Q"] },
    { id: "bulletList", category: "formatting", label: "Bullet List Item", description: "Toggle bullet list prefix (- )", defaultKeys: ["$mod", "-"] },
    { id: "taskItem", category: "formatting", label: "Insert Task Item", description: "Insert empty task checkbox (- [ ])", defaultKeys: ["$mod", "Alt", "T"] },
    { id: "toggleTask", category: "formatting", label: "Toggle Task Status", description: "Toggle checkbox between [ ] and [x]", defaultKeys: ["$mod", "T"] },
];

export const DEFAULT_KEYBINDINGS: Record<KeybindingActionId, string[]> = KEYBINDING_DEFINITIONS.reduce(
    (acc, item) => {
        acc[item.id] = [...item.defaultKeys];
        return acc;
    },
    {} as Record<KeybindingActionId, string[]>,
);

export function isMacPlatform(): boolean {
    if (typeof navigator === "undefined") return false;
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = nav.userAgentData?.platform || nav.platform || "";
    return /Mac|iPhone|iPad|iPod/.test(platform);
}

export function formatShortcutKey(key: string, isMac: boolean = isMacPlatform()): string {
    if (key === "$mod") return isMac ? "⌘" : "Ctrl";
    if (key === "Ctrl") return isMac ? "⌃" : "Ctrl";
    if (key === "Alt") return isMac ? "⌥" : "Alt";
    if (key === "Shift") return isMac ? "⇧" : "Shift";
    return key;
}

/**
 * Checks whether a given KeyboardEvent matches the target keys configuration.
 */
export function matchesKeybinding(e: KeyMatchEvent, keys: string[]): boolean {
    if (!keys || keys.length === 0) return false;

    const isMac = isMacPlatform();
    const hasMod = keys.includes("$mod");
    const hasCtrl = keys.includes("Ctrl");
    const hasAlt = keys.includes("Alt");
    const hasShift = keys.includes("Shift");

    // Check Modifier match
    const modPressed = isMac ? Boolean(e.metaKey) : Boolean(e.ctrlKey);
    if (hasMod && !modPressed) return false;
    if (!hasMod && !hasCtrl && (isMac ? Boolean(e.metaKey) : Boolean(e.ctrlKey))) return false;
    if (hasCtrl && !e.ctrlKey) return false;

    if (hasAlt !== Boolean(e.altKey)) return false;

    // Identify main non-modifier key
    const mainKeys = keys.filter((k) => k !== "$mod" && k !== "Ctrl" && k !== "Alt" && k !== "Shift");
    if (mainKeys.length === 0) return false;

    const targetKey = mainKeys[0];

    // Special handling for keys that implicitly involve Shift (like "?", ":")
    if (targetKey !== "?" && targetKey !== ":" && hasShift !== Boolean(e.shiftKey)) {
        return false;
    }

    return isMainKeyMatch(e, targetKey);
}

function isMainKeyMatch(e: KeyMatchEvent, targetKey: string): boolean {
    if (targetKey === "\\") {
        return e.key === "\\" || e.key === "|" || e.code === "Backslash";
    }
    if (targetKey === "-") {
        return e.key === "-" || e.key === "_" || e.code === "Minus";
    }
    if (targetKey === "Tab") {
        return e.key === "Tab" || e.code === "Tab";
    }
    if (targetKey === "Escape" || targetKey === "Esc") {
        return e.key === "Escape";
    }
    if (targetKey.startsWith("F") && targetKey.length <= 3) {
        return e.key.toUpperCase() === targetKey.toUpperCase();
    }
    return e.key.toLowerCase() === targetKey.toLowerCase();
}

/**
 * Matches an action ID against the user's active keybindings.
 */
export function matchesAction(
    actionId: KeybindingActionId,
    e: KeyMatchEvent,
    bindings: Partial<Record<KeybindingActionId, string[]>> = {},
): boolean {
    const keys = bindings[actionId] || DEFAULT_KEYBINDINGS[actionId];
    if (!keys) return false;

    // Special secondary fallback for Redo (e.g. Ctrl+Y)
    if (actionId === "redo") {
        if (matchesKeybinding(e, keys)) return true;
        const isMac = isMacPlatform();
        const modPressed = isMac ? Boolean(e.metaKey) : Boolean(e.ctrlKey);
        if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "y") return true;
        if (modPressed && e.shiftKey && !e.altKey && e.key.toLowerCase() === "z") return true;
        return false;
    }

    // Special fallback for Help (e.g. "?" or "F1")
    if (actionId === "help") {
        if (matchesKeybinding(e, keys)) return true;
        if (keys.includes("F1") && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) return true;
        if (keys.includes("?") && e.key === "F1" && !e.ctrlKey && !e.metaKey && !e.altKey) return true;
        return false;
    }

    return matchesKeybinding(e, keys);
}

/**
 * Captures a key combo from a user keydown event in settings.
 */
export function captureKeyCombo(e: KeyMatchEvent): string[] | null {
    if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) return null;

    const parts: string[] = [];
    const isMac = isMacPlatform();

    if (isMac ? e.metaKey : e.ctrlKey) parts.push("$mod");
    else if (e.ctrlKey) parts.push("Ctrl");

    if (e.altKey) parts.push("Alt");
    if (e.shiftKey && e.key.length === 1 && !"?+:{}|<>~\"_".includes(e.key)) parts.push("Shift");

    let mainKey = e.key;
    if (e.code === "Space") mainKey = "Space";
    else if (e.code === "Backslash") mainKey = "\\";
    else if (e.code === "Minus") mainKey = "-";
    else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();

    parts.push(mainKey);
    return parts;
}

export function keysAreEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val.toLowerCase() === b[idx].toLowerCase());
}

export function findConflictingAction(
    currentId: KeybindingActionId,
    keys: string[],
    allBindings: Record<KeybindingActionId, string[]>,
): KeybindingActionId | null {
    for (const [id, assignedKeys] of Object.entries(allBindings)) {
        if (id !== currentId && keysAreEqual(assignedKeys, keys)) {
            return id as KeybindingActionId;
        }
    }
    return null;
}

export function loadKeybindings(): Record<KeybindingActionId, string[]> {
    if (typeof localStorage === "undefined") return { ...DEFAULT_KEYBINDINGS };
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYBINDINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
                const result = { ...DEFAULT_KEYBINDINGS };
                for (const [key, val] of Object.entries(parsed)) {
                    if (Array.isArray(val) && val.length > 0 && key in DEFAULT_KEYBINDINGS) {
                        result[key as KeybindingActionId] = val.map(String);
                    }
                }
                return result;
            }
        }
    } catch {
        // Fall back to defaults
    }
    return { ...DEFAULT_KEYBINDINGS };
}

export function saveKeybindings(bindings: Partial<Record<KeybindingActionId, string[]>>): void {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(LOCAL_STORAGE_KEYBINDINGS_KEY, JSON.stringify(bindings));
    } catch {
        // Handle storage quota issues silently
    }
}

export function resetKeybindings(): Record<KeybindingActionId, string[]> {
    if (typeof localStorage !== "undefined") {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEYBINDINGS_KEY);
        } catch {
            // Ignore
        }
    }
    return { ...DEFAULT_KEYBINDINGS };
}
