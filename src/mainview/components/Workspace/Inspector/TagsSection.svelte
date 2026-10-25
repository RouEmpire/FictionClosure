<script lang="ts">
    interface Props {
        title?: string;
        tags: string[];
        onAddTag: (tag: string) => void;
        onRemoveTag: (tag: string) => void;
    }

    let {
        title = "Tags",
        tags = [],
        onAddTag,
        onRemoveTag,
    }: Props = $props();

    let newTagInput = $state("");

    function handleAdd() {
        const tag = newTagInput.trim();
        if (tag && !tags.includes(tag)) {
            onAddTag(tag);
            newTagInput = "";
        }
    }
</script>

<div class="inspector-group">
    <div class="group-header">
        <span class="group-title">{title}</span>
        <span class="tag-count">{tags.length}</span>
    </div>

    <div class="tags-container">
        {#each tags as tag}
            <span class="tag-pill">
                <span class="tag-text">#{tag}</span>
                <button
                    type="button"
                    class="tag-remove-btn"
                    onclick={() => onRemoveTag(tag)}
                    title="Remove tag"
                >
                    ✕
                </button>
            </span>
        {/each}
    </div>

    <div class="add-tag-row">
        <input
            type="text"
            class="add-tag-input"
            placeholder="Add tag..."
            bind:value={newTagInput}
            onkeydown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                }
            }}
        />
        <button
            type="button"
            class="add-tag-btn"
            onclick={handleAdd}
            title="Add tag"
        >
            +
        </button>
    </div>
</div>

<style>
    .tag-count {
        font-size: 10px;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 1px 5px;
        border-radius: 10px;
    }

    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        min-height: 24px;
    }

    .tag-pill {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
    }

    .tag-remove-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0;
        line-height: 1;
        font-size: 10px;
    }

    .tag-remove-btn:hover {
        color: var(--error);
    }

    .add-tag-row {
        display: flex;
        gap: 4px;
        margin-top: 2px;
    }

    .add-tag-input {
        flex: 1;
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        outline: none;
    }

    .add-tag-btn {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 0 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .add-tag-btn:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
    }
</style>
