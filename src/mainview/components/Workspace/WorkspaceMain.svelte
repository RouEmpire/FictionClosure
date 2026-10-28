<script lang="ts">
    import type {
        DocumentType,
        FictionDocument,
        ProjectFolder,
        SaveState,
        ViewMode,
        ZenModeType,
    } from "@shared/types";
    import type { GitCommitRecord } from "@shared/domain/git";
    import type { EditorTypographySettings } from "@shared/domain/typography";
    import { DEFAULT_VIM_SETTINGS, type VimSettings } from "@shared/domain/vim";
    import Sidebar from "./Sidebar/Sidebar.svelte";
    import WorkspaceStage from "./WorkspaceStage.svelte";
    import Inspector from "./Inspector/Inspector.svelte";
    import GitSidebar from "./GitSidebar/GitSidebar.svelte";

    interface Props {
        isSidebarOpen: boolean;
        showInspector?: boolean;
        activeRightSidebar?: "none" | "inspector" | "git";
        zenMode: ZenModeType;
        viewMode: ViewMode;
        activeDoc: FictionDocument | null;
        inspectedFolder: ProjectFolder | null;
        documents: FictionDocument[];
        folders: ProjectFolder[];
        targetWordCount?: number;
        folderPath?: string;
        editorFont?: string;
        typography?: EditorTypographySettings;
        vimSettings?: VimSettings;
        wordWrap: boolean;
        sidebarRef: ReturnType<typeof Sidebar> | null;
        diffCommit?: GitCommitRecord | null;
        diffChangedDocIds?: Set<string> | null;
        writerName?: string;
        saveState?: SaveState;
        onSelectDiff?: (commit: GitCommitRecord) => void;
        onExitDiff?: () => void;
        onSelectDoc: (id: string) => void;
        onSelectFolder: (id: string) => void;
        onOpenNewDocModal: (type?: DocumentType, parentId?: string) => void;
        onOpenNewFolderModal: (parentId?: string) => void;
        onDeleteDoc: (id: string) => void;
        onDeleteFolder: (id: string) => void;
        onRenameDoc: (id: string, title: string) => void;
        onRenameFolder: (id: string, name: string) => void;
        onDuplicateDoc: (id: string) => void;
        onOpenInspector: (id: string) => void;
        onInspectFolder: (id: string) => void;
        onContentChange: (content: string) => void;
        onSave: () => void;
        onToggleWordWrap: () => void;
        onToggleZenMode: (mode: ZenModeType) => void;
        onExitZen: () => void;
        onNavigateToDocTitle: (title: string) => void;
        onUpdateDocMeta: (updates: Partial<FictionDocument>) => void;
        onUpdateFolderMeta: (id: string, updates: Partial<ProjectFolder>) => void;
        onCloseInspector: () => void;
        onCloseGitSidebar?: () => void;
        onReloadProject?: () => Promise<void>;
        onShowToast: (msg: string) => void;
    }

    let {
        isSidebarOpen,
        showInspector = true,
        activeRightSidebar = "inspector",
        zenMode,
        viewMode,
        activeDoc,
        inspectedFolder,
        documents,
        folders,
        targetWordCount,
        folderPath,
        editorFont,
        typography,
        vimSettings = DEFAULT_VIM_SETTINGS,
        wordWrap,
        sidebarRef = $bindable(null),
        diffCommit = null,
        diffChangedDocIds = null,
        writerName = "Author",
        saveState = "saved",
        onSelectDiff,
        onExitDiff,
        onSelectDoc,
        onSelectFolder,
        onOpenNewDocModal,
        onOpenNewFolderModal,
        onDeleteDoc,
        onDeleteFolder,
        onRenameDoc,
        onRenameFolder,
        onDuplicateDoc,
        onOpenInspector,
        onInspectFolder,
        onContentChange,
        onSave,
        onToggleWordWrap,
        onToggleZenMode,
        onExitZen,
        onNavigateToDocTitle,
        onUpdateDocMeta,
        onUpdateFolderMeta,
        onCloseInspector,
        onCloseGitSidebar,
        onReloadProject = async () => {},
        onShowToast,
    }: Props = $props();

    const isInspectorVisible = $derived(
        (activeRightSidebar === "inspector" || (!activeRightSidebar && showInspector)) &&
            zenMode === "none" &&
            (activeDoc !== null || inspectedFolder !== null),
    );
    const isGitVisible = $derived(
        activeRightSidebar === "git" && zenMode === "none",
    );
</script>

<div class="workspace-main">
    {#if isSidebarOpen}
        <Sidebar
            bind:this={sidebarRef}
            {documents}
            {folders}
            {targetWordCount}
            activeDocId={activeDoc?.id ?? null}
            activeFolderId={inspectedFolder?.id ?? null}
            {folderPath}
            {diffChangedDocIds}
            {onSelectDoc}
            {onSelectFolder}
            onNewDoc={onOpenNewDocModal}
            onNewFolder={onOpenNewFolderModal}
            {onDeleteDoc}
            {onDeleteFolder}
            {onRenameDoc}
            {onRenameFolder}
            {onDuplicateDoc}
            {onOpenInspector}
            {onInspectFolder}
            {onShowToast}
        />
    {/if}

    <WorkspaceStage
        {activeDoc}
        {documents}
        {folders}
        {editorFont}
        {typography}
        {vimSettings}
        {wordWrap}
        {viewMode}
        {zenMode}
        {folderPath}
        {writerName}
        {diffCommit}
        {onExitDiff}
        {onContentChange}
        {onSave}
        {onToggleWordWrap}
        {onToggleZenMode}
        {onExitZen}
        onSelectWikilink={onNavigateToDocTitle}
        onCreateNewDoc={() => onOpenNewDocModal("manuscript")}
    />

    {#if isInspectorVisible}
        <Inspector
            document={inspectedFolder ? null : activeDoc}
            folder={inspectedFolder}
            allDocuments={documents}
            allFolders={folders}
            {onUpdateDocMeta}
            {onUpdateFolderMeta}
            {onNavigateToDocTitle}
            onSelectDoc={(docId) => {
                onSelectDoc(docId);
            }}
            onSelectFolder={onInspectFolder}
            onClose={onCloseInspector}
        />
    {:else if isGitVisible}
        <GitSidebar
            {folderPath}
            activeDiffCommitHash={diffCommit?.hash ?? null}
            {saveState}
            {onSelectDiff}
            onSaveBeforeCommit={async () => onSave()}
            {onReloadProject}
            onClose={() => {
                if (onCloseGitSidebar) onCloseGitSidebar();
            }}
            {onShowToast}
        />
    {/if}
</div>
