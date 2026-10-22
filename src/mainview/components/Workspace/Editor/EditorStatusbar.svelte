<script lang="ts">
    interface Props {
        cursorLine: number;
        cursorCol: number;
        paragraphCount: number;
        renderedLinesCount: number;
        wordWrap: boolean;
        docWords: number;
        charCount: number;
    }

    let {
        cursorLine,
        cursorCol,
        paragraphCount,
        renderedLinesCount,
        wordWrap,
        docWords,
        charCount,
    }: Props = $props();
</script>

<div class="editor-statusbar">
    <div class="status-left">
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span class="status-dot-sep">•</span>
        <span>
            {paragraphCount} lines{wordWrap && renderedLinesCount !== paragraphCount
                ? ` (${renderedLinesCount} visual)`
                : ""}
        </span>
    </div>
    <div class="status-right">
        <span>{docWords.toLocaleString()} words</span>
        <span class="status-dot-sep">•</span>
        <span>{charCount.toLocaleString()} chars</span>
    </div>
</div>

<style>
    .editor-statusbar {
        height: var(--status-height);
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-size: 11px;
        color: var(--text-muted);
        user-select: none;
        flex-shrink: 0;
    }

    .status-left,
    .status-right {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .status-dot-sep {
        opacity: 0.4;
    }
</style>
