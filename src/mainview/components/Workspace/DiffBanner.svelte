<script lang="ts">
    import type { GitCommitRecord } from "@shared/domain/git";

    interface Props {
        commit: GitCommitRecord;
        onExitDiff: () => void;
    }

    let { commit, onExitDiff }: Props = $props();
</script>

<div class="diff-banner" role="banner" aria-label="Active Git Diff">
    <div class="diff-banner-left">
        <div class="diff-mode-badge">
            <i class="fa-solid fa-code-compare"></i>
            <span>DIFF MODE</span>
        </div>
        <span class="diff-banner-text">Comparing current writing with:</span>
        <span class="commit-hash-pill">{commit.shortHash}</span>
        <span class="commit-message-preview">
            {#if commit.gitmoji}{commit.gitmoji} {/if}
            {commit.cleanMessage || commit.message}
        </span>
    </div>

    <button
        type="button"
        class="exit-diff-btn"
        onclick={onExitDiff}
        title="Exit Git diff mode (Esc)"
        aria-label="Exit Diff Mode"
    >
        <i class="fa-solid fa-xmark"></i>
        <span>Exit Diff</span>
    </button>
</div>

<style>
    .diff-banner {
        height: 38px;
        background: rgba(88, 166, 255, 0.12);
        border-bottom: 1px solid rgba(88, 166, 255, 0.28);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        user-select: none;
        flex-shrink: 0;
        z-index: 10;
        backdrop-filter: blur(2px);
    }

    .diff-banner-left {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--text-primary);
        min-width: 0;
    }

    .diff-mode-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.15);
        padding: 2px 6px;
        border-radius: var(--radius-sm, 4px);
    }

    .diff-banner-text {
        color: var(--text-muted);
        font-size: 12px;
    }

    .commit-hash-pill {
        font-family: monospace;
        font-weight: 600;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.18);
        padding: 1px 6px;
        border-radius: var(--radius-sm, 4px);
        font-size: 11px;
    }

    .commit-message-preview {
        color: var(--text-primary);
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 380px;
    }

    .exit-diff-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: var(--surface-card, #22272e);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md, 6px);
        color: var(--text-primary);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .exit-diff-btn:hover {
        background: var(--surface-hover);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }
</style>
