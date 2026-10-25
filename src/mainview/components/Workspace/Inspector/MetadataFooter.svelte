<script lang="ts">
    interface Props {
        id?: string;
        createdAt: string;
        updatedAt: string;
    }

    let { id, createdAt, updatedAt }: Props = $props();
</script>

<div class="inspector-group metadata-footer">
    {#if id}
        <div class="meta-item">
            <span class="meta-label">ID:</span>
            <span class="meta-val">{id}</span>
        </div>
    {/if}
    <div class="meta-item">
        <span class="meta-label">Created:</span>
        <span class="meta-val">{new Date(createdAt).toLocaleDateString()}</span>
    </div>
    <div class="meta-item">
        <span class="meta-label">Updated:</span>
        <span class="meta-val">{new Date(updatedAt).toLocaleTimeString()}</span>
    </div>
</div>

<style>
    .metadata-footer {
        margin-top: auto;
        border-top: 1px solid var(--border-subtle);
        padding-top: 12px;
        gap: 4px;
    }

    .meta-item {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--text-muted);
    }

    .meta-label {
        color: var(--text-muted);
    }

    .meta-val {
        color: var(--text-secondary);
        font-family: var(--font-editor, monospace);
    }
</style>
