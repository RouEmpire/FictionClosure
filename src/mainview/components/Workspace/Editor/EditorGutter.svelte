<script lang="ts">
    import type { ZenModeType } from "../../../../shared/types";
    import {
        getGutterRowDisplay,
        type RenderedLine,
    } from "../../../utils/renderedLines";

    interface Props {
        renderedLines: RenderedLine[];
        cursorLine: number;
        zenMode: ZenModeType;
        gutterEl: HTMLDivElement | null;
        onGutterClick: (line: RenderedLine, e: MouseEvent) => void;
    }

    let {
        renderedLines,
        cursorLine,
        zenMode,
        gutterEl = $bindable(null),
        onGutterClick,
    }: Props = $props();
</script>

<div class="gutter" bind:this={gutterEl}>
    {#each renderedLines as line, idx (idx)}
        {@const row = getGutterRowDisplay(line, cursorLine, zenMode)}
        <div
            class="gutter-number"
            class:current={row.isCurrent}
            class:is-dash={row.isDash}
            class:dimmed={row.isDimmed}
            role="button"
            tabindex="-1"
            title={line.isParagraphStart
                ? `Line ${line.paragraphIndex} (Click: jump to start, Alt+Click: jump to end)`
                : `Line ${line.paragraphIndex} (wrapped) (Click: jump to start, Alt+Click: jump to end)`}
            onclick={(e) => onGutterClick(line, e)}
            onkeydown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onGutterClick(line, e as unknown as MouseEvent);
                }
            }}
        >
            {row.text || "\u00A0"}
        </div>
    {/each}
</div>

<style>
    .gutter {
        width: 54px;
        background-color: var(--bg-primary);
        border-right: 1px solid var(--border-subtle);
        padding: 16px 8px;
        text-align: right;
        color: var(--text-muted);
        font-family: var(--active-editor-font);
        user-select: none;
        overflow-y: hidden;
        overflow-x: hidden;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .gutter-number {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        font-size: calc(var(--editor-font-size, 15px) - 2px);
        opacity: 0.45;
        cursor: pointer;
        transition:
            color 0.1s ease,
            opacity 0.1s ease,
            background-color 0.1s ease;
        border-radius: 2px;
        padding: 0 4px;
    }

    .gutter-number:hover {
        opacity: 0.9;
        background-color: var(--bg-hover);
        color: var(--text-primary);
    }

    .gutter-number.current {
        opacity: 1;
        color: var(--accent-primary);
        font-weight: 700;
    }

    .gutter-number.is-dash {
        font-weight: 400;
        font-size: calc(var(--editor-font-size, 15px) - 2px);
        opacity: 0.35;
    }

    .gutter-number.is-dash.current {
        opacity: 0.9;
        font-weight: 700;
        color: var(--accent-primary);
    }

    .gutter-number.dimmed {
        opacity: 0.22;
    }

    .gutter-number.dimmed:hover {
        opacity: 0.8;
    }
</style>
