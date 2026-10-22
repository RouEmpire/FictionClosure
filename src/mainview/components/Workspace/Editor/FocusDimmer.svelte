<script lang="ts">
    import type { RenderedLine } from "@utils/renderedLines";

    interface Props {
        isFocusMode: boolean;
        renderedLines: RenderedLine[];
        cursorLine: number;
        scrollLeft: number;
        scrollTop: number;
    }

    let {
        isFocusMode,
        renderedLines,
        cursorLine,
        scrollLeft,
        scrollTop,
    }: Props = $props();
</script>

{#if isFocusMode}
    <div
        class="focus-dimmer-overlay"
        aria-hidden="true"
        style="transform: translate(-{scrollLeft}px, -{scrollTop}px);"
    >
        {#each renderedLines as line, idx (idx)}
            <div
                class="dimmer-line"
                class:is-active-paragraph={line.paragraphIndex === cursorLine}
            ></div>
        {/each}
    </div>
{/if}

<style>
    .focus-dimmer-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        pointer-events: none;
        padding: 16px 20px;
        box-sizing: border-box;
        will-change: transform;
    }

    .dimmer-line {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        box-sizing: border-box;
        background-color: var(--bg-primary);
        opacity: 0.5;
        transition:
            opacity 0.15s ease,
            background-color 0.15s ease;
    }

    .dimmer-line.is-active-paragraph {
        opacity: 0;
        background-color: transparent;
    }
</style>
