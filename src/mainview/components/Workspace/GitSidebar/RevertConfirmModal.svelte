<script lang="ts">
    import type { GitCommitRecord } from "@shared/domain/git";

    interface Props {
        commit: GitCommitRecord;
        onConfirmRevert: () => Promise<void>;
        onClose: () => void;
    }

    let { commit, onConfirmRevert, onClose }: Props = $props();
    let isReverting = $state(false);

    async function handleConfirm() {
        if (isReverting) return;
        isReverting = true;
        try {
            await onConfirmRevert();
        } finally {
            isReverting = false;
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && !isReverting) {
            e.stopPropagation();
            onClose();
        }
    }
</script>

<div
    class="revert-modal-backdrop"
    onclick={onClose}
    onkeydown={handleKeyDown}
    role="presentation"
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="revert-modal-dialog"
        onclick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirm Commit Revert"
        tabindex="-1"
    >
        <div class="modal-header">
            <div class="header-icon-wrapper">
                <i class="fa-solid fa-rotate-left"></i>
            </div>
            <div class="header-text">
                <span class="modal-title">Revert Manuscript Commit</span>
                <span class="modal-subtitle"
                    >Create an inverse commit to undo these changes</span
                >
            </div>
        </div>

        <div class="commit-target-card">
            <div class="target-top-row">
                <span class="commit-hash-pill">{commit.shortHash}</span>
                <span class="commit-date"
                    >{commit.relativeDate ||
                        new Date(commit.date).toLocaleDateString()}</span
                >
            </div>
            <div class="target-message">
                {#if commit.gitmoji}
                    <span class="message-gitmoji">{commit.gitmoji}</span>
                {/if}
                <span class="message-text"
                    >{commit.cleanMessage || commit.message}</span
                >
            </div>
        </div>

        <div class="safety-notice">
            <i class="fa-solid fa-shield-halved safety-icon"></i>
            <span class="safety-text">
                Your history is preserved. Git will add a new revert commit
                without deleting previous versions. Unsaved workspace changes
                will be saved before reverting.
            </span>
        </div>

        <div class="modal-actions">
            <button
                type="button"
                class="btn-cancel"
                onclick={onClose}
                disabled={isReverting}
            >
                Cancel
            </button>
            <button
                type="button"
                class="btn-revert"
                onclick={handleConfirm}
                disabled={isReverting}
            >
                {#if isReverting}
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Reverting...</span>
                {:else}
                    <i class="fa-solid fa-rotate-left"></i>
                    <span>Revert Commit</span>
                {/if}
            </button>
        </div>
    </div>
</div>

<style>
    .revert-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1100;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
    }

    .revert-modal-dialog {
        width: 420px;
        max-width: 90vw;
        background: var(--surface-panel);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .header-icon-wrapper {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(210, 153, 34, 0.15);
        color: var(--warning-color);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
    }

    .header-text {
        display: flex;
        flex-direction: column;
    }

    .modal-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .modal-subtitle {
        font-size: 12px;
        color: var(--text-muted);
    }

    .commit-target-card {
        background: var(--surface-card);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .target-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .commit-hash-pill {
        font-size: 11px;
        font-family: monospace;
        font-weight: 600;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.12);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
    }

    .commit-date {
        font-size: 11px;
        color: var(--text-muted);
    }

    .target-message {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 13px;
        color: var(--text-primary);
        font-weight: 500;
        line-height: 1.4;
    }

    .message-gitmoji {
        font-size: 15px;
    }

    .safety-notice {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.4;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border-subtle);
        padding: 8px 10px;
        border-radius: var(--radius-md);
    }

    .safety-icon {
        color: var(--accent-primary);
        margin-top: 2px;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
    }

    .btn-cancel {
        padding: 7px 14px;
        background: transparent;
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
    }

    .btn-cancel:hover:not(:disabled) {
        background: var(--surface-hover);
    }

    .btn-revert {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        background: var(--warning-color);
        border: none;
        border-radius: var(--radius-md);
        color: #1a1500;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
    }

    .btn-revert:hover:not(:disabled) {
        filter: brightness(1.1);
    }

    .btn-revert:disabled,
    .btn-cancel:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
