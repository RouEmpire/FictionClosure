<script lang="ts">
    import type { GitStatusResult } from "@shared/domain/git";
    import {
        DEFAULT_WRITING_GITMOJI,
        type GitmojiItem,
    } from "@shared/domain/gitmoji";
    import { commitWorkspaceChanges } from "@services/git";
    import GitmojiPicker from "./GitmojiPicker.svelte";

    interface Props {
        folderPath: string;
        status: GitStatusResult;
        onSaveBeforeCommit: () => Promise<void>;
        onCommitSuccess: () => void;
        onShowToast: (msg: string) => void;
    }

    let {
        folderPath,
        status,
        onSaveBeforeCommit,
        onCommitSuccess,
        onShowToast,
    }: Props = $props();

    let selectedGitmoji = $state<GitmojiItem>(DEFAULT_WRITING_GITMOJI);
    let commitMessage = $state("");
    let isPickerOpen = $state(false);
    let isCommitting = $state(false);

    const hasChangesToCommit = $derived(
        !status.clean || status.files.length > 0,
    );
    const canCommit = $derived(
        commitMessage.trim().length > 0 &&
            hasChangesToCommit &&
            !isCommitting &&
            !!folderPath,
    );

    async function handleCommit() {
        if (!canCommit) return;
        isCommitting = true;

        try {
            // First flush workspace changes to disk
            await onSaveBeforeCommit();

            const res = await commitWorkspaceChanges(folderPath, {
                gitmoji: selectedGitmoji.emoji,
                message: commitMessage.trim(),
            });

            if (res.success) {
                const preview = `${selectedGitmoji.emoji} ${commitMessage.trim()}`;
                commitMessage = "";
                onCommitSuccess();
                onShowToast(`Committed: ${preview}`);
            } else {
                onShowToast(`Commit failed: ${res.error || "Unknown error"}`);
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            onShowToast(`Commit error: ${msg}`);
        } finally {
            isCommitting = false;
        }
    }

    function handleTextareaKeyDown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            void handleCommit();
        }
    }
</script>

<div class="commit-composer">
    <div class="composer-header">
        <span class="composer-title">New Manuscript Commit</span>
        <div
            class="status-pill"
            class:dirty={hasChangesToCommit}
            class:clean={!hasChangesToCommit}
        >
            {#if hasChangesToCommit}
                <span class="status-dot-amber"></span>
                <span
                    >{status.modifiedCount} modified, {status.untrackedCount} untracked</span
                >
            {:else}
                <span class="status-dot-green"></span>
                <span>Clean</span>
            {/if}
        </div>
    </div>

    <!-- Gitmoji Selector Button -->
    <button
        type="button"
        class="gitmoji-trigger-btn"
        onclick={() => (isPickerOpen = true)}
        title="Select novel writing Gitmoji"
        aria-label="Change Gitmoji"
    >
        <span class="trigger-emoji">{selectedGitmoji.emoji}</span>
        <div class="trigger-labels">
            <span class="trigger-code">{selectedGitmoji.code}</span>
            <span class="trigger-desc">{selectedGitmoji.writingDescription}</span
            >
        </div>
        <i class="fa-solid fa-chevron-down chevron-icon"></i>
    </button>

    <!-- Commit Message Textarea -->
    <div class="message-input-wrapper">
        <textarea
            class="composer-textarea"
            bind:value={commitMessage}
            onkeydown={handleTextareaKeyDown}
            placeholder="Describe your writing, revisions, scene restructuring, or dialogue fixes..."
            rows="3"
            aria-label="Commit message"
        ></textarea>
        <div class="composer-hint">
            <span>Press Ctrl+Enter to commit</span>
            <span class="char-count">{commitMessage.length} chars</span>
        </div>
    </div>

    <!-- Commit Button -->
    <button
        type="button"
        class="commit-action-btn"
        onclick={handleCommit}
        disabled={!canCommit}
    >
        {#if isCommitting}
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Committing...</span>
        {:else}
            <i class="fa-solid fa-check"></i>
            <span>Commit Changes</span>
        {/if}
    </button>

    {#if isPickerOpen}
        <GitmojiPicker
            selectedEmoji={selectedGitmoji.emoji}
            onSelectGitmoji={(item) => (selectedGitmoji = item)}
            onClose={() => (isPickerOpen = false)}
        />
    {/if}
</div>

<style>
    .commit-composer {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px 14px;
        background: var(--surface-card);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        margin: 10px 12px;
    }

    .composer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .composer-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        padding: 2px 7px;
        border-radius: var(--radius-full);
        background: var(--surface-panel);
        border: 1px solid var(--border-subtle);
        color: var(--text-muted);
    }

    .status-dot-amber {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--warning-color);
    }

    .status-dot-green {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--success-color);
    }

    .gitmoji-trigger-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        background: var(--surface-panel);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        cursor: pointer;
        text-align: left;
        color: var(--text-primary);
        transition: border-color 0.15s ease;
    }

    .gitmoji-trigger-btn:hover {
        border-color: var(--accent-primary);
    }

    .trigger-emoji {
        font-size: 18px;
        line-height: 1;
    }

    .trigger-labels {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .trigger-code {
        font-size: 11px;
        font-family: monospace;
        font-weight: 600;
        color: var(--accent-primary);
    }

    .trigger-desc {
        font-size: 11px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .chevron-icon {
        font-size: 10px;
        color: var(--text-muted);
    }

    .message-input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .composer-textarea {
        width: 100%;
        padding: 8px 10px;
        background: var(--surface-panel);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 12px;
        font-family: inherit;
        resize: vertical;
        box-sizing: border-box;
    }

    .composer-textarea:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .composer-hint {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: var(--text-muted);
    }

    .commit-action-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px 12px;
        background: var(--accent-primary);
        color: #ffffff;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: var(--radius-md);
        cursor: pointer;
        transition:
            opacity 0.15s ease,
            background-color 0.15s ease;
    }

    .commit-action-btn:hover:not(:disabled) {
        opacity: 0.9;
    }

    .commit-action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
