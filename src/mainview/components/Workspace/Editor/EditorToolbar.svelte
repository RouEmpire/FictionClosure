<script lang="ts">
    interface Props {
        wordWrap: boolean;
        onUndo: () => void;
        onRedo: () => void;
        onInsertSnippet: (prefix: string, suffix?: string) => void;
        onBold: () => void;
        onItalic: () => void;
        onWikilink: () => void;
        onBlockquote: () => void;
        onBulletList: () => void;
        onTaskItem: () => void;
        onToggleWordWrap: () => void;
    }

    let {
        wordWrap,
        onUndo,
        onRedo,
        onInsertSnippet,
        onBold,
        onItalic,
        onWikilink,
        onBlockquote,
        onBulletList,
        onTaskItem,
        onToggleWordWrap,
    }: Props = $props();
</script>

<div class="editor-toolbar">
    <div class="toolbar-group">
        <button
            type="button"
            class="tool-btn"
            onclick={onUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
        >
            <i class="fa-solid fa-rotate-left"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onRedo}
            title="Redo (Ctrl+Alt+Z)"
            aria-label="Redo"
        >
            <i class="fa-solid fa-rotate-right"></i>
        </button>

        <div class="tool-divider"></div>

        <button
            type="button"
            class="tool-btn"
            onclick={() => onInsertSnippet("# ", "")}
            title="Heading 1"
        >
            H1
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={() => onInsertSnippet("## ", "")}
            title="Heading 2"
        >
            H2
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={() => onInsertSnippet("### ", "")}
            title="Heading 3"
        >
            H3
        </button>

        <div class="tool-divider"></div>

        <button
            type="button"
            class="tool-btn"
            onclick={onBold}
            title="Bold (Ctrl+B)"
            aria-label="Bold text"
        >
            <i class="fa-solid fa-bold"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onItalic}
            title="Italic (Ctrl+I)"
            aria-label="Italic text"
        >
            <i class="fa-solid fa-italic"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onWikilink}
            title="Insert Wikilink (Ctrl+L)"
            aria-label="Insert Wikilink"
        >
            <i class="fa-solid fa-anchor"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onBlockquote}
            title="Blockquote (Ctrl+Q)"
            aria-label="Blockquote"
        >
            <i class="fa-solid fa-quote-left"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onBulletList}
            title="Bullet List (Ctrl+-)"
            aria-label="Bullet List"
        >
            <i class="fa-solid fa-list-ul"></i>
        </button>
        <button
            type="button"
            class="tool-btn"
            onclick={onTaskItem}
            title="Task Item (Ctrl+Alt+T, Toggle: Ctrl+T)"
            aria-label="Task Item"
        >
            <i class="fa-solid fa-square-check"></i>
        </button>
    </div>

    <div class="toolbar-right">
        <button
            type="button"
            class="tool-btn"
            class:active={wordWrap}
            onclick={onToggleWordWrap}
            title="Toggle Word Wrap (Ctrl+W)"
            aria-pressed={wordWrap}
        >
            ↩ Wrap
        </button>
    </div>
</div>

<style>
    .editor-toolbar {
        height: 38px;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        flex-shrink: 0;
        user-select: none;
    }

    .toolbar-group,
    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tool-btn {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        border-radius: 4px;
        padding: 3px 7px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: all 0.15s ease;
    }

    .tool-btn:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--border-subtle);
    }

    .tool-btn.active {
        background-color: var(--bg-active);
        color: var(--accent-primary);
        border-color: var(--accent-primary);
    }

    .tool-divider {
        width: 1px;
        height: 16px;
        background-color: var(--border-subtle);
        margin: 0 4px;
    }
</style>
