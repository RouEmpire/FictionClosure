<script lang="ts">
    import { onMount } from "svelte";
    import type {
        FictionDocument,
        ProjectAnalysisResult,
        ProjectInfo,
        RecentProject,
    } from "../shared/types";
    import { initialProject, sampleDocuments } from "./sampleData";
    import {
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
    import Home from "./components/Home.svelte";
    import Workspace from "./components/Workspace.svelte";
    import SettingsModal from "./components/SettingsModal.svelte";
    import ShortcutsModal from "./components/ShortcutsModal.svelte";
    import AboutModal from "./components/AboutModal.svelte";
    import ProjectAnalysisModal from "./components/ProjectAnalysisModal.svelte";
    import { analyzeProject } from "./utils/projectAnalysis";

    // Screen navigation: starts on "home" welcome screen
    let currentScreen = $state<"home" | "workspace">("home");

    // Active project & documents in workspace
    let project = $state<ProjectInfo>(initialProject);
    let documents = $state<FictionDocument[]>(sampleDocuments);

    // Recent projects list persisted in localStorage
    let recentProjects = $state<RecentProject[]>([]);

    // Editor custom font preference persisted in localStorage
    let editorFont = $state<string>("");

    // Modals
    let isSettingsOpen = $state(false);
    let isShortcutsModalOpen = $state(false);
    let isAboutModalOpen = $state(false);
    let isAnalysisModalOpen = $state(false);
    let analysisResult = $state<ProjectAnalysisResult | null>(null);

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
        recentProjects = getRecentProjects();

        if (typeof localStorage !== "undefined") {
            const savedFont = localStorage.getItem(
                "fictionclosure_editor_font",
            );
            if (savedFont) {
                editorFont = savedFont;
            }
        }
    });

    function handleFontChange(newFont: string) {
        editorFont = newFont;
        if (typeof localStorage !== "undefined") {
            localStorage.setItem("fictionclosure_editor_font", newFont);
        }
        showToast(
            newFont
                ? `Editor font: ${newFont}`
                : "Editor font reset to default monospace",
        );
    }

    async function handleOpenProject(folderPath: string) {
        try {
            const res = await loadProject(folderPath);
            if (res.success && res.project) {
                project = res.project;
                documents = res.documents || [];
                if (res.stacks) {
                    globalHistoryManager.restoreAll(
                        res.stacks,
                        project.targetWordCount || 50000,
                    );
                }
                const rec = buildRecentProjectRecord(
                    project,
                    documents,
                    folderPath,
                );
                recentProjects = saveRecentProject(rec);
                showToast(`Opened project "${project.name}"`);
                currentScreen = "workspace";
                setRememberedFolder(folderPath).catch((err) => {
                    console.warn("Could not remember folder:", err);
                    showToast("Could not remember folder:", err);
                });
            } else {
                // Check for demo/sample initial project match
                if (
                    folderPath === initialProject.folderPath ||
                    folderPath === "~/FictionProjects/TheWhisperingTide" ||
                    folderPath.includes("TheWhisperingTide")
                ) {
                    project = initialProject;
                    documents = sampleDocuments;
                    const rec = buildRecentProjectRecord(
                        project,
                        documents,
                        folderPath,
                    );
                    recentProjects = saveRecentProject(rec);
                    currentScreen = "workspace";
                    showToast(`Opened demo project "${project.name}"`);
                } else {
                    showToast(
                        `Could not open project: ${res.error || "Folder path not found on disk"}`,
                    );
                }
            }
        } catch (err) {
            console.error("Open project error:", err);
            showToast(
                `Failed to open project: ${err instanceof Error ? err.message : String(err)}`,
            );
        }
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
                    id: `proj-${Date.now()}`,
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
                                  wordCount: 0,
                                  targetWordCount: 3000,
                                  status: "draft",
                                  content: `# ${projectToAnalyze.name}\n\nChapter 1 content goes here...\n`,
                                  characters: [],
                                  locations: [],
                                  tags: ["draft"],
                                  created: new Date().toISOString(),
                                  lastModified: new Date().toISOString(),
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

    async function handleNewProject() {
        try {
            const selectRes = await promptSelectFolder();
            if (selectRes.canceled || !selectRes.folderPath) return;

            const folderPath = selectRes.folderPath;
            const folderName =
                folderPath.split("/").filter(Boolean).pop() || "New Novel";
            const newProj: ProjectInfo = {
                id: `proj-${Date.now()}`,
                name: folderName.replace(/[-_]/g, " "),
                folderPath,
                targetWordCount: 50000,
                lastSaved: new Date().toISOString(),
                created: new Date().toISOString(),
                author: "Author",
                genre: "Fiction",
            };
            const newDocs: FictionDocument[] = [
                {
                    id: "doc-ch1",
                    title: "Chapter 1",
                    type: "manuscript",
                    order: 1,
                    wordCount: 0,
                    targetWordCount: 3000,
                    status: "draft",
                    content: `# ${newProj.name}\n\nBegin your story here...\n`,
                    characters: [],
                    locations: [],
                    tags: ["beginning"],
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                },
                {
                    id: "char-protagonist",
                    title: "Protagonist",
                    type: "character",
                    order: 1,
                    wordCount: 0,
                    status: "draft",
                    content:
                        "# Protagonist\n\n**Role:** Main Character\n\n## Description\n\n",
                    characters: [],
                    locations: [],
                    tags: ["lead"],
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                },
            ];

            project = newProj;
            documents = newDocs;
            const rec = buildRecentProjectRecord(newProj, newDocs, folderPath);
            recentProjects = saveRecentProject(rec);
            try {
                await setRememberedFolder(folderPath);
                await saveProject(folderPath, newProj, newDocs);
            } catch (err) {
                console.error("Handle new project error:", err);
                showToast(
                    `Failed to handle new project: ${err instanceof Error ? err.message : String(err)}`,
                );
            }

            currentScreen = "workspace";
            showToast(`Created new project "${newProj.name}"`);
        } catch (err) {
            console.error("New project error:", err);
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
            if (isSettingsOpen) {
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
            onNewProject={handleNewProject}
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
                onCloseProject={handleCloseProject}
                onOpenSettings={() => (isSettingsOpen = true)}
                onOpenShortcuts={() => (isShortcutsModalOpen = true)}
                onProjectSaved={handleProjectSaved}
                onShowToast={showToast}
            />
        </svelte:boundary>
    {/if}

    <!-- Settings Preferences Modal (Ctrl+P) -->
    <SettingsModal
        isOpen={isSettingsOpen}
        currentFont={editorFont}
        onClose={() => (isSettingsOpen = false)}
        onFontChange={handleFontChange}
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

    <!-- Toast notification -->
    {#if toastMessage}
        <div class="toast-notification" role="status" aria-live="polite">
            <span class="toast-icon">💾</span>
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
