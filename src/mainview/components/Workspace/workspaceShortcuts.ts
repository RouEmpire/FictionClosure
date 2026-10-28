import type { ViewMode, ZenModeType } from "@shared/types";
import { matchesAction, type KeybindingActionId } from "@shared/domain/keybindings";

export interface WorkspaceKeyContext {
    isCommandPaletteOpen: boolean;
    isNewDocModalOpen: boolean;
    zenMode: ZenModeType;
    showInspector: boolean;
    isSidebarOpen: boolean;
    isDiffActive?: boolean;
    keybindings?: Partial<Record<KeybindingActionId, string[]>>;
    onExitDiff?: () => void;
    onCloseCommandPalette: () => void;
    onCloseNewDocModal: () => void;
    onExitZenMode: () => void;
    onCloseInspector: () => void;
    onOpenShortcuts: () => void;
    onFocusSidebar: () => void;
    onSetViewMode: (mode: ViewMode) => void;
    onToggleWordWrap: () => void;
    onOpenSettings: () => void;
    onToggleSidebar: () => void;
    onToggleInspector: () => void;
    onToggleZenMode: (mode: ZenModeType) => void;
    onToggleCommandPalette: () => void;
    onChangeFolder: () => void;
    onSave: () => void;
}

export function handleWorkspaceGlobalKeyDown(
    e: KeyboardEvent,
    ctx: WorkspaceKeyContext,
): boolean {
    const target = e.target as HTMLElement;
    const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

    const kb = ctx.keybindings;

    // Escape closes open modals or floating drawers in order of depth
    if (e.key === "Escape") {
        if (ctx.isCommandPaletteOpen) {
            e.preventDefault();
            ctx.onCloseCommandPalette();
            return true;
        }
        if (ctx.isNewDocModalOpen) {
            e.preventDefault();
            ctx.onCloseNewDocModal();
            return true;
        }
        if (ctx.isDiffActive && ctx.onExitDiff) {
            e.preventDefault();
            ctx.onExitDiff();
            return true;
        }
        if (ctx.zenMode !== "none") {
            e.preventDefault();
            ctx.onExitZenMode();
            return true;
        }
        if (ctx.showInspector) {
            e.preventDefault();
            ctx.onCloseInspector();
            return true;
        }
    }

    // Help cheatsheet: ? / F1 (only when not typing in an input)
    if (matchesAction("help", e, kb) && !isTyping) {
        e.preventDefault();
        ctx.onOpenShortcuts();
        return true;
    }

    // Focus Sidebar
    if (matchesAction("focusSidebar", e, kb)) {
        e.preventDefault();
        ctx.onFocusSidebar();
        return true;
    }

    // View Modes (Edit, Split, Read)
    if (matchesAction("viewEdit", e, kb)) {
        e.preventDefault();
        ctx.onSetViewMode("editor");
        return true;
    }
    if (matchesAction("viewSplit", e, kb)) {
        e.preventDefault();
        ctx.onSetViewMode("split");
        return true;
    }
    if (matchesAction("viewRead", e, kb)) {
        e.preventDefault();
        ctx.onSetViewMode("preview");
        return true;
    }

    // Toggle Word Wrap
    if (matchesAction("toggleWordWrap", e, kb)) {
        e.preventDefault();
        ctx.onToggleWordWrap();
        return true;
    }

    // Settings Modal
    if (matchesAction("settings", e, kb)) {
        e.preventDefault();
        ctx.onOpenSettings();
        return true;
    }

    // Toggle Sidebar
    if (matchesAction("toggleSidebar", e, kb)) {
        e.preventDefault();
        ctx.onToggleSidebar();
        return true;
    }

    // Toggle Inspector
    if (matchesAction("toggleInspector", e, kb)) {
        e.preventDefault();
        ctx.onToggleInspector();
        return true;
    }

    // Zen Modes (Concentrate CZM, Focus Zen, Normal Zen)
    if (matchesAction("toggleCzm", e, kb)) {
        e.preventDefault();
        ctx.onToggleZenMode("czm");
        return true;
    }
    if (matchesAction("toggleFocusZen", e, kb)) {
        e.preventDefault();
        ctx.onToggleZenMode("focus");
        return true;
    }
    if (matchesAction("toggleZen", e, kb)) {
        e.preventDefault();
        ctx.onToggleZenMode("zen");
        return true;
    }

    // Command Palette
    if (matchesAction("commandPalette", e, kb)) {
        e.preventDefault();
        ctx.onToggleCommandPalette();
        return true;
    }

    // Save As / Change Folder
    if (matchesAction("saveAs", e, kb)) {
        e.preventDefault();
        ctx.onChangeFolder();
        return true;
    }

    // Save Document
    if (matchesAction("save", e, kb)) {
        e.preventDefault();
        ctx.onSave();
        return true;
    }

    return false;
}
