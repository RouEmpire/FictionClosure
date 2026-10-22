<script lang="ts">
    import type {
        DocumentType,
        FictionDocument,
        ProjectFolder,
        ViewMode,
        ZenModeType,
    } from "@shared/types";
    import type { EditorTypographySettings } from "@shared/domain/typography";
    import Sidebar from "./Sidebar/Sidebar.svelte";
    import WorkspaceStage from "./WorkspaceStage.svelte";
    import Inspector from "./Inspector/Inspector.svelte";

    interface Props {
        isSidebarOpen: boolean;
        showInspector: boolean;
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
        wordWrap: boolean;
        sidebarRef: ReturnType<typeof Sidebar> | null;
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
        onShowToast: (msg: string) => void;
    }

    let {
        isSidebarOpen,
        showInspector,
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
        wordWrap,
        sidebarRef = $bindable(null),
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
        onShowToast,
    }: Props = $props();
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
        {wordWrap}
        {viewMode}
        {zenMode}
        {onContentChange}
        {onSave}
        {onToggleWordWrap}
        {onToggleZenMode}
        {onExitZen}
        onSelectWikilink={onNavigateToDocTitle}
        onCreateNewDoc={() => onOpenNewDocModal("manuscript")}
    />

    {#if showInspector && zenMode === "none" && (activeDoc || inspectedFolder)}
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
    {/if}
</div>

<style>
    @import "./workspace.css";
</style>
