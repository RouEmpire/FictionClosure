import type { ViewMode, ZenModeType } from "@shared/types";

export interface WorkspaceKeyContext {
    isCommandPaletteOpen: boolean;
    isNewDocModalOpen: boolean;
    zenMode: ZenModeType;
    showInspector: boolean;
    isSidebarOpen: boolean;
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

    const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modPressed = isMac ? e.metaKey : e.ctrlKey;

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

    // Help cheatsheet: ?
    if (e.key === "?" && !isTyping && !modPressed) {
        e.preventDefault();
        ctx.onOpenShortcuts();
        return true;
    }

    // Focus Sidebar: Ctrl+Tab
    if (
        modPressed &&
        (e.key === "Tab" || e.code === "Tab" || e.keyCode === 9)
    ) {
        e.preventDefault();
        ctx.onFocusSidebar();
        return true;
    }

    // View Mode: Edit (Ctrl+1)
    if (modPressed && !e.altKey && !e.shiftKey && e.key === "1") {
        e.preventDefault();
        ctx.onSetViewMode("editor");
        return true;
    }

    // View Mode: Split (Ctrl+2)
    if (modPressed && !e.altKey && !e.shiftKey && e.key === "2") {
        e.preventDefault();
        ctx.onSetViewMode("split");
        return true;
    }

    // View Mode: Read (Ctrl+3)
    if (modPressed && !e.altKey && !e.shiftKey && e.key === "3") {
        e.preventDefault();
        ctx.onSetViewMode("preview");
        return true;
    }

    // Toggle word wrap: Ctrl+W
    if (
        modPressed &&
        !e.altKey &&
        !e.shiftKey &&
        e.key.toLowerCase() === "w"
    ) {
        e.preventDefault();
        ctx.onToggleWordWrap();
        return true;
    }

    // Settings modal: Ctrl+P
    if (modPressed && !e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        ctx.onOpenSettings();
        return true;
    }

    // Sidebar toggle: Ctrl+Alt+B
    if (modPressed && e.altKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        ctx.onToggleSidebar();
        return true;
    }

    // Inspector toggle: Ctrl+J
    if (modPressed && e.key.toLowerCase() === "j") {
        e.preventDefault();
        ctx.onToggleInspector();
        return true;
    }

    // Zen Mode: Ctrl+\
    if (
        modPressed &&
        !e.shiftKey &&
        !e.altKey &&
        (e.key === "\\" || e.code === "Backslash")
    ) {
        e.preventDefault();
        ctx.onToggleZenMode("zen");
        return true;
    }

    // Focus Zen Mode: Ctrl+Shift+\
    if (
        modPressed &&
        e.shiftKey &&
        !e.altKey &&
        (e.key === "\\" || e.key === "|" || e.code === "Backslash")
    ) {
        e.preventDefault();
        ctx.onToggleZenMode("focus");
        return true;
    }

    // Concentrate Zen Mode (CZM): Ctrl+Alt+\
    if (
        modPressed &&
        e.altKey &&
        !e.shiftKey &&
        (e.key === "\\" || e.code === "Backslash")
    ) {
        e.preventDefault();
        ctx.onToggleZenMode("czm");
        return true;
    }

    // Command palette: Ctrl+K
    if (modPressed && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ctx.onToggleCommandPalette();
        return true;
    }

    // Save As / Change Folder: Ctrl+Shift+S
    if (modPressed && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ctx.onChangeFolder();
        return true;
    }

    // Save: Ctrl+S
    if (modPressed && !e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        ctx.onSave();
        return true;
    }

    return false;
}
