<script lang="ts">
    import { formatVimModeLabel, type VimMode } from "@shared/domain/vim";

    interface Props {
        cursorLine: number;
        cursorCol: number;
        paragraphCount: number;
        renderedLinesCount: number;
        wordWrap: boolean;
        docWords: number;
        charCount: number;
        vimMode?: VimMode | null;
    }

    let {
        cursorLine,
        cursorCol,
        paragraphCount,
        renderedLinesCount,
        wordWrap,
        docWords,
        charCount,
        vimMode = null,
    }: Props = $props();
</script>

<div class="editor-statusbar">
    <div class="status-left">
        {#if vimMode}
            <span class="vim-mode-badge mode-{vimMode}">
                -- {formatVimModeLabel(vimMode)} --
            </span>
            <span class="status-dot-sep">•</span>
        {/if}
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

    .vim-mode-badge {
        font-family: monospace;
        font-weight: 700;
        font-size: 10px;
        letter-spacing: 0.5px;
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        user-select: none;
    }

    .vim-mode-badge.mode-normal {
        background: rgba(88, 166, 255, 0.15);
        color: #58a6ff;
        border: 1px solid rgba(88, 166, 255, 0.35);
    }

    .vim-mode-badge.mode-insert {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
        border: 1px solid rgba(63, 185, 80, 0.35);
    }

    .vim-mode-badge.mode-visual,
    .vim-mode-badge.mode-visual-line,
    .vim-mode-badge.mode-visual-block {
        background: rgba(210, 153, 34, 0.15);
        color: #d29922;
        border: 1px solid rgba(210, 153, 34, 0.35);
    }

    .vim-mode-badge.mode-command-line {
        background: rgba(163, 113, 247, 0.15);
        color: #bc8cff;
        border: 1px solid rgba(163, 113, 247, 0.35);
    }

    .status-dot-sep {
        opacity: 0.4;
    }
</style>
