<script lang="ts">
    interface Props {
        onCreateDoc: () => void;
    }

    let { onCreateDoc }: Props = $props();
</script>

<div class="empty-state">
    <div class="empty-card">
        <span class="empty-icon"><i class="fa-solid fa-pen-nib"></i></span>
        <h2>No Document Selected</h2>
        <p>
            Select a chapter, character sheet, or lore note from
            the sidebar, or create a new one to begin writing.
        </p>
        <button
            type="button"
            class="create-btn"
            onclick={onCreateDoc}
        >
            Create New Document
        </button>
    </div>
</div>

<style>
    .empty-state {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--bg-primary, #0d1117);
    }

    .empty-card {
        text-align: center;
        max-width: 360px;
        padding: 32px;
        background-color: var(--bg-secondary, #161b22);
        border: 1px dashed var(--border-subtle, #30363d);
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
    }

    .empty-icon {
        font-size: 36px;
    }

    .empty-card h2 {
        font-size: 16px;
        color: var(--text-primary, #e6edf3);
        margin: 0;
    }

    .empty-card p {
        font-size: 13px;
        color: var(--text-muted, #8b949e);
        line-height: 1.5;
        margin: 0;
    }

    .create-btn {
        margin-top: 8px;
        background: var(--accent-primary, #e69d45);
        color: #12151a;
        border: none;
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .create-btn:hover {
        background: var(--accent-hover, #f0b060);
    }
</style>
