<script lang="ts">
    import type { DiffLineItem } from "@shared/domain/diff";
    import { renderMarkdown } from "@shared/domain/markdown";
    import {
        DEFAULT_TYPOGRAPHY_SETTINGS,
        computeLineHeight,
        type EditorTypographySettings,
    } from "@shared/domain/typography";

    interface Props {
        diffLines: DiffLineItem[];
        typography?: EditorTypographySettings;
    }

    let { diffLines, typography = DEFAULT_TYPOGRAPHY_SETTINGS }: Props = $props();
    const computedLineHeight = $derived(computeLineHeight(typography.fontSize));
</script>

<div class="preview-diff-body" role="region" aria-label="Markdown diff preview">
    <article
        class="prose-diff-content"
        style="
            {typography.fontFamily ? `font-family: ${typography.fontFamily};` : ''}
            --preview-font-size: {typography.fontSize}px;
            --preview-line-height: {computedLineHeight}px;
        "
    >
        {#each diffLines as line, idx (idx)}
            <div
                class="diff-preview-row"
                class:added={line.type === "added"}
                class:removed={line.type === "removed"}
                class:unmodified={line.type === "unmodified"}
            >
                {#if line.type === "unmodified"}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    <div class="preview-markdown-line">{@html renderMarkdown(line.text || "")}</div>
                {:else}
                    <div class="preview-diff-text">{line.text || "\u00A0"}</div>
                {/if}
            </div>
        {/each}
    </article>
</div>

<style>
    .preview-diff-body {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 32px;
        box-sizing: border-box;
    }

    .prose-diff-content {
        width: 100%;
        max-width: 760px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .diff-preview-row {
        padding: 3px 12px;
        border-radius: 3px;
        font-size: var(--preview-font-size, 16px);
        line-height: var(--preview-line-height, 1.7);
        word-break: break-word;
        box-sizing: border-box;
    }

    .diff-preview-row.added {
        background-color: rgba(63, 185, 80, 0.12);
        color: #3fb950;
        border-left: 3px solid #3fb950;
    }

    .diff-preview-row.removed {
        background-color: rgba(248, 81, 73, 0.12);
        color: #f85149;
        text-decoration: line-through;
        border-left: 3px solid #f85149;
        opacity: 0.85;
    }

    .diff-preview-row.unmodified {
        color: var(--text-primary);
    }

    .preview-markdown-line :global(p) {
        margin: 0;
    }

    .preview-diff-text {
        white-space: pre-wrap;
    }
</style>
