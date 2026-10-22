<script lang="ts">
    import type { DocumentType, ProjectFolder } from "@shared/types";

    interface Props {
        folderName: string;
        parentFolderId: string | null;
        docType: DocumentType;
        folderTagsInput: string;
        folderNote: string;
        folderIcon: string;
        folders: ProjectFolder[];
        folderInputEl?: HTMLInputElement | null;
    }

    let {
        folderName = $bindable(""),
        parentFolderId = $bindable(null),
        docType = $bindable("manuscript"),
        folderTagsInput = $bindable(""),
        folderNote = $bindable(""),
        folderIcon = $bindable("fa-solid fa-folder"),
        folders,
        folderInputEl = $bindable(null),
    }: Props = $props();
</script>

<!-- Folder Name Input -->
<div class="field-item">
    <label class="field-label" for="folder-name-input">Folder Name</label>
    <input
        id="folder-name-input"
        bind:this={folderInputEl}
        type="text"
        class="text-input"
        placeholder="e.g. Act I: The Awakening, Locations, Subplots"
        bind:value={folderName}
    />
</div>

<!-- Parent Folder Selection -->
<div class="field-item">
    <label class="field-label" for="folder-parent-select">Parent Folder</label>
    <select id="folder-parent-select" class="text-input" bind:value={parentFolderId}>
        <option value={null}>Root Section ({docType})</option>
        {#each folders as f (f.id)}
            <option value={f.id}>{f.relativePath} ({f.name})</option>
        {/each}
    </select>
</div>

<!-- Category Section -->
<div class="field-item">
    <label class="field-label" for="folder-type-select">Category</label>
    <select id="folder-type-select" class="text-input" bind:value={docType}>
        <option value="manuscript">Manuscript</option>
        <option value="character">Characters</option>
        <option value="plot">Plots & Arcs</option>
        <option value="world">World & Lore</option>
        <option value="note">Notes & Outlines</option>
    </select>
</div>

<!-- Folder Tags Input -->
<div class="field-item">
    <label class="field-label" for="folder-tags-input">Folder Tags (comma separated)</label>
    <input
        id="folder-tags-input"
        type="text"
        class="text-input"
        placeholder="e.g. act-1, capital-cities, secondary-plots"
        bind:value={folderTagsInput}
    />
</div>

<!-- Folder Short Note -->
<div class="field-item">
    <label class="field-label" for="folder-note-input">Folder Short Note</label>
    <textarea
        id="folder-note-input"
        class="text-input textarea-note"
        rows="3"
        placeholder="Brief description or purpose of this folder..."
        bind:value={folderNote}
    ></textarea>
</div>

<!-- Folder Icon Selection -->
<div class="field-item">
    <label class="field-label" for="folder-icon-input">Folder Icon (FontAwesome class)</label>
    <div class="icon-picker-row">
        <span class="icon-preview"><i class={folderIcon}></i></span>
        <input
            id="folder-icon-input"
            type="text"
            class="text-input"
            placeholder="e.g. fa-solid fa-folder, fa-solid fa-compass"
            bind:value={folderIcon}
        />
    </div>
</div>
