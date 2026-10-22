<script lang="ts">
    import type { FictionDocument } from "../../../../shared/types";

    interface Props {
        activeDoc: FictionDocument | null;
    }

    let { activeDoc }: Props = $props();
</script>

<div class="header-center">
    {#if activeDoc}
        <div class="doc-badge doc-badge-{activeDoc.type}">
            {activeDoc.type}
        </div>
        <span class="active-title">{activeDoc.title}</span>
    {:else}
        <span class="no-doc-label">No document selected</span>
    {/if}
</div>

<style>
    .header-center {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        justify-content: center;
        overflow: hidden;
    }

    .doc-badge {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .doc-badge-manuscript {
        background: rgba(88, 166, 255, 0.15);
        color: #58a6ff;
        border: 1px solid rgba(88, 166, 255, 0.3);
    }

    .doc-badge-character {
        background: rgba(210, 153, 34, 0.15);
        color: #d29922;
        border: 1px solid rgba(210, 153, 34, 0.3);
    }

    .doc-badge-world {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
        border: 1px solid rgba(63, 185, 80, 0.3);
    }

    .doc-badge-plot {
        background: rgba(240, 136, 62, 0.15);
        color: #f0883e;
        border: 1px solid rgba(240, 136, 62, 0.3);
    }

    .doc-badge-note {
        background: rgba(188, 140, 255, 0.15);
        color: #bc8cff;
        border: 1px solid rgba(188, 140, 255, 0.3);
    }

    .active-title {
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 260px;
    }

    .no-doc-label {
        color: var(--text-muted);
        font-style: italic;
        font-size: 13px;
    }
</style>
