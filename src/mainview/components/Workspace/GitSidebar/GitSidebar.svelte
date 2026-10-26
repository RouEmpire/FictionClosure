<script lang="ts">
    import { onMount } from "svelte";
    import type { SaveState } from "@shared/types";
    import type { GitCommitRecord, GitStatusResult } from "@shared/domain/git";
    import {
        checkIsGitRepo,
        fetchGitLog,
        fetchGitStatus,
        initializeGitRepo,
        revertCommit,
    } from "@services/git";
    import CommitComposer from "./CommitComposer.svelte";
    import CommitHistoryList from "./CommitHistoryList.svelte";
    import RevertConfirmModal from "./RevertConfirmModal.svelte";

    interface Props {
        folderPath?: string;
        activeDiffCommitHash?: string | null;
        saveState?: SaveState;
        onSaveBeforeCommit: () => Promise<void>;
        onReloadProject: () => Promise<void>;
        onSelectDiff?: (commit: GitCommitRecord) => void;
        onClose: () => void;
        onShowToast: (msg: string) => void;
    }

    let {
        folderPath,
        activeDiffCommitHash = null,
        saveState = "saved",
        onSaveBeforeCommit,
        onReloadProject,
        onSelectDiff,
        onClose,
        onShowToast,
    }: Props = $props();

    let isRepo = $state(false);
    let status = $state<GitStatusResult>({
        isRepo: false,
        branch: "main",
        clean: true,
        modifiedCount: 0,
        untrackedCount: 0,
        files: [],
    });
    let commits = $state<GitCommitRecord[]>([]);
    let isLoading = $state(false);
    let isInitializing = $state(false);
    let revertCandidate = $state<GitCommitRecord | null>(null);
    let prevSaveState = $state<SaveState>("saved");

    async function refreshGitData() {
        if (!folderPath) {
            isRepo = false;
            commits = [];
            return;
        }

        isLoading = true;
        try {
            const hasRepo = await checkIsGitRepo(folderPath);
            isRepo = hasRepo;

            if (hasRepo) {
                const [statusRes, logRes] = await Promise.all([
                    fetchGitStatus(folderPath),
                    fetchGitLog(folderPath, 50),
                ]);
                status = statusRes;
                commits = logRes;
            } else {
                commits = [];
            }
        } finally {
            isLoading = false;
        }
    }

    async function handleInitRepo() {
        if (!folderPath || isInitializing) return;
        isInitializing = true;
        try {
            const res = await initializeGitRepo(folderPath);
            if (res.success) {
                onShowToast("Git repository initialized with default .gitignore");
                await refreshGitData();
            } else {
                onShowToast(`Failed to initialize Git: ${res.error || "Unknown error"}`);
            }
        } finally {
            isInitializing = false;
        }
    }

    async function handleConfirmRevert() {
        if (!folderPath || !revertCandidate) return;
        const candidate = revertCandidate;

        try {
            // Note: do not save uncommitted changes because the user explicitly confirmed
            // in the danger modal that uncommitted changes will be discarded.
            const res = await revertCommit(folderPath, candidate.hash);
            if (res.success) {
                revertCandidate = null;
                onShowToast(`Reverted commit ${candidate.shortHash} (uncommitted changes discarded)`);
                // Reload project documents so workspace reflects the revert
                await onReloadProject();
                await refreshGitData();
            } else {
                onShowToast(`Revert failed: ${res.error || "Unknown error"}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            onShowToast(`Revert error: ${msg}`);
        }
    }

    $effect(() => {
        if (prevSaveState === "saving" && saveState === "saved" && folderPath && isRepo) {
            void refreshGitData();
        }
        prevSaveState = saveState;
    });

    $effect(() => {
        if (folderPath) {
            void refreshGitData();
        }
    });

    onMount(() => {
        void refreshGitData();
    });
</script>

<aside class="git-sidebar-panel" aria-label="Git Commits and History">
    <div class="sidebar-top-bar">
        <div class="sidebar-title-group">
            <i class="fa-solid fa-code-commit title-icon"></i>
            <span class="sidebar-title">Git Integration</span>
            {#if isRepo && status.branch}
                <span class="branch-pill">
                    <i class="fa-solid fa-code-branch branch-icon"></i>
                    {status.branch}
                </span>
            {/if}
        </div>

        <div class="sidebar-actions">
            {#if isRepo}
                <button
                    type="button"
                    class="action-icon-btn"
                    onclick={refreshGitData}
                    disabled={isLoading}
                    title="Refresh Git status and history"
                    aria-label="Refresh Git status"
                >
                    <i class="fa-solid fa-rotate" class:fa-spin={isLoading}></i>
                </button>
            {/if}
            <button
                type="button"
                class="action-icon-btn"
                onclick={onClose}
                title="Close Git sidebar"
                aria-label="Close Git sidebar"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    </div>

    {#if !folderPath}
        <div class="uninitialized-notice">
            <i class="fa-solid fa-folder-open notice-icon"></i>
            <span class="notice-title">No Project Folder</span>
            <span class="notice-desc"
                >Save your project to a local folder to enable Git version control.</span
            >
        </div>
    {:else if !isRepo}
        <div class="uninitialized-notice">
            <i class="fa-solid fa-code-branch notice-icon"></i>
            <span class="notice-title">Initialize Git Repository</span>
            <span class="notice-desc">
                Enable version tracking, novel writing Gitmoji commits, and safe
                revert history for your manuscript.
            </span>
            <button
                type="button"
                class="btn-init-git"
                onclick={handleInitRepo}
                disabled={isInitializing}
            >
                {#if isInitializing}
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Initializing...</span>
                {:else}
                    <i class="fa-solid fa-plus"></i>
                    <span>Initialize Git</span>
                {/if}
            </button>
        </div>
    {:else}
        <div class="git-sidebar-body">
            <CommitComposer
                {folderPath}
                {status}
                isEditorDirty={saveState === "unsaved"}
                {onSaveBeforeCommit}
                onCommitSuccess={refreshGitData}
                {onShowToast}
            />

            <CommitHistoryList
                {commits}
                {isLoading}
                {activeDiffCommitHash}
                onSelectRevert={(c) => (revertCandidate = c)}
                {onSelectDiff}
            />
        </div>
    {/if}

    {#if revertCandidate}
        <RevertConfirmModal
            commit={revertCandidate}
            onConfirmRevert={handleConfirmRevert}
            onClose={() => (revertCandidate = null)}
        />
    {/if}
</aside>

<style>
    .git-sidebar-panel {
        width: 330px;
        flex-shrink: 0;
        background: var(--surface-panel);
        border-left: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }

    .sidebar-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border-subtle);
        background: var(--surface-header);
    }

    .sidebar-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .title-icon {
        font-size: 14px;
        color: var(--accent-primary);
    }

    .sidebar-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .branch-pill {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 500;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.12);
        padding: 2px 7px;
        border-radius: var(--radius-full);
    }

    .branch-icon {
        font-size: 10px;
    }

    .sidebar-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .action-icon-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 5px 7px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition:
            color 0.15s ease,
            background 0.15s ease;
    }

    .action-icon-btn:hover:not(:disabled) {
        color: var(--text-primary);
        background: var(--surface-hover);
    }

    .action-icon-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .uninitialized-notice {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 48px 24px;
        gap: 10px;
    }

    .notice-icon {
        font-size: 32px;
        color: var(--accent-primary);
        opacity: 0.8;
        margin-bottom: 4px;
    }

    .notice-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .notice-desc {
        font-size: 12px;
        color: var(--text-muted);
        line-height: 1.5;
    }

    .btn-init-git {
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: var(--accent-primary);
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
    }

    .btn-init-git:hover:not(:disabled) {
        opacity: 0.9;
    }

    .git-sidebar-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
</style>
