<script lang="ts">
    import type { DocumentType, ProjectFolder } from "@shared/types";
    import { getDefaultDocTitle } from "./newDocHelpers";

    interface Props {
        docType: DocumentType;
        title: string;
        tagsInput: string;
        parentFolderId: string | null;
        folders: ProjectFolder[];
        existingCount: number;
        inputEl?: HTMLInputElement | null;
    }

    let {
        docType = $bindable("manuscript"),
        title = $bindable(""),
        tagsInput = $bindable(""),
        parentFolderId = $bindable(null),
        folders,
        existingCount,
        inputEl = $bindable(null),
    }: Props = $props();

    function selectType(newType: DocumentType) {
        docType = newType;
        title = getDefaultDocTitle(newType, existingCount);
    }
</script>

<!-- Type Selector -->
<div class="field-item">
    <label class="field-label" for="doc-type-radio-group">Document Type</label>
    <div id="doc-type-radio-group" class="type-selector-grid">
        <button
            type="button"
            class="type-choice-btn"
            class:active={docType === "manuscript"}
            onclick={() => selectType("manuscript")}
        >
            <span class="type-choice-icon"><i class="fa-solid fa-book-open"></i></span>
            <span class="type-choice-label">Chapter</span>
        </button>

        <button
            type="button"
            class="type-choice-btn"
            class:active={docType === "character"}
            onclick={() => selectType("character")}
        >
            <span class="type-choice-icon"><i class="fa-solid fa-user"></i></span>
            <span class="type-choice-label">Character</span>
        </button>

        <button
            type="button"
            class="type-choice-btn"
            class:active={docType === "plot"}
            onclick={() => selectType("plot")}
        >
            <span class="type-choice-icon"><i class="fa-solid fa-chart-line"></i></span>
            <span class="type-choice-label">Plot / Arc</span>
        </button>

        <button
            type="button"
            class="type-choice-btn"
            class:active={docType === "world"}
            onclick={() => selectType("world")}
        >
            <span class="type-choice-icon"><i class="fa-solid fa-map"></i></span>
            <span class="type-choice-label">World Lore</span>
        </button>

        <button
            type="button"
            class="type-choice-btn"
            class:active={docType === "note"}
            onclick={() => selectType("note")}
        >
            <span class="type-choice-icon"><i class="fa-solid fa-file-lines"></i></span>
            <span class="type-choice-label">Outline/Note</span>
        </button>
    </div>
</div>

<!-- Parent Folder Selection -->
{#if folders.length > 0}
    <div class="field-item">
        <label class="field-label" for="doc-parent-folder">Parent Folder</label>
        <select id="doc-parent-folder" class="text-input" bind:value={parentFolderId}>
            <option value={null}>None (Root of Section)</option>
            {#each folders as f (f.id)}
                <option value={f.id}>{f.relativePath} ({f.name})</option>
            {/each}
        </select>
    </div>
{/if}

<!-- Document Title Input -->
<div class="field-item">
    <label class="field-label" for="doc-title-input">Document Title</label>
    <input
        id="doc-title-input"
        bind:this={inputEl}
        type="text"
        class="text-input"
        placeholder="e.g. Chapter 3: The Midnight Fog"
        bind:value={title}
    />
</div>

<!-- Tags Input -->
<div class="field-item">
    <label class="field-label" for="doc-tags-input">Initial Tags (comma separated)</label>
    <input
        id="doc-tags-input"
        type="text"
        class="text-input"
        placeholder="e.g. Act I, Draft, POV: Elena"
        bind:value={tagsInput}
    />
</div>
