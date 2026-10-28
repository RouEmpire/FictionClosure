<script lang="ts">
    import { onMount } from "svelte";
    import type {
        CrashRecoveryData,
        FictionDocument,
        ProjectAnalysisResult,
        ProjectInfo,
        RecentProject,
    } from "../shared/types";
    import { initialProject, sampleDocuments } from "../shared/fixtures/sampleData";
    import {
        clearCrashCache,
        loadProject,
        promptSelectFolder,
        saveProject,
        setRememberedFolder,
    } from "./services/storage";
    import {
        buildRecentProjectRecord,
        getRecentProjects,
        removeRecentProject,
        saveRecentProject,
    } from "./services/recentProjects";
    import { globalHistoryManager } from "./services/historyManager";
    import Home from "@components/Home/Home.svelte";
    import CreateProjectModal, {
        type CreateProjectData,
    } from "@components/Home/CreateProjectModal.svelte";
    import Workspace from "./components/Workspace/Workspace.svelte";
    import SettingsModal from "@components/SettingsModal/SettingsModal.svelte";
    import ShortcutsModal from "@components/ShortcutsModal/ShortcutsModal.svelte";
    import AboutModal from "./components/AboutModal.svelte";
    import ProjectAnalysisModal from "./components/ProjectAnalysisModal.svelte";
    import ProjectLoadingScreen from "@components/ProjectLoadingScreen/ProjectLoadingScreen.svelte";
    import CrashRecoveryModal from "./components/CrashRecoveryModal.svelte";
    import { analyzeProject } from "../shared/domain/projectAnalysis";
    import { calculateWordCount } from "../shared/domain/markdown";
    import { formatLoadDuration } from "../shared/domain/timeFormatting";
    import {
        loadTypographySettings,
        saveTypographySettings,
        DEFAULT_TYPOGRAPHY_SETTINGS,
        type EditorTypographySettings,
    } from "../shared/domain/typography";
    import {
        loadVimSettings,
        saveVimSettings,
        DEFAULT_VIM_SETTINGS,
        type VimSettings,
    } from "../shared/domain/vim";
    import { ensureBundledFontsRegisteredInCss } from "../shared/domain/bundledFonts";

    // Screen navigation: starts on "home" welcome screen
    let currentScreen = $state<"home" | "workspace">("home");

    // Project Loading Screen state
    let isLoadingProject = $state(false);
    let loadingProjectName = $state("");
    let loadingFolderPath = $state("");
    let isProjectLoaded = $state(false);
    let loadingError = $state<string | null>(null);
    let loadingStats = $state<{ docCount: number; wordCount: number } | null>(null);
    let pendingWorkspaceActivation = $state<(() => void) | null>(null);

    // Active project & documents in workspace
    let project = $state<ProjectInfo>(initialProject);
    let documents = $state<FictionDocument[]>(sampleDocuments);

    // Recent projects list persisted in localStorage
    let recentProjects = $state<RecentProject[]>([]);

    // Editor typography settings persisted in localStorage
    let typographySettings = $state<EditorTypographySettings>(DEFAULT_TYPOGRAPHY_SETTINGS);
    let editorFont = $state<string>("");
    let vimSettings = $state<VimSettings>(DEFAULT_VIM_SETTINGS);

    // Modals
    let isCreateProjectModalOpen = $state(false);
    let isSettingsOpen = $state(false);
    let isShortcutsModalOpen = $state(false);
    let isAboutModalOpen = $state(false);
    let isAnalysisModalOpen = $state(false);
    let analysisResult = $state<ProjectAnalysisResult | null>(null);

    // Crash Recovery Modal state
    let isCrashRecoveryOpen = $state(false);
    let pendingRecoveryData = $state<CrashRecoveryData | null>(null);
    let pendingDiskDocs = $state<FictionDocument[]>([]);

    // Pending imported project awaiting user confirmation in analysis modal
    let pendingImportData = $state<{
        folderPath: string;
        project: ProjectInfo;
        documents: FictionDocument[];
        stacks?: ReturnType<typeof globalHistoryManager.exportAllStacks>;
    } | null>(null);

    // Toast notification
    let toastMessage = $state<string | null>(null);
    let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

    function showToast(msg: string) {
        toastMessage = msg;
        if (toastTimeoutId) clearTimeout(toastTimeoutId);
        toastTimeoutId = setTimeout(() => {
            toastMessage = null;
        }, 3500);
    }

    onMount(() => {
        ensureBundledFontsRegisteredInCss();
        recentProjects = getRecentProjects();
        typographySettings = loadTypographySettings();
        editorFont = typographySettings.fontFamily;
        vimSettings = loadVimSettings();
    });

    function handleUpdateVimSettings(newSettings: VimSettings) {
        vimSettings = newSettings;
        saveVimSettings(newSettings);
        showToast(newSettings.enabled ? "Vim mode enabled" : "Vim mode disabled");
    }

    function handleUpdateTypography(newSettings: EditorTypographySettings) {
        typographySettings = newSettings;
        editorFont = newSettings.fontFamily;
        saveTypographySettings(newSettings);
    }

    function handleFontChange(newFont: string) {
        editorFont = newFont;
        typographySettings = {
            ...typographySettings,
            fontFamily: newFont,
        };
        saveTypographySettings(typographySettings);
        showToast(
            newFont
                ? `Editor font: ${newFont}`
                : "Editor font reset to default monospace",
        );
    }

    async function handleOpenProject(folderPath: string, projectName?: string) {
        const startTime = performance.now();
        const resolvedName =
            projectName ||
            recentProjects.find((p) => p.folderPath === folderPath)?.name ||
            folderPath.split("/").filter(Boolean).pop() ||
            "Fiction Project";

        loadingProjectName = resolvedName;
        loadingFolderPath = folderPath;
        isLoadingProject = true;
        isProjectLoaded = false;
        loadingError = null;
        loadingStats = null;

        try {
            const res = await loadProject(folderPath);
            if (res.success && res.project) {
                const loadedProject = res.project;
                const loadedDocs = res.documents || [];
                if (res.stacks) {
                    globalHistoryManager.restoreAll(
                        res.stacks,
                        loadedProject.targetWordCount || 50000,
                    );
                }
                const rec = buildRecentProjectRecord(
                    loadedProject,
                    loadedDocs,
                    folderPath,
                );
                recentProjects = saveRecentProject(rec);

                const totalWords = loadedDocs.reduce(
                    (sum, d) => sum + calculateWordCount(d.content || ""),
                    0,
                );
                loadingStats = {
                    docCount: loadedDocs.length,
                    wordCount: totalWords,
                };

                pendingWorkspaceActivation = () => {
                    project = loadedProject;
                    documents = loadedDocs;
                    currentScreen = "workspace";
                    isLoadingProject = false;
                    const elapsedMs = Math.round(performance.now() - startTime);
                    const durationStr = formatLoadDuration(elapsedMs);
                    showToast(`Opened project "${project.name}" in ${durationStr}`);
                    setRememberedFolder(folderPath).catch((err) => {
                        console.warn("Could not remember folder:", err);
                    });

                    // Check if there was unsaved crash recovery cache
                    if (res.recoveryData?.hasUnsavedChanges) {
                        pendingRecoveryData = res.recoveryData;
                        pendingDiskDocs = [...loadedDocs];
                        isCrashRecoveryOpen = true;
                    }
                };
                isProjectLoaded = true;
            } else {
                // Check for demo/sample initial project match
                if (
                    folderPath === initialProject.folderPath ||
                    folderPath === "~/FictionProjects/TheWhisperingTide" ||
                    folderPath.includes("TheWhisperingTide")
                ) {
                    const rec = buildRecentProjectRecord(
                        initialProject,
                        sampleDocuments,
                        folderPath,
                    );
                    recentProjects = saveRecentProject(rec);
                    const totalWords = sampleDocuments.reduce(
                        (sum, d) => sum + calculateWordCount(d.content || ""),
                        0,
                    );
                    loadingStats = {
                        docCount: sampleDocuments.length,
                        wordCount: totalWords,
                    };

                    pendingWorkspaceActivation = () => {
                        project = initialProject;
                        documents = sampleDocuments;
                        currentScreen = "workspace";
                        isLoadingProject = false;
                        const elapsedMs = Math.round(performance.now() - startTime);
                        const durationStr = formatLoadDuration(elapsedMs);
                        showToast(`Opened demo project "${project.name}" in ${durationStr}`);
                    };
                    isProjectLoaded = true;
                } else {
                    loadingError = res.error || "Folder path not found on disk";
                    showToast(
                        `Could not open project: ${res.error || "Folder path not found on disk"}`,
                    );
                }
            }
        } catch (err) {
            console.error("Open project error:", err);
            loadingError = err instanceof Error ? err.message : String(err);
            showToast(
                `Failed to open project: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    function handleLoadingDone() {
        if (pendingWorkspaceActivation) {
            pendingWorkspaceActivation();
            pendingWorkspaceActivation = null;
        } else {
            isLoadingProject = false;
        }
    }

    function handleCancelLoading() {
        isLoadingProject = false;
        isProjectLoaded = false;
        pendingWorkspaceActivation = null;
        loadingError = null;
        showToast("Project opening cancelled");
    }

    function handleRestoreCrashRecovery() {
        if (!pendingRecoveryData) return;
        const recoveryMap = new Map(pendingRecoveryData.documents.map((d) => [d.id, d]));
        const updated = documents.map((doc) => {
            const cached = recoveryMap.get(doc.id);
            if (cached) {
                return {
                    ...doc,
                    content: cached.content,
                    updatedAt: cached.lastModified,
                    title: cached.title,
                };
            }
            return doc;
        });

        // Add any cached docs that were created during the crashed session
        for (const cached of pendingRecoveryData.documents) {
            if (!updated.some((d) => d.id === cached.id)) {
                updated.push({
                    id: cached.id,
                    title: cached.title,
                    type: cached.type,
                    status: "draft",
                    tags: [],
                    order: updated.length + 1,
                    createdAt: cached.lastModified,
                    updatedAt: cached.lastModified,
                    content: cached.content,
                });
            }
        }

        documents = updated;
        isCrashRecoveryOpen = false;
        pendingRecoveryData = null;
        pendingDiskDocs = [];
        showToast("Restored unsaved draft from crash cache. Please review and save your work.");
    }

    async function handleDiscardCrashRecovery() {
        if (project.folderPath) {
            await clearCrashCache(project.folderPath);
        }
        isCrashRecoveryOpen = false;
        pendingRecoveryData = null;
        pendingDiskDocs = [];
        showToast("Discarded crash cache. Loaded saved documents from disk.");
    }

    function handleCloseProject() {
        // Update recent project entry with current stats before returning to Home
        if (project && project.folderPath) {
            const rec = buildRecentProjectRecord(
                project,
                documents,
                project.folderPath,
            );
            recentProjects = saveRecentProject(rec);
        }
        currentScreen = "home";
        showToast("Returned to Home");
    }

    function handleDeleteRecentProject(id: string, name: string) {
        recentProjects = removeRecentProject(id);
        showToast(`Removed "${name}" from recent list`);
    }

    async function handleImportProject() {
        try {
            const selectRes = await promptSelectFolder();
            if (selectRes.canceled || !selectRes.folderPath) return;

            const folderPath = selectRes.folderPath;
            const loadRes = await loadProject(folderPath);

            let projectToAnalyze: ProjectInfo;
            let docsToAnalyze: FictionDocument[];

            if (loadRes.success && loadRes.project) {
                projectToAnalyze = loadRes.project;
                docsToAnalyze = loadRes.documents || [];
            } else {
                const folderName =
                    folderPath.split("/").filter(Boolean).pop() ||
                    "Imported Project";
                projectToAnalyze = {
                    name: folderName.replace(/[-_]/g, " "),
                    folderPath,
                    targetWordCount: 50000,
                    lastSaved: new Date().toISOString(),
                    created: new Date().toISOString(),
                    author: "Author",
                    genre: "Fiction",
                };
                docsToAnalyze = [];
            }

            const analysis = analyzeProject(
                folderPath,
                loadRes.success ? loadRes.project : null,
                docsToAnalyze,
                Boolean(loadRes.stacks),
                false,
            );

            analysisResult = analysis;
            pendingImportData = {
                folderPath,
                project: projectToAnalyze,
                documents:
                    docsToAnalyze.length > 0
                        ? docsToAnalyze
                        : [
                              {
                                  id: "doc-ch1",
                                  title: "Chapter 1",
                                  type: "manuscript",
                                  order: 1,
                                  status: "draft",
                                  content: `# ${projectToAnalyze.name}\n\nChapter 1 content goes here...\n`,
                                  tags: ["draft"],
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                              },
                          ],
                stacks: loadRes.stacks,
            };
            isAnalysisModalOpen = true;
        } catch (err) {
            console.error("Import error:", err);
            showToast(
                `Failed to analyze project: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    async function handleConfirmImport() {
        if (!pendingImportData) {
            isAnalysisModalOpen = false;
            return;
        }

        project = pendingImportData.project;
        documents = pendingImportData.documents;
        if (pendingImportData.stacks) {
            globalHistoryManager.restoreAll(
                pendingImportData.stacks,
                project.targetWordCount || 50000,
            );
        }

        const rec = buildRecentProjectRecord(
            project,
            documents,
            pendingImportData.folderPath,
        );
        recentProjects = saveRecentProject(rec);
        try {
            await setRememberedFolder(pendingImportData.folderPath);
            await saveProject(
                pendingImportData.folderPath,
                project,
                documents,
                pendingImportData.stacks,
            );
        } catch (err) {
            console.error("Set remember Folder error:", err);
            showToast(
                `Failed to import project: ${err instanceof Error ? err.message : String(err)}`,
            );
        }

        isAnalysisModalOpen = false;
        pendingImportData = null;
        currentScreen = "workspace";
        showToast(`Imported and opened "${project.name}"`);
    }

    function handleCancelImport() {
        isAnalysisModalOpen = false;
        pendingImportData = null;
    }

    async function handleConfirmCreateProject(data: CreateProjectData) {
        try {
            const newProj: ProjectInfo = {
                name: data.name,
                folderPath: data.folderPath,
                targetWordCount: data.targetWordCount,
                lastSaved: new Date().toISOString(),
                created: new Date().toISOString(),
                author: data.author,
                genre: data.genre,
                coverImage: data.coverImage,
                readme: data.readme,
            };
            const newDocs: FictionDocument[] = [
                {
                    id: "doc-ch1",
                    title: "Chapter 1",
                    type: "manuscript",
                    order: 1,
                    status: "draft",
                    content: `# ${newProj.name}\n\nBegin your story here...\n`,
                    tags: ["beginning"],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    id: "char-protagonist",
                    title: "Protagonist",
                    type: "character",
                    order: 1,
                    status: "draft",
                    content:
                        "# Protagonist\n\n**Role:** Main Character\n\n## Description\n\n",
                    tags: ["lead"],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            project = newProj;
            documents = newDocs;
            globalHistoryManager.restoreAll(null, newProj.targetWordCount);

            const rec = buildRecentProjectRecord(
                newProj,
                newDocs,
                data.folderPath,
            );
            recentProjects = saveRecentProject(rec);

            try {
                await setRememberedFolder(data.folderPath);
                await saveProject(data.folderPath, newProj, newDocs);
            } catch (err) {
                console.error("Save new project error:", err);
                showToast(
                    `Warning: Could not save to disk immediately: ${err instanceof Error ? err.message : String(err)}`,
                );
            }

            currentScreen = "workspace";
            showToast(`Created new project "${newProj.name}"`);
        } catch (err) {
            console.error("Create project error:", err);
            showToast(
                `Failed to create project: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
    }

    function handleProjectSaved(
        savedProject: ProjectInfo,
        savedDocs: FictionDocument[],
    ) {
        project = savedProject;
        documents = savedDocs;
        if (project.folderPath) {
            const rec = buildRecentProjectRecord(
                project,
                documents,
                project.folderPath,
            );
            recentProjects = saveRecentProject(rec);
        }
    }

    function handleGlobalKeyDown(e: KeyboardEvent) {
        const isMod = e.ctrlKey || e.metaKey;

        // Settings shortcut: Ctrl+P
        if (
            isMod &&
            (e.key === "p" || e.key === "P") &&
            !e.shiftKey &&
            !e.altKey
        ) {
            e.preventDefault();
            isSettingsOpen = !isSettingsOpen;
            return;
        }

        // Help shortcut: F1
        if (e.key === "F1" && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            isShortcutsModalOpen = !isShortcutsModalOpen;
            return;
        }

        // Escape closes open modals
        if (e.key === "Escape") {
            if (isCreateProjectModalOpen) {
                isCreateProjectModalOpen = false;
                e.preventDefault();
            } else if (isSettingsOpen) {
                isSettingsOpen = false;
                e.preventDefault();
            } else if (isShortcutsModalOpen) {
                isShortcutsModalOpen = false;
                e.preventDefault();
            } else if (isAboutModalOpen) {
                isAboutModalOpen = false;
                e.preventDefault();
            } else if (isAnalysisModalOpen) {
                isAnalysisModalOpen = false;
                e.preventDefault();
            }
        }
    }
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="fictionclosure-app">
    {#if currentScreen === "home"}
        <Home
            {recentProjects}
            onOpenProject={handleOpenProject}
            onDeleteRecentProject={handleDeleteRecentProject}
            onImportProject={handleImportProject}
            onNewProject={() => (isCreateProjectModalOpen = true)}
            onOpenSettings={() => (isSettingsOpen = true)}
            onOpenShortcuts={() => (isShortcutsModalOpen = true)}
            onOpenAbout={() => (isAboutModalOpen = true)}
            onShowToast={showToast}
        />
    {:else}
        <svelte:boundary
            onerror={(err) => {
                showToast(
                    `Workspace crash: ${err instanceof Error ? err.message : String(err)}`,
                );
                console.error(
                    `Workspace crash: ${err instanceof Error ? err.message : String(err)}`,
                );
            }}
        >
            <Workspace
                bind:project
                bind:documents
                {editorFont}
                typography={typographySettings}
                {vimSettings}
                onCloseProject={handleCloseProject}
                onOpenSettings={() => (isSettingsOpen = true)}
                onOpenShortcuts={() => (isShortcutsModalOpen = true)}
                onProjectSaved={handleProjectSaved}
                onShowToast={showToast}
            />
        </svelte:boundary>
    {/if}

    <!-- Create New Project Modal -->
    <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => (isCreateProjectModalOpen = false)}
        onCreate={handleConfirmCreateProject}
    />

    <!-- Settings Preferences Modal (Ctrl+P) -->
    <SettingsModal
        isOpen={isSettingsOpen}
        currentFont={editorFont}
        typography={typographySettings}
        {vimSettings}
        onClose={() => (isSettingsOpen = false)}
        onFontChange={handleFontChange}
        onUpdateTypography={handleUpdateTypography}
        onUpdateVimSettings={handleUpdateVimSettings}
    />

    <!-- Keyboard Shortcuts Cheatsheet Modal -->
    <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => (isShortcutsModalOpen = false)}
    />

    <!-- About FictionClosure Modal -->
    <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => (isAboutModalOpen = false)}
    />

    <!-- Project Analysis & Import Validation Modal -->
    <ProjectAnalysisModal
        isOpen={isAnalysisModalOpen}
        analysis={analysisResult}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
    />

    <!-- Crash Recovery & Unsaved Work Restore Modal -->
    <CrashRecoveryModal
        isOpen={isCrashRecoveryOpen}
        recoveryData={pendingRecoveryData}
        diskDocuments={pendingDiskDocs}
        onRestore={handleRestoreCrashRecovery}
        onDiscard={handleDiscardCrashRecovery}
    />

    <!-- High-tech Hacker Terminal Loading Screen -->
    {#if isLoadingProject}
        <ProjectLoadingScreen
            projectName={loadingProjectName}
            folderPath={loadingFolderPath}
            isLoaded={isProjectLoaded}
            loadError={loadingError}
            stats={loadingStats}
            onDone={handleLoadingDone}
            onCancel={handleCancelLoading}
        />
    {/if}

    <!-- Toast notification -->
    {#if toastMessage}
        <div class="toast-notification" role="status" aria-live="polite">
            <span class="toast-icon"><i class="fa-solid fa-floppy-disk"></i></span>
            <span class="toast-text">{toastMessage}</span>
        </div>
    {/if}
</div>

<style>
    .fictionclosure-app {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background-color: var(--bg-primary);
        position: relative;
    }

    .toast-notification {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: var(--bg-secondary);
        border: 1px solid var(--accent-primary);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        color: var(--text-primary);
        padding: 10px 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        z-index: 1000;
        animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .toast-icon {
        font-size: 16px;
    }

    .toast-text {
        color: var(--text-primary);
    }
</style>
