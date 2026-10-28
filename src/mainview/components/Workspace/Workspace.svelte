<script lang="ts">
    import { onMount, onDestroy } from "svelte";
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
    import { AutoSaveController } from "@services/autoSaveController";
    import { DEFAULT_AUTO_SAVE_SETTINGS } from "@shared/domain/autoSave";
    import Header from "./Header/Header.svelte";
    import Sidebar from "./Sidebar/Sidebar.svelte";
    import WorkspaceMain from "./WorkspaceMain.svelte";
    import WorkspaceModals from "./WorkspaceModals.svelte";
    import { handleWorkspaceGlobalKeyDown } from "./workspaceShortcuts";
    import {
        applyProjectSettingsUpdate,
        cascadeDeleteFolder,
        duplicateDocument,
        renameFolderInList,
        updateFolderMetaInList,
        deleteDocFromList,
        renameDocInList,
    } from "./workspaceDocActions";
    import {
        executeSave,
        findDocOrFolderByTitle,
        createNewDocument,
        executeReloadProject,
        executeDiffSelection,
    } from "./workspaceOperations";
    import type { GitCommitRecord } from "@shared/domain/git";
    import type { WorkspaceProps } from "./workspaceTypes";

    let {
        project = $bindable(),
        documents = $bindable([]),
        editorFont = "",
        typography,
        vimSettings,
        autoSaveSettings,
        keybindings,
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
    let activeRightSidebar = $state<"none" | "inspector" | "git">("inspector");
    let activeDiffCommit = $state<GitCommitRecord | null>(null);
    let diffChangedDocIds = $state<Set<string> | null>(null);
    const showInspector = $derived(activeRightSidebar === "inspector");
    const showGitSidebar = $derived(activeRightSidebar === "git");
    let zenMode = $state<ZenModeType>("none");
    let isCommandPaletteOpen = $state(false);
    let isNewDocModalOpen = $state(false);
    let isProjectSettingsOpen = $state(false);
    let wordWrap = $state<boolean>(true);
    let sidebarRef = $state<ReturnType<typeof Sidebar> | null>(null);
    let newDocInitialType = $state<DocumentType>("manuscript");
    let newDocInitialMode = $state<"document" | "folder">("document");
    let newDocParentFolderId = $state<string | null>(null);
    let preZenState = { sidebar: true, rightSidebar: "inspector" as "none" | "inspector" | "git" };

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
        if (activeDiffCommit !== null) { onShowToast("Word wrap is disabled in diff mode"); return; }
        wordWrap = !wordWrap;
        onShowToast(wordWrap ? "Word wrap enabled" : "Word wrap disabled");
    }
    function toggleInspector() {
        activeRightSidebar = activeRightSidebar === "inspector" ? "none" : "inspector";
        if (activeRightSidebar === "none") inspectedFolderId = null;
    }
    function toggleGitSidebar() {
        activeRightSidebar = activeRightSidebar === "git" ? "none" : "git";
    }

    function setZenMode(target: ZenModeType) {
        if (zenMode === target) { exitZenMode(); return; }
        if (zenMode === "none") preZenState = { sidebar: isSidebarOpen, rightSidebar: activeRightSidebar };
        zenMode = target;
        isSidebarOpen = false;
        activeRightSidebar = "none";
        const msg = target === "zen" ? "Zen mode enabled (Esc or Ctrl+\\)" : target === "focus" ? "Focus Zen mode (Esc or Ctrl+Shift+\\)" : "Concentrate Zen mode (Esc)";
        onShowToast(msg);
    }

    function exitZenMode() {
        if (zenMode !== "none") {
            isSidebarOpen = preZenState.sidebar;
            activeRightSidebar = preZenState.rightSidebar;
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

    const autoSaveController = new AutoSaveController({
        getSettings: () => autoSaveSettings ?? DEFAULT_AUTO_SAVE_SETTINGS,
        hasUnsavedChanges: () => saveState === "unsaved",
        canSave: () => Boolean(project.folderPath) && saveState !== "saving",
        onTriggerSave: () => void handleSave({ silent: true }),
    });

    $effect(() => {
        void autoSaveSettings;
        autoSaveController.updateSettings();
    });

    onDestroy(() => {
        autoSaveController.destroy();
    });

    function handleContentChange(newContent: string) {
        if (!activeDoc) return;
        const oldContent = activeDoc.content;
        activeDoc.content = newContent;
        activeDoc.updatedAt = new Date().toISOString();
        saveState = "unsaved";
        scheduleCrashCache();
        autoSaveController.recordChange(oldContent, newContent);
    }

    async function handleSave(options?: { silent?: boolean }) {
        if (saveState === "saving") return;
        saveState = "saving";
        const res = await executeSave(project, documents, folders, onShowToast, onProjectSaved, options);
        saveState = res.state;
        if (res.state === "saved") {
            autoSaveController.notifySaved();
            if (crashCacheTimer) clearTimeout(crashCacheTimer);
        }
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
            activeRightSidebar = "inspector";
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
        newDocInitialType = type; newDocInitialMode = "document"; newDocParentFolderId = parentFolderId || null; isNewDocModalOpen = true;
    }
    function handleOpenNewFolderModal(parentFolderId?: string) {
        newDocInitialMode = "folder"; newDocParentFolderId = parentFolderId || null; isNewDocModalOpen = true;
    }

    function handleCreateDoc(newDoc: FictionDocument) {
        documents.push(newDoc); activeDocId = newDoc.id; inspectedFolderId = null; void handleSave();
    }
    function handleCreateFolder(newFolder: ProjectFolder) {
        folders.push(newFolder); project.folders = folders; inspectedFolderId = newFolder.id;
        activeRightSidebar = "inspector"; saveState = "unsaved"; onShowToast(`Created folder "${newFolder.name}"`); void handleSave();
    }
    function handleDeleteFolder(folderId: string) {
        const { remainingFolders, deletedFolder } = cascadeDeleteFolder(folders, documents, folderId);
        if (!deletedFolder) return;
        folders = remainingFolders; project.folders = folders;
        if (inspectedFolderId === folderId) inspectedFolderId = null;
        saveState = "unsaved"; onShowToast(`Deleted folder "${deletedFolder.name}"`); void handleSave();
    }
    function handleRenameFolder(folderId: string, newName: string) {
        const f = renameFolderInList(folders, folderId, newName);
        if (!f) return;
        project.folders = folders; saveState = "unsaved"; onShowToast(`Renamed folder to "${f.name}"`); void handleSave();
    }
    function handleUpdateFolderMeta(folderId: string, updates: Partial<ProjectFolder>) {
        if (updateFolderMetaInList(folders, folderId, updates)) {
            project.folders = folders; saveState = "unsaved"; scheduleCrashCache();
        }
    }
    function handleDeleteDoc(id: string) {
        const res = deleteDocFromList(documents, activeDocId, id);
        if (res.deleted) { activeDocId = res.newActiveDocId; void handleSave(); }
    }
    function handleUpdateDocMeta(updates: Partial<FictionDocument>) {
        if (!activeDoc) return;
        Object.assign(activeDoc, updates); activeDoc.updatedAt = new Date().toISOString();
        saveState = "unsaved"; scheduleCrashCache();
    }
    function handleRenameDoc(id: string, newTitle: string) {
        const doc = renameDocInList(documents, id, newTitle);
        if (!doc) return;
        saveState = "unsaved"; onShowToast(`Renamed to "${doc.title}"`); void handleSave();
    }
    function handleDuplicateDoc(id: string) {
        const newDoc = duplicateDocument(documents, id);
        if (!newDoc) return;
        activeDocId = newDoc.id; inspectedFolderId = null; saveState = "unsaved";
        onShowToast(`Duplicated "${newDoc.title.replace(" (Copy)", "")}"`); void handleSave();
    }

    async function handleCloseAndReturn() {
        if (saveState === "unsaved" && project.folderPath) await handleSave();
        onCloseProject();
    }

    function handleUpdateProjectSettings(updated: Parameters<typeof applyProjectSettingsUpdate>[1]) {
        project = applyProjectSettingsUpdate(project, updated);
        globalHistoryManager.setTargetWordCount(project.targetWordCount);
        saveState = "unsaved";
        onShowToast(`Updated project settings for "${project.name}"`);
        void handleSave();
    }

    async function handleReloadProject() {
        if (!project.folderPath) return;
        const res = await executeReloadProject(project.folderPath, activeDocId, onShowToast);
        if (res.success && res.project && res.documents) {
            project = res.project; documents = res.documents;
            if (res.folders) folders = res.folders;
            if (res.nextActiveDocId) activeDocId = res.nextActiveDocId;
            saveState = "saved";
            if (crashCacheTimer) clearTimeout(crashCacheTimer);
        }
    }

    async function handleSelectDiff(commit: GitCommitRecord) {
        const res = await executeDiffSelection(project.folderPath, commit, activeDiffCommit, documents, activeDocId, onShowToast);
        activeDiffCommit = res.diffCommit;
        diffChangedDocIds = res.changedDocIds;
        if (res.nextActiveDocId) activeDocId = res.nextActiveDocId;
    }

    function handleExitDiff() {
        if (activeDiffCommit !== null) {
            activeDiffCommit = null;
            diffChangedDocIds = null;
            onShowToast("Exited Diff mode");
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && isProjectSettingsOpen) {
            isProjectSettingsOpen = false;
            e.preventDefault();
            return;
        }

        handleWorkspaceGlobalKeyDown(e, {
            isCommandPaletteOpen, isNewDocModalOpen, zenMode, showInspector, isSidebarOpen,
            isDiffActive: activeDiffCommit !== null, onExitDiff: handleExitDiff,
            keybindings,
            onCloseCommandPalette: () => (isCommandPaletteOpen = false),
            onCloseNewDocModal: () => (isNewDocModalOpen = false),
            onExitZenMode: exitZenMode,
            onCloseInspector: () => { activeRightSidebar = "none"; inspectedFolderId = null; },
            onOpenShortcuts,
            onFocusSidebar: () => {
                if (!isSidebarOpen) isSidebarOpen = true;
                setTimeout(() => sidebarRef?.focusSidebar(), 30);
            },
            onSetViewMode: (mode) => (viewMode = mode),
            onToggleWordWrap: toggleWordWrap,
            onOpenSettings,
            onToggleSidebar: () => (isSidebarOpen = !isSidebarOpen),
            onToggleInspector: toggleInspector,
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
            projectName={project.name} folderPath={project.folderPath} lastSaved={project.lastSaved}
            {activeDoc} {saveState} {viewMode} {isSidebarOpen} {zenMode} {showInspector} {showGitSidebar}
            onToggleSidebar={() => (isSidebarOpen = !isSidebarOpen)} onSelectZenMode={setZenMode}
            onToggleInspector={toggleInspector} onToggleGit={toggleGitSidebar}
            onSetViewMode={(mode) => (viewMode = mode)} onSave={handleSave} onChangeFolder={handleChangeFolder}
            onOpenCommandPalette={() => (isCommandPaletteOpen = true)} onOpenProjectSettings={() => (isProjectSettingsOpen = true)}
            {onOpenShortcuts} onCloseProject={handleCloseAndReturn}
        />
    {/if}

    <WorkspaceMain
        {isSidebarOpen} {activeRightSidebar} {showInspector} {zenMode} {viewMode}
        {activeDoc} {inspectedFolder} {documents} {folders} {editorFont} {typography} {vimSettings} {wordWrap}
        {keybindings}
        targetWordCount={project.targetWordCount} folderPath={project.folderPath} bind:sidebarRef
        diffCommit={activeDiffCommit} {diffChangedDocIds} writerName={project.author || "Author"}
        {saveState}
        onSelectDiff={handleSelectDiff} onExitDiff={handleExitDiff}
        onSelectDoc={handleSelectDoc} onOpenNewDocModal={handleOpenNewDocModal}
        onSelectFolder={(id) => { inspectedFolderId = id; activeRightSidebar = "inspector"; }}
        onOpenNewFolderModal={handleOpenNewFolderModal} onDeleteDoc={handleDeleteDoc} onDeleteFolder={handleDeleteFolder}
        onRenameDoc={handleRenameDoc} onRenameFolder={handleRenameFolder} onDuplicateDoc={handleDuplicateDoc}
        onOpenInspector={(id) => { activeDocId = id; inspectedFolderId = null; activeRightSidebar = "inspector"; }}
        onInspectFolder={(id) => { inspectedFolderId = id; activeRightSidebar = "inspector"; }}
        onContentChange={handleContentChange} onSave={handleSave} onToggleWordWrap={toggleWordWrap}
        onToggleZenMode={(m) => (zenMode === m ? exitZenMode() : setZenMode(m))} onExitZen={exitZenMode}
        onNavigateToDocTitle={handleNavigateToDocTitle} onUpdateDocMeta={handleUpdateDocMeta} onUpdateFolderMeta={handleUpdateFolderMeta}
        onCloseInspector={() => { activeRightSidebar = "none"; inspectedFolderId = null; }}
        onCloseGitSidebar={() => { activeRightSidebar = "none"; }} onReloadProject={handleReloadProject}
        {onShowToast}
    />

    <WorkspaceModals
        {isCommandPaletteOpen} {isNewDocModalOpen} {isProjectSettingsOpen} {project} {documents} {folders}
        {newDocInitialType} {newDocInitialMode} {newDocParentFolderId}
        onCloseCommandPalette={() => (isCommandPaletteOpen = false)} onCloseNewDocModal={() => (isNewDocModalOpen = false)}
        onCloseProjectSettings={() => (isProjectSettingsOpen = false)} onOpenProjectSettings={() => (isProjectSettingsOpen = true)}
        onSelectDoc={handleSelectDoc} onOpenNewDocModal={handleOpenNewDocModal} onSave={handleSave}
        onSetViewMode={(mode) => (viewMode = mode)} onChangeFolder={handleChangeFolder}
        {onOpenSettings} onCreateDoc={handleCreateDoc} onCreateFolder={handleCreateFolder}
        onSaveProjectSettings={handleUpdateProjectSettings} {onShowToast}
    />
</div>
