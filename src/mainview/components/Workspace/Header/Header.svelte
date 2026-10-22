<script lang="ts">
    import type {
        FictionDocument,
        SaveState,
        ViewMode,
        ZenModeType,
    } from "@shared/types";
    import HeaderLeft from "./HeaderLeft.svelte";
    import HeaderCenter from "./HeaderCenter.svelte";
    import HeaderRight from "./HeaderRight.svelte";

    interface Props {
        projectName: string;
        folderPath?: string;
        lastSaved?: string;
        activeDoc: FictionDocument | null;
        saveState: SaveState;
        viewMode: ViewMode;
        isSidebarOpen: boolean;
        onToggleSidebar: () => void;
        zenMode: ZenModeType;
        onSelectZenMode: (mode: ZenModeType) => void;
        showInspector: boolean;
        onToggleInspector: () => void;
        onSetViewMode: (mode: ViewMode) => void;
        onSave: () => void;
        onChangeFolder: () => void;
        onOpenCommandPalette: () => void;
        onOpenShortcuts: () => void;
        onCloseProject?: () => void;
    }

    let {
        projectName,
        folderPath,
        lastSaved,
        activeDoc,
        saveState,
        viewMode,
        isSidebarOpen,
        onToggleSidebar,
        zenMode,
        onSelectZenMode,
        showInspector,
        onToggleInspector,
        onSetViewMode,
        onSave,
        onChangeFolder: _onChangeFolder,
        onOpenCommandPalette,
        onOpenShortcuts,
        onCloseProject,
    }: Props = $props();
</script>

<header class="app-header">
    <HeaderLeft
        {projectName}
        {isSidebarOpen}
        {onCloseProject}
        {onToggleSidebar}
        {onOpenCommandPalette}
    />

    <HeaderCenter {activeDoc} />

    <HeaderRight
        {saveState}
        {folderPath}
        {lastSaved}
        {viewMode}
        {zenMode}
        {showInspector}
        {onSave}
        {onSetViewMode}
        {onSelectZenMode}
        {onToggleInspector}
        {onOpenShortcuts}
    />
</header>

<style>
    .app-header {
        height: var(--header-height);
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        user-select: none;
        flex-shrink: 0;
    }
</style>
