<script lang="ts">
    import {
        formatBlameInfo,
        type DiffLineItem,
        type FormattedBlameInfo,
    } from "@shared/domain/diff";
    import {
        DEFAULT_TYPOGRAPHY_SETTINGS,
        computeLineHeight,
        type EditorTypographySettings,
    } from "@shared/domain/typography";

    interface Props {
        diffLines: DiffLineItem[];
        writerName: string;
        typography?: EditorTypographySettings;
        customFont?: string;
    }

    let {
        diffLines,
        writerName,
        typography = DEFAULT_TYPOGRAPHY_SETTINGS,
        customFont = "",
    }: Props = $props();

    let selectedBlameIdx = $state<number | null>(null);
    let selectedBlameInfo = $state<FormattedBlameInfo | null>(null);
    let blameAnchorTop = $state(0);
    const computedLineHeight = $derived(computeLineHeight(typography.fontSize));

    function handleGutterClick(idx: number, line: DiffLineItem, e: MouseEvent) {
        e.stopPropagation();
        if (selectedBlameIdx === idx) {
            selectedBlameIdx = null;
            selectedBlameInfo = null;
            return;
        }

        const target = e.currentTarget as HTMLElement;
        blameAnchorTop = target.offsetTop;

        selectedBlameIdx = idx;
        selectedBlameInfo = formatBlameInfo(
            line.authorName || "Author",
            line.authorTime || Math.floor(Date.now() / 1000),
            writerName,
        );
    }

    function handleBackdropClick() {
        selectedBlameIdx = null;
        selectedBlameInfo = null;
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    class="editor-diff-container"
    onclick={handleBackdropClick}
    role="region"
    aria-label="Git Diff Editor View"
    style="
        --active-editor-font: {customFont || typography.fontFamily || 'inherit'};
        --editor-font-size: {typography.fontSize}px;
        --editor-line-height: {computedLineHeight}px;
    "
>
    <div class="diff-gutter" aria-label="Line Diff Gutter">
        {#each diffLines as line, idx (idx)}
            <button
                type="button"
                class="diff-gutter-row"
                class:added={line.type === "added"}
                class:removed={line.type === "removed"}
                class:active-blame={selectedBlameIdx === idx}
                onclick={(e) => handleGutterClick(idx, line, e)}
                title="Click to view author and time details"
                aria-label={`Line ${line.newLineNumber || line.oldLineNumber || idx + 1} blame info`}
            >
                <span class="gutter-sign">
                    {#if line.type === "added"}+{/if}
                    {#if line.type === "removed"}-{/if}
                </span>
                <span class="gutter-num">
                    {line.newLineNumber || line.oldLineNumber || ""}
                </span>
            </button>
        {/each}
    </div>

    <div class="diff-code-area" role="textbox" aria-readonly="true">
        {#each diffLines as line, idx (idx)}
            <div
                class="diff-code-line"
                class:added={line.type === "added"}
                class:removed={line.type === "removed"}
            >
                <span class="line-content">{line.text || "\u00A0"}</span>
            </div>
        {/each}

        {#if selectedBlameInfo !== null}
            <div
                class="blame-popover"
                style="top: {blameAnchorTop}px;"
                role="tooltip"
            >
                <i class={selectedBlameInfo.iconClass}></i>
                <span class="blame-name">{selectedBlameInfo.name}</span>,
                <span class="blame-days">{selectedBlameInfo.daysAgoText}</span>
            </div>
        {/if}
    </div>
</div>

<style>
    .editor-diff-container {
        display: flex;
        flex: 1;
        width: 100%;
        height: 100%;
        overflow-y: auto;
        overflow-x: auto;
        background-color: var(--bg-primary);
        font-family: var(--active-editor-font);
        position: relative;
    }

    .diff-gutter {
        width: 68px;
        flex-shrink: 0;
        background-color: var(--bg-secondary);
        border-right: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        user-select: none;
        padding-top: 12px;
        padding-bottom: 24px;
        box-sizing: border-box;
    }

    .diff-gutter-row {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        padding: 0 8px;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 11px;
        font-family: monospace;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .diff-gutter-row:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
    }

    .diff-gutter-row.added {
        background-color: rgba(63, 185, 80, 0.15);
        color: #3fb950;
        font-weight: 700;
    }

    .diff-gutter-row.removed {
        background-color: rgba(248, 81, 73, 0.15);
        color: #f85149;
        font-weight: 700;
    }

    .diff-gutter-row.active-blame {
        outline: 1px solid var(--accent-primary);
    }

    .gutter-sign {
        width: 10px;
        font-weight: 800;
        text-align: center;
    }

    .gutter-num {
        min-width: 28px;
        text-align: right;
    }

    .diff-code-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding-top: 12px;
        padding-bottom: 24px;
        position: relative;
        min-width: 0;
        overflow-x: auto;
    }

    .diff-code-line {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        font-size: var(--editor-font-size, 16px);
        padding: 0 16px;
        white-space: pre;
        word-break: normal;
        overflow-wrap: normal;
        box-sizing: border-box;
        color: var(--text-primary);
        width: max-content;
        min-width: 100%;
    }

    .diff-code-line.added {
        background-color: rgba(63, 185, 80, 0.12);
        color: #3fb950;
    }

    .diff-code-line.removed {
        background-color: rgba(248, 81, 73, 0.12);
        color: #f85149;
        text-decoration: line-through;
        opacity: 0.85;
    }

    .line-content {
        display: inline-block;
        white-space: pre;
    }

    .blame-popover {
        position: absolute;
        left: 20px;
        transform: translateY(-50%);
        background: var(--surface-panel, #1e2228);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md, 6px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        padding: 5px 10px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-primary);
        z-index: 50;
        pointer-events: auto;
        white-space: nowrap;
    }

    .blame-name {
        font-weight: 600;
        color: var(--accent-primary);
    }

    .blame-days {
        color: var(--text-muted);
    }
</style>
