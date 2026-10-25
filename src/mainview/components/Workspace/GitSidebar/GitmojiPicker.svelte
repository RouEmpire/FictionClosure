<script lang="ts">
    import {
        searchGitmojis,
        type GitmojiCategory,
        type GitmojiItem,
    } from "@shared/domain/gitmoji";

    interface Props {
        selectedEmoji: string;
        onSelectGitmoji: (item: GitmojiItem) => void;
        onClose: () => void;
    }

    let { selectedEmoji, onSelectGitmoji, onClose }: Props = $props();

    let searchQuery = $state("");
    let activeCategory = $state<GitmojiCategory | "all">("all");

    const categories: { id: GitmojiCategory | "all"; label: string }[] = [
        { id: "all", label: "All" },
        { id: "writing", label: "Writing" },
        { id: "plot", label: "Plot" },
        { id: "characters", label: "Characters" },
        { id: "review", label: "Review" },
        { id: "meta", label: "Meta" },
    ];

    const filteredGitmojis = $derived(
        searchGitmojis(searchQuery, activeCategory),
    );

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
        }
    }
</script>

<div
    class="gitmoji-picker-backdrop"
    onclick={onClose}
    onkeydown={handleKeyDown}
    role="presentation"
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
        class="gitmoji-picker-popover"
        onclick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Select Novel Writing Gitmoji"
        tabindex="-1"
    >
        <div class="picker-header">
            <span class="picker-title">Choose Gitmoji for Story</span>
            <button
                type="button"
                class="picker-close"
                onclick={onClose}
                aria-label="Close picker"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>

        <div class="picker-search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                type="text"
                class="picker-search-input"
                placeholder="Search by story intent, prose, plot..."
                bind:value={searchQuery}
            />
        </div>

        <div class="picker-categories" role="tablist">
            {#each categories as cat (cat.id)}
                <button
                    type="button"
                    class="category-tab"
                    class:active={activeCategory === cat.id}
                    onclick={() => (activeCategory = cat.id)}
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                >
                    {cat.label}
                </button>
            {/each}
        </div>

        <div class="picker-grid" role="listbox">
            {#if filteredGitmojis.length === 0}
                <div class="picker-empty">No matching writing Gitmojis</div>
            {:else}
                {#each filteredGitmojis as item (item.code)}
                    <button
                        type="button"
                        class="gitmoji-option"
                        class:selected={selectedEmoji === item.emoji}
                        onclick={() => {
                            onSelectGitmoji(item);
                            onClose();
                        }}
                        title={`${item.code} — ${item.writingDescription}`}
                        role="option"
                        aria-selected={selectedEmoji === item.emoji}
                    >
                        <span class="gitmoji-char">{item.emoji}</span>
                        <div class="gitmoji-info">
                            <span class="gitmoji-desc"
                                >{item.writingDescription}</span
                            >
                            <span class="gitmoji-code">{item.code}</span>
                        </div>
                    </button>
                {/each}
            {/if}
        </div>
    </div>
</div>

<style>
    .gitmoji-picker-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(2px);
    }

    .gitmoji-picker-popover {
        width: 380px;
        max-width: 90vw;
        max-height: 480px;
        background: var(--surface-panel);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .picker-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid var(--border-subtle);
    }

    .picker-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .picker-close {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: var(--radius-sm);
    }

    .picker-close:hover {
        color: var(--text-primary);
        background: var(--surface-hover);
    }

    .picker-search-box {
        position: relative;
        padding: 10px 14px 6px;
    }

    .search-icon {
        position: absolute;
        left: 24px;
        top: 20px;
        font-size: 12px;
        color: var(--text-muted);
    }

    .picker-search-input {
        width: 100%;
        padding: 7px 10px 7px 30px;
        background: var(--surface-card);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-size: 12px;
        box-sizing: border-box;
    }

    .picker-search-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .picker-categories {
        display: flex;
        gap: 4px;
        padding: 4px 14px 8px;
        border-bottom: 1px solid var(--border-subtle);
        overflow-x: auto;
    }

    .category-tab {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        white-space: nowrap;
    }

    .category-tab:hover {
        color: var(--text-primary);
        background: var(--surface-hover);
    }

    .category-tab.active {
        color: var(--accent-primary);
        background: rgba(88, 166, 255, 0.12);
        font-weight: 600;
    }

    .picker-grid {
        flex: 1;
        overflow-y: auto;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .picker-empty {
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: var(--text-muted);
    }

    .gitmoji-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 10px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        text-align: left;
        cursor: pointer;
        color: var(--text-primary);
        transition:
            background 0.15s ease,
            border-color 0.15s ease;
    }

    .gitmoji-option:hover {
        background: var(--surface-hover);
        border-color: var(--border-subtle);
    }

    .gitmoji-option.selected {
        background: rgba(88, 166, 255, 0.14);
        border-color: var(--accent-primary);
    }

    .gitmoji-char {
        font-size: 18px;
        line-height: 1;
        width: 24px;
        text-align: center;
    }

    .gitmoji-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .gitmoji-desc {
        font-size: 12px;
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .gitmoji-code {
        font-size: 11px;
        color: var(--text-muted);
        font-family: monospace;
    }
</style>
