<script lang="ts">
    interface Props {
        isFolder: boolean;
        onClose: () => void;
    }

    let { isFolder, onClose }: Props = $props();
</script>

<div class="inspector-header">
    <span class="inspector-title">
        {#if isFolder}
            <i class="fa-solid fa-folder-open"></i> Folder Inspector
        {:else}
            <i class="fa-solid fa-file-lines"></i> Document Inspector
        {/if}
    </span>
    <button
        type="button"
        class="close-btn"
        onclick={onClose}
        title="Close Inspector"
        aria-label="Close Inspector"
    >
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>

<style>
    .inspector-header {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        border-bottom: 1px solid var(--border-subtle);
        background-color: var(--bg-tertiary);
    }

    .inspector-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 13px;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }
</style>
