<script lang="ts">
    interface Props {
        createMode: "document" | "folder";
        onClose: () => void;
        onSubmit: () => void;
    }

    let { createMode, onClose, onSubmit }: Props = $props();
</script>

<div class="modal-footer">
    <button type="button" class="btn secondary" onclick={onClose}>
        Cancel
    </button>
    <button type="button" class="btn primary" onclick={onSubmit}>
        {#if createMode === "folder"}
            <i class="fa-solid fa-folder-plus"></i> Create Folder
        {:else}
            <i class="fa-solid fa-plus"></i> Create Document
        {/if}
    </button>
</div>
