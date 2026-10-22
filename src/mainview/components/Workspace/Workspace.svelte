<script lang="ts">
    import { onMount } from "svelte";
    import type {
        DocumentType,
        FictionDocument,
        ProjectFolder,
        SaveState,
        ViewMode,
        ZenModeType,
    } from "@shared/types";
    import { initialFolders } from "@shared/fixtures/sampleData";
    import { promptSelectFolder, setRememberedFolder, saveCrashCache } from "@services/storage";
    import { globalHistoryManager } from "@services/historyManager";
    import Header from "./Header/Header.svelte";
    import Sidebar from "./Sidebar/Sidebar.svelte";
    import WorkspaceMain from "./WorkspaceMain.svelte";
    import WorkspaceModals from "./WorkspaceModals.svelte";
    import { handleWorkspaceGlobalKeyDown } from "./workspaceShortcuts";
    import {
        cascadeDeleteFolder,
        duplicateDocument,
        renameFolderInList,
        updateFolderMetaInList,
        deleteDocFromList,
        renameDocInList,
    } from "./workspaceDocActions";
    import { executeSave, findDocOrFolderByTitle, createNewDocument } from "./workspaceOperations";
    import type { WorkspaceProps } from "./workspaceTypes";

    let {
        project = $bindable(),
        documents = $bindable([]),
        editorFont = "",
        typography,
        onCloseProject,
        onOpenSettings,
        onOpenShortcuts,
        onProjectSaved,
        onShowToast,
    }: WorkspaceProps = $props();

    let folders = $state<ProjectFolder[]>(
        project.folders && project.folders.length > 0 ? project.folders : [...initialFolders],
    );
    let inspectedFolderId = $state<string | null>(null);
    let activeDocId = $state<string | null>(documents[0]?.id ?? null);
    let saveState = $state<SaveState>("saved");
    let viewMode = $state<ViewMode>("split");
    let isSidebarOpen = $state(true);
    let showInspector = $state(true);
    let zenMode = $state<ZenModeType>("none");
    let isCommandPaletteOpen = $state(false);
    let isNewDocModalOpen = $state(false);
    let isProjectSettingsOpen = $state(false);
    let wordWrap = $state<boolean>(true);
    let sidebarRef = $state<ReturnType<typeof Sidebar> | null>(null);
    let newDocInitialType = $state<DocumentType>("manuscript");
    let newDocInitialMode = $state<"document" | "folder">("document");
    let newDocParentFolderId = $state<string | null>(null);
    let preZenState = { sidebar: true, inspector: true };

    const activeDoc = $derived(documents.find((d) => d.id === activeDocId) ?? null);
    const inspectedFolder = $derived(
        inspectedFolderId ? folders.find((f) => f.id === inspectedFolderId) ?? null : null,
    );

    $effect(() => {
        if (project.folders && project.folders.length > 0) folders = project.folders;
    });

    $effect(() => {
        if (documents.length > 0) {
            if (!activeDocId || !documents.some((d) => d.id === activeDocId)) {
                activeDocId = documents[0].id;
            }
        } else {
            activeDocId = null;
        }
    });

    function toggleWordWrap() {
        wordWrap = !wordWrap;
        onShowToast(wordWrap ? "Word wrap enabled" : "Word wrap disabled");
    }

    function setZenMode(target: ZenModeType) {
        if (zenMode === target) { exitZenMode(); return; }
        if (zenMode === "none") preZenState = { sidebar: isSidebarOpen, inspector: showInspector };
        zenMode = target;
        isSidebarOpen = false;
        showInspector = false;
        const msg = target === "zen"
            ? "Zen mode enabled (Press Esc or Ctrl+\\ to exit)"
            : target === "focus"
              ? "Focus Zen mode enabled (Press Esc or Ctrl+Shift+\\ to exit)"
              : "Concentrate Zen mode enabled (Press Esc to exit)";
        onShowToast(msg);
    }

    function exitZenMode() {
        if (zenMode !== "none") {
            isSidebarOpen = preZenState.sidebar;
            showInspector = preZenState.inspector;
            zenMode = "none";
            onShowToast("Exited Zen mode");
        }
    }

    onMount(() => {
        globalHistoryManager.setTargetWordCount(project.targetWordCount);
        if (!activeDocId && documents.length > 0) activeDocId = documents[0].id;
    });

    let crashCacheTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleCrashCache() {
        if (!project.folderPath) return;
        if (crashCacheTimer) clearTimeout(crashCacheTimer);
        crashCacheTimer = setTimeout(() => {
            if (saveState === "unsaved" && project.folderPath) {
                void saveCrashCache(project.folderPath, project, documents);
            }
        }, 800);
    }

    function handleContentChange(newContent: string) {
        if (!activeDoc) return;
        activeDoc.content = newContent;
        activeDoc.updatedAt = new Date().toISOString();
        saveState = "unsaved";
        scheduleCrashCache();
    }

    async function handleSave() {
        if (saveState === "saving") return;
        saveState = "saving";
        const res = await executeSave(project, documents, folders, onShowToast, onProjectSaved);
        saveState = res.state;
        if (res.state === "saved" && crashCacheTimer) clearTimeout(crashCacheTimer);
    }

    async function handleChangeFolder() {
        const res = await promptSelectFolder(project.folderPath);
        if (res.canceled || !res.folderPath) return;
        project.folderPath = res.folderPath;
        await setRememberedFolder(res.folderPath);
        await handleSave();
    }

    function handleSelectDoc(id: string) {
        if (activeDocId !== id || inspectedFolderId !== null) {
            if (saveState === "unsaved" && project.folderPath) void handleSave();
            activeDocId = id;
            inspectedFolderId = null;
        }
    }

    function handleNavigateToDocTitle(title: string) {
        const match = findDocOrFolderByTitle(title, documents, folders);
        if (match.doc) { handleSelectDoc(match.doc.id); return; }
        if (match.folder) {
            inspectedFolderId = match.folder.id;
            showInspector = true;
            onShowToast(`Opened folder "${match.folder.name}" in Inspector`);
            return;
        }
        if (confirm(`Document or folder "${title}" not found. Create document now?`)) {
            const newDoc = createNewDocument(title, documents.length + 1);
            documents.push(newDoc);
            activeDocId = newDoc.id;
            inspectedFolderId = null;
            void handleSave();
        }
    }

    function handleOpenNewDocModal(type: DocumentType = "manuscript", parentFolderId?: string) {
        newDocInitialType = type;
        newDocInitialMode = "document";
        newDocParentFolderId = parentFolderId || null;
        isNewDocModalOpen = true;
    }

    function handleOpenNewFolderModal(parentFolderId?: string) {
        newDocInitialMode = "folder";
        newDocParentFolderId = parentFolderId || null;
        isNewDocModalOpen = true;
    }

    function handleCreateDoc(newDoc: FictionDocument) {
        documents.push(newDoc);
        activeDocId = newDoc.id;
        inspectedFolderId = null;
        void handleSave();
    }

    function handleCreateFolder(newFolder: ProjectFolder) {
        folders.push(newFolder);
        project.folders = folders;
        inspectedFolderId = newFolder.id;
        showInspector = true;
        saveState = "unsaved";
        onShowToast(`Created folder "${newFolder.name}"`);
        void handleSave();
    }

    function handleDeleteFolder(folderId: string) {
        const { remainingFolders, deletedFolder } = cascadeDeleteFolder(folders, documents, folderId);
        if (!deletedFolder) return;
        folders = remainingFolders;
        project.folders = folders;
        if (inspectedFolderId === folderId) inspectedFolderId = null;
        saveState = "unsaved";
        onShowToast(`Deleted folder "${deletedFolder.name}"`);
        void handleSave();
    }

    function handleRenameFolder(folderId: string, newName: string) {
        const f = renameFolderInList(folders, folderId, newName);
        if (!f) return;
        project.folders = folders;
        saveState = "unsaved";
        onShowToast(`Renamed folder to "${f.name}"`);
        void handleSave();
    }

    function handleUpdateFolderMeta(folderId: string, updates: Partial<ProjectFolder>) {
        if (updateFolderMetaInList(folders, folderId, updates)) {
            project.folders = folders;
            saveState = "unsaved";
            scheduleCrashCache();
        }
    }

    function handleDeleteDoc(id: string) {
        const res = deleteDocFromList(documents, activeDocId, id);
        if (res.deleted) {
            activeDocId = res.newActiveDocId;
            void handleSave();
        }
    }

    function handleUpdateDocMeta(updates: Partial<FictionDocument>) {
        if (!activeDoc) return;
        Object.assign(activeDoc, updates);
        activeDoc.updatedAt = new Date().toISOString();
        saveState = "unsaved";
        scheduleCrashCache();
    }

    function handleRenameDoc(id: string, newTitle: string) {
        const doc = renameDocInList(documents, id, newTitle);
        if (!doc) return;
        saveState = "unsaved";
        onShowToast(`Renamed to "${doc.title}"`);
        void handleSave();
    }

    function handleDuplicateDoc(id: string) {
        const newDoc = duplicateDocument(documents, id);
        if (!newDoc) return;
        activeDocId = newDoc.id;
        inspectedFolderId = null;
        saveState = "unsaved";
        onShowToast(`Duplicated "${newDoc.title.replace(" (Copy)", "")}"`);
        void handleSave();
    }

    async function handleCloseAndReturn() {
        if (saveState === "unsaved" && project.folderPath) await handleSave();
        onCloseProject();
    }

    function handleUpdateProjectSettings(updated: {
        name: string;
        author: string;
        genre: string;
        targetWordCount: number;
        coverImage?: string;
        readme?: string;
    }) {
        project = {
            ...project,
            name: updated.name,
            author: updated.author,
            genre: updated.genre,
            targetWordCount: updated.targetWordCount,
            coverImage: updated.coverImage,
            readme: updated.readme,
        };
        globalHistoryManager.setTargetWordCount(project.targetWordCount);
        saveState = "unsaved";
        onShowToast(`Updated project settings for "${project.name}"`);
        void handleSave();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && isProjectSettingsOpen) {
            isProjectSettingsOpen = false;
            e.preventDefault();
            return;
        }

        handleWorkspaceGlobalKeyDown(e, {
            isCommandPaletteOpen,
            isNewDocModalOpen,
            zenMode,
            showInspector,
            isSidebarOpen,
            onCloseCommandPalette: () => (isCommandPaletteOpen = false),
            onCloseNewDocModal: () => (isNewDocModalOpen = false),
            onExitZenMode: exitZenMode,
            onCloseInspector: () => { showInspector = false; inspectedFolderId = null; },
            onOpenShortcuts,
            onFocusSidebar: () => {
                if (!isSidebarOpen) isSidebarOpen = true;
                setTimeout(() => sidebarRef?.focusSidebar(), 30);
            },
            onSetViewMode: (mode) => (viewMode = mode),
            onToggleWordWrap: toggleWordWrap,
            onOpenSettings,
            onToggleSidebar: () => (isSidebarOpen = !isSidebarOpen),
            onToggleInspector: () => (showInspector = !showInspector),
            onToggleZenMode: (m) => (zenMode === m ? exitZenMode() : setZenMode(m)),
            onToggleCommandPalette: () => (isCommandPaletteOpen = !isCommandPaletteOpen),
            onChangeFolder: () => void handleChangeFolder(),
            onSave: () => void handleSave(),
        });
    }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div
    class="fictionclosure-workspace"
    class:zen-active={zenMode !== "none"}
    class:czm-active={zenMode === "czm"}
