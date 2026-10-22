<script lang="ts">
    import type { FictionDocument, ProjectFolder } from "@shared/types";
    import TagsSection from "./TagsSection.svelte";
    import MetadataFooter from "./MetadataFooter.svelte";

    interface Props {
        folder: ProjectFolder;
        folderDocs: FictionDocument[];
        folderSubfolders: ProjectFolder[];
        onUpdateFolderMeta?: (folderId: string, updates: Partial<ProjectFolder>) => void;
        onSelectDoc?: (docId: string) => void;
        onSelectFolder?: (folderId: string) => void;
    }

    let {
        folder,
        folderDocs,
        folderSubfolders,
        onUpdateFolderMeta,
        onSelectDoc,
        onSelectFolder,
    }: Props = $props();

    function handleAddFolderTag(tag: string) {
        const currentTags = Array.isArray(folder.tags) ? folder.tags : [];
        if (!currentTags.includes(tag)) {
            onUpdateFolderMeta?.(folder.id, {
                tags: [...currentTags, tag],
                updatedAt: new Date().toISOString(),
            });
        }
    }

    function handleRemoveFolderTag(tagToRemove: string) {
        const currentTags = Array.isArray(folder.tags) ? folder.tags : [];
        onUpdateFolderMeta?.(folder.id, {
            tags: currentTags.filter((t) => t !== tagToRemove),
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderNameChange(e: Event) {
        const target = e.target as HTMLInputElement;
        onUpdateFolderMeta?.(folder.id, {
            name: target.value,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderNoteChange(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        onUpdateFolderMeta?.(folder.id, {
            note: target.value,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderIconChange(e: Event) {
        const target = e.target as HTMLInputElement;
        onUpdateFolderMeta?.(folder.id, {
            icon: target.value,
            updatedAt: new Date().toISOString(),
        });
    }
</script>

<div class="folder-inspector-content">
    <!-- Folder Metadata -->
    <div class="inspector-group">
        <span class="group-title">Folder Metadata</span>

        <div class="field-row">
            <span class="field-label">Name</span>
            <input
                type="text"
                class="field-input"
                value={folder.name}
                onchange={handleFolderNameChange}
                placeholder="Folder name"
            />
        </div>

        <div class="field-row">
            <span class="field-label">Icon</span>
            <div class="folder-icon-input-row">
                <span class="folder-icon-badge">
                    <i class={folder.icon || "fa-solid fa-folder"}></i>
                </span>
                <input
                    type="text"
                    class="field-input icon-input"
                    value={folder.icon || "fa-solid fa-folder"}
                    onchange={handleFolderIconChange}
                    placeholder="FontAwesome icon class"
                />
            </div>
        </div>

        <div class="field-row">
            <span class="field-label">Folder ID</span>
            <span class="meta-code-badge">{folder.id}</span>
        </div>

        <div class="field-row">
            <span class="field-label">Path</span>
            <span class="meta-code-badge path-badge">{folder.relativePath}</span>
        </div>
    </div>

    <!-- Folder Short Note -->
    <div class="inspector-group">
        <span class="group-title">Folder Short Note</span>
        <textarea
            class="field-textarea"
            rows="3"
            placeholder="Short note or description for this folder..."
            value={folder.note || ""}
            oninput={handleFolderNoteChange}
        ></textarea>
    </div>

    <!-- Folder Tags -->
    <TagsSection
        title="Folder Tags"
        tags={folder.tags || []}
        onAddTag={handleAddFolderTag}
        onRemoveTag={handleRemoveFolderTag}
    />

    <!-- Folder Contents Section -->
    <div class="inspector-group">
        <span class="group-title">Contents</span>
        <div class="folder-stats-summary">
            <span class="stat-pill">
                <i class="fa-solid fa-file-lines"></i>
                {folderDocs.length} documents
            </span>
            <span class="stat-pill">
                <i class="fa-solid fa-folder"></i>
                {folderSubfolders.length} subfolders
            </span>
        </div>

        {#if folderSubfolders.length > 0}
            <div class="folder-child-list">
                <span class="sub-heading">Subfolders:</span>
                {#each folderSubfolders as sub}
                    <button
                        type="button"
                        class="ref-link-btn"
                        onclick={() => onSelectFolder?.(sub.id)}
                    >
                        <span class="ref-icon">
                            <i class={sub.icon || "fa-solid fa-folder"}></i>
                        </span>
                        <span class="ref-text">{sub.name}</span>
                    </button>
                {/each}
            </div>
        {/if}

        {#if folderDocs.length > 0}
            <div class="folder-child-list">
                <span class="sub-heading">Documents:</span>
                {#each folderDocs as d}
                    <button
                        type="button"
                        class="ref-link-btn"
                        onclick={() => onSelectDoc?.(d.id)}
                    >
                        <span class="ref-icon">
                            <i class="fa-solid fa-file"></i>
                        </span>
                        <span class="ref-text">{d.title}</span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Folder Footer Metadata -->
    <MetadataFooter
        createdAt={folder.createdAt}
        updatedAt={folder.updatedAt}
    />
</div>

<style>
    @import "./inspector.css";

    .folder-inspector-content {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .folder-icon-input-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
    }

    .folder-icon-badge {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        font-size: 12px;
        color: var(--accent-secondary, #58a6ff);
        flex-shrink: 0;
    }

    .folder-stats-summary {
        display: flex;
        gap: 6px;
        margin-bottom: 6px;
    }

    .stat-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        padding: 3px 7px;
        border-radius: 4px;
        font-size: 11px;
        color: var(--text-secondary);
    }

    .folder-child-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
    }

    .sub-heading {
        font-size: 10px;
        text-transform: uppercase;
        font-weight: 600;
        color: var(--text-muted);
        letter-spacing: 0.05em;
    }
</style>
