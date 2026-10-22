<script lang="ts">
    import type { MentionItem } from "./editorMentions";

    interface Props {
        isOpen: boolean;
        candidates: MentionItem[];
        selectedIndex: number;
        onSelect: (item: MentionItem) => void;
    }

    let { isOpen, candidates, selectedIndex, onSelect }: Props = $props();
</script>

{#if isOpen && candidates.length > 0}
    <div
        class="mention-popover"
        role="listbox"
        aria-label="Mention suggestion list"
    >
        <div class="mention-popover-header">
            <span class="mention-header-title">
                <i class="fa-solid fa-at"></i> Mention
            </span>
            <span class="mention-hint">↑↓ navigate • Enter insert • Esc close</span>
        </div>
        <div class="mention-items-list">
            {#each candidates as item, idx (item.id)}
                <button
                    type="button"
                    class="mention-item-btn"
                    class:selected={idx === selectedIndex}
                    role="option"
                    aria-selected={idx === selectedIndex}
                    onclick={() => onSelect(item)}
                >
                    <span class="mention-icon"><i class={item.icon}></i></span>
                    <div class="mention-text-col">
                        <span class="mention-name">{item.name}</span>
                        {#if item.subtitle}
                            <span class="mention-sub">{item.subtitle}</span>
                        {/if}
                    </div>
                    <span class="mention-badge badge-{item.kind}">{item.badge}</span>
                </button>
            {/each}
        </div>
    </div>
{/if}

<style>
    .mention-popover {
        position: absolute;
        bottom: 44px;
        right: 24px;
        width: 320px;
        max-width: calc(100% - 48px);
        background: var(--bg-secondary);
        border: 1px solid var(--border-bold);
        border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 100;
        overflow: hidden;
        animation: mentionFadeIn 0.12s ease-out;
        user-select: none;
    }

    @keyframes mentionFadeIn {
        from {
            opacity: 0;
            transform: translateY(6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .mention-popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-subtle);
        font-size: 10px;
        color: var(--text-muted);
    }

    .mention-header-title {
        font-weight: 600;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .mention-hint {
        font-size: 9px;
        opacity: 0.7;
    }

    .mention-items-list {
        max-height: 220px;
        overflow-y: auto;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .mention-item-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 5px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition: all 0.1s ease;
    }

    .mention-item-btn:hover {
        background: var(--bg-hover);
    }

    .mention-item-btn.selected {
        background: var(--accent-subtle);
        border-color: rgba(230, 157, 69, 0.35);
    }

    .mention-icon {
        font-size: 13px;
        color: var(--text-secondary);
        width: 16px;
        text-align: center;
        flex-shrink: 0;
    }

    .mention-item-btn.selected .mention-icon {
        color: var(--accent-primary);
    }

    .mention-text-col {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .mention-name {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mention-sub {
        font-size: 10px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mention-badge {
        font-size: 9px;
        text-transform: uppercase;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .mention-badge.badge-folder {
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
        color: var(--accent-secondary, #58a6ff);
        border: 1px solid rgba(88, 166, 255, 0.3);
    }

    .mention-badge.badge-doc {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-subtle);
    }
</style>