>
    {#if zenMode !== "czm"}
        <Header
            projectName={project.name}
            folderPath={project.folderPath}
            lastSaved={project.lastSaved}
            {activeDoc}
            {saveState}
            {viewMode}
            {isSidebarOpen}
            onToggleSidebar={() => (isSidebarOpen = !isSidebarOpen)}
            {zenMode}
            onSelectZenMode={setZenMode}
            {showInspector}
            onToggleInspector={() => (showInspector = !showInspector)}
            onSetViewMode={(mode) => (viewMode = mode)}
            onSave={handleSave}
            onChangeFolder={handleChangeFolder}
            onOpenCommandPalette={() => (isCommandPaletteOpen = true)}
            onOpenProjectSettings={() => (isProjectSettingsOpen = true)}
            {onOpenShortcuts}
            onCloseProject={handleCloseAndReturn}
        />
    {/if}

    <WorkspaceMain
        {isSidebarOpen}
        {showInspector}
        {zenMode}
        {viewMode}
        {activeDoc}
        {inspectedFolder}
        {documents}
        {folders}
        targetWordCount={project.targetWordCount}
        folderPath={project.folderPath}
        {editorFont}
        {typography}
        {wordWrap}
        bind:sidebarRef
        onSelectDoc={handleSelectDoc}
        onSelectFolder={(id) => { inspectedFolderId = id; showInspector = true; }}
        onOpenNewDocModal={handleOpenNewDocModal}
        onOpenNewFolderModal={handleOpenNewFolderModal}
        onDeleteDoc={handleDeleteDoc}
        onDeleteFolder={handleDeleteFolder}
        onRenameDoc={handleRenameDoc}
        onRenameFolder={handleRenameFolder}
        onDuplicateDoc={handleDuplicateDoc}
        onOpenInspector={(id) => { activeDocId = id; inspectedFolderId = null; showInspector = true; }}
        onInspectFolder={(id) => { inspectedFolderId = id; showInspector = true; }}
        onContentChange={handleContentChange}
        onSave={handleSave}
        onToggleWordWrap={toggleWordWrap}
        onToggleZenMode={(m) => (zenMode === m ? exitZenMode() : setZenMode(m))}
        onExitZen={exitZenMode}
        onNavigateToDocTitle={handleNavigateToDocTitle}
        onUpdateDocMeta={handleUpdateDocMeta}
        onUpdateFolderMeta={handleUpdateFolderMeta}
        onCloseInspector={() => { showInspector = false; inspectedFolderId = null; }}
        {onShowToast}
    />

    <WorkspaceModals
        {isCommandPaletteOpen}
        {isNewDocModalOpen}
        {isProjectSettingsOpen}
        {project}
        {documents}
        {folders}
        {newDocInitialType}
        {newDocInitialMode}
        {newDocParentFolderId}
        onCloseCommandPalette={() => (isCommandPaletteOpen = false)}
        onCloseNewDocModal={() => (isNewDocModalOpen = false)}
        onCloseProjectSettings={() => (isProjectSettingsOpen = false)}
        onOpenProjectSettings={() => (isProjectSettingsOpen = true)}
        onSelectDoc={handleSelectDoc}
        onOpenNewDocModal={handleOpenNewDocModal}
        onSave={handleSave}
        onSetViewMode={(mode) => (viewMode = mode)}
        onChangeFolder={handleChangeFolder}
        {onOpenSettings}
        {onOpenShortcuts}
        onCreateDoc={handleCreateDoc}
        onCreateFolder={handleCreateFolder}
        onSaveProjectSettings={handleUpdateProjectSettings}
    />
</div>

<style>
    @import "./workspace.css";
</style>
