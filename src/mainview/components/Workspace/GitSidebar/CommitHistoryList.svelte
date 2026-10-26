<script lang="ts">
    import type { GitCommitRecord } from "@shared/domain/git";

    interface Props {
        commits: GitCommitRecord[];
        isLoading: boolean;
        activeDiffCommitHash?: string | null;
        onSelectRevert: (commit: GitCommitRecord) => void;
        onSelectDiff?: (commit: GitCommitRecord) => void;
    }

    let {
        commits,
        isLoading,
        activeDiffCommitHash = null,
        onSelectRevert,
        onSelectDiff,
    }: Props = $props();
</script>

<div class="commit-history-container">
    <div class="history-header">
        <span class="history-title">Commit History</span>
        <span class="history-count">{commits.length}</span>
    </div>

    {#if isLoading && commits.length === 0}
        <div class="history-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Loading commits...</span>
        </div>
    {:else if commits.length === 0}
        <div class="history-empty">
            <i class="fa-solid fa-code-commit empty-icon"></i>
            <span class="empty-title">No Commits Yet</span>
            <span class="empty-subtitle">
                Make your first commit above to begin tracking versions and
                milestones.
            </span>
        </div>
    {:else}
        <div class="history-list" role="list">
            {#each commits as commit (commit.hash)}
                <div class="commit-card" role="listitem">
                    <div class="card-header">
                        <div class="card-hash-group">
                            <span class="card-hash" title={commit.hash}>
                                {commit.shortHash}
                            </span>
                            <span
                                class="card-time"
                                title={new Date(
                                    commit.date,
                                ).toLocaleDateString()}
                            >
                                {commit.relativeDate ||
                                    new Date(commit.date).toLocaleDateString()}
                            </span>
                        </div>

                        <div class="card-actions">
                            {#if onSelectDiff}
                                <button
                                    type="button"
                                    class="diff-action-btn"
                                    class:active={activeDiffCommitHash === commit.hash}
                                    onclick={() => onSelectDiff(commit)}
                                    title={activeDiffCommitHash === commit.hash ? "Currently diffing" : `Diff against commit ${commit.shortHash}`}
                                    aria-label={`Diff commit ${commit.shortHash}`}
                                >
                                    <i class="fa-solid fa-code-compare"></i>
                                    <span>{activeDiffCommitHash === commit.hash ? "Diffing" : "Diff"}</span>
                                </button>
                            {/if}

                            <button
                                type="button"
                                class="revert-action-btn"
                                onclick={() => onSelectRevert(commit)}
                                title={`Revert commit ${commit.shortHash}`}
                                aria-label={`Revert commit ${commit.shortHash}`}
                            >
                                <i class="fa-solid fa-rotate-left"></i>
                                <span>Revert</span>
                            </button>
                        </div>
                    </div>

                    <div class="card-message">
                        {#if commit.gitmoji}
                            <span class="card-gitmoji">{commit.gitmoji}</span>
                        {/if}
                        <span class="card-text"
                            >{commit.cleanMessage || commit.message}</span
                        >
                    </div>

                    <div class="card-footer">
                        <span class="card-author" title={commit.authorEmail}>
                            <i class="fa-solid fa-user author-icon"></i>
                            {commit.authorName}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .commit-history-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        padding: 0 12px 12px;
    }

    .history-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 4px 8px;
    }

    .history-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-muted);
    }

    .history-count {
        font-size: 11px;
        font-weight: 600;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.12);
        padding: 1px 6px;
        border-radius: var(--radius-full);
    }

    .history-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 32px;
        color: var(--text-muted);
        font-size: 12px;
    }

    .history-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 36px 16px;
        gap: 6px;
    }

    .empty-icon {
        font-size: 28px;
        color: var(--text-muted);
        opacity: 0.6;
        margin-bottom: 4px;
    }

    .empty-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .empty-subtitle {
        font-size: 11px;
        color: var(--text-muted);
        max-width: 220px;
        line-height: 1.4;
    }

    .history-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-right: 2px;
    }

    .commit-card {
        background: var(--surface-card);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        transition: border-color 0.15s ease;
    }

    .commit-card:hover {
        border-color: var(--accent-primary);
    }

    .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .card-hash-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .card-hash {
        font-size: 10px;
        font-family: monospace;
        font-weight: 600;
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.12);
        padding: 1px 5px;
        border-radius: var(--radius-sm);
    }

    .card-time {
        font-size: 11px;
        color: var(--text-muted);
    }

    .card-actions {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .diff-action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: var(--accent-primary);
        background: transparent;
        border: 1px solid transparent;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .diff-action-btn:hover,
    .diff-action-btn.active {
        background: rgba(88, 166, 255, 0.15);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    .revert-action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 10px;
        color: var(--text-muted);
        background: transparent;
        border: 1px solid transparent;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .revert-action-btn:hover {
        color: var(--warning-color);
        background: rgba(210, 153, 34, 0.1);
        border-color: rgba(210, 153, 34, 0.3);
    }

    .card-message {
        display: flex;
        align-items: baseline;
        gap: 6px;
        font-size: 12px;
        color: var(--text-primary);
        line-height: 1.4;
        word-break: break-word;
    }

    .card-gitmoji {
        font-size: 14px;
        line-height: 1;
        flex-shrink: 0;
    }

    .card-footer {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding-top: 2px;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    }

    .card-author {
        font-size: 10px;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .author-icon {
        font-size: 9px;
    }
</style>
