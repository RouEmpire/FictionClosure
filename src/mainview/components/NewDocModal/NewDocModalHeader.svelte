<script lang="ts">
    interface Props {
        createMode: "document" | "folder";
        onSelectMode: (mode: "document" | "folder") => void;
        onClose: () => void;
    }

    let { createMode, onSelectMode, onClose }: Props = $props();
</script>

<div class="modal-header">
    <div class="modal-mode-tabs">
        <button
            type="button"
            class="mode-tab-btn"
            class:active={createMode === "document"}
            onclick={() => onSelectMode("document")}
        >
            <i class="fa-solid fa-file-lines"></i> Document
        </button>
        <button
            type="button"
            class="mode-tab-btn"
            class:active={createMode === "folder"}
            onclick={() => onSelectMode("folder")}
        >
            <i class="fa-solid fa-folder-plus"></i> Folder
        </button>
    </div>
    <button
        type="button"
        class="close-btn"
        onclick={onClose}
        aria-label="Close dialog"
    >
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>
