<script lang="ts">
    import type {
        DocumentStatus,
        DocumentType,
        FictionDocument,
        ProjectFolder,
    } from "../../shared/types";
    import { extractWikilinks } from "../../shared/domain/markdown";

    interface Props {
        document?: FictionDocument | null;
        folder?: ProjectFolder | null;
        allDocuments?: FictionDocument[];
        allFolders?: ProjectFolder[];
        onUpdateDocMeta?: (updates: Partial<FictionDocument>) => void;
        onUpdateFolderMeta?: (folderId: string, updates: Partial<ProjectFolder>) => void;
        onNavigateToDocTitle?: (title: string) => void;
        onSelectDoc?: (docId: string) => void;
        onSelectFolder?: (folderId: string) => void;
        onClose: () => void;
    }

    let {
        document = null,
        folder = null,
        allDocuments = [],
        allFolders = [],
        onUpdateDocMeta,
        onUpdateFolderMeta,
        onNavigateToDocTitle,
        onSelectDoc,
        onSelectFolder,
        onClose,
    }: Props = $props();

    let newTagInput = $state("");
    let newFolderTagInput = $state("");

    // Extract outgoing links from document content
    const outgoingLinks = $derived(extractWikilinks(document?.content || ""));

    // Find backlinks (documents mentioning this document's title)
    const backlinks = $derived.by(() => {
        if (!document?.title || !Array.isArray(allDocuments)) return [];
        const docTitle = document.title.toLowerCase();
        return allDocuments.filter(
            (d) =>
                d &&
                d.id !== document.id &&
                extractWikilinks(d.content || "").some(
                    (link) => link.toLowerCase() === docTitle,
                ),
        );
    });

    // Folder statistics and children
    const folderDocs = $derived.by(() => {
        if (!folder || !Array.isArray(allDocuments)) return [];
        return allDocuments.filter((d) => d.folderId === folder.id);
    });

    const folderSubfolders = $derived.by(() => {
        if (!folder || !Array.isArray(allFolders)) return [];
        return allFolders.filter((f) => f.parentId === folder.id);
    });

    function handleAddTag() {
        if (!document) return;
        const tag = newTagInput.trim();
        if (tag && !document.tags.includes(tag)) {
            onUpdateDocMeta?.({
                tags: [...document.tags, tag],
            });
            newTagInput = "";
        }
    }

    function handleRemoveTag(tagToRemove: string) {
        if (!document) return;
        onUpdateDocMeta?.({
            tags: document.tags.filter((t) => t !== tagToRemove),
        });
    }

    function handleStatusChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        onUpdateDocMeta?.({ status: target.value as DocumentStatus });
    }

    function handleTypeChange(e: Event) {
        const target = e.target as HTMLSelectElement;
        onUpdateDocMeta?.({ type: target.value as DocumentType });
    }

    function handlePovChange(e: Event) {
        const target = e.target as HTMLInputElement;
        onUpdateDocMeta?.({ pov: target.value });
    }

    function handleSummaryChange(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        onUpdateDocMeta?.({ summary: target.value });
    }

    // Folder handlers
    function handleAddFolderTag() {
        if (!folder) return;
        const tag = newFolderTagInput.trim();
        const currentTags = Array.isArray(folder.tags) ? folder.tags : [];
        if (tag && !currentTags.includes(tag)) {
            onUpdateFolderMeta?.(folder.id, {
                tags: [...currentTags, tag],
                updatedAt: new Date().toISOString(),
            });
            newFolderTagInput = "";
        }
    }

    function handleRemoveFolderTag(tagToRemove: string) {
        if (!folder) return;
        const currentTags = Array.isArray(folder.tags) ? folder.tags : [];
        onUpdateFolderMeta?.(folder.id, {
            tags: currentTags.filter((t) => t !== tagToRemove),
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderNameChange(e: Event) {
        if (!folder) return;
        const target = e.target as HTMLInputElement;
        onUpdateFolderMeta?.(folder.id, {
            name: target.value,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderNoteChange(e: Event) {
        if (!folder) return;
        const target = e.target as HTMLTextAreaElement;
        onUpdateFolderMeta?.(folder.id, {
            note: target.value,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleFolderIconChange(e: Event) {
        if (!folder) return;
        const target = e.target as HTMLInputElement;
        onUpdateFolderMeta?.(folder.id, {
            icon: target.value,
            updatedAt: new Date().toISOString(),
        });
    }
</script>

<aside class="inspector">
    <div class="inspector-header">
        <span class="inspector-title">
            {#if folder}
                <i class="fa-solid fa-folder-open"></i> Folder Inspector
            {:else}
                <i class="fa-solid fa-file-lines"></i> Document Inspector
            {/if}
        </span>
        <button
            type="button"
            class="close-btn"
            onclick={onClose}
            title="Close Inspector"
            aria-label="Close Inspector"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    </div>

    <div class="inspector-body">
        {#if folder}
            <!-- FOLDER INSPECTOR MODE -->
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
                        <span class="folder-icon-badge"><i class={folder.icon || "fa-solid fa-folder"}></i></span>
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
            <div class="inspector-group">
                <div class="group-header">
                    <span class="group-title">Folder Tags</span>
                    <span class="tag-count">{(folder.tags || []).length}</span>
                </div>

                <div class="tags-container">
                    {#each folder.tags || [] as tag}
                        <span class="tag-pill">
                            <span class="tag-text">#{tag}</span>
                            <button
                                type="button"
                                class="tag-remove-btn"
                                onclick={() => handleRemoveFolderTag(tag)}
                                title="Remove tag"
                            >
                                ✕
                            </button>
                        </span>
                    {/each}
                </div>

                <div class="add-tag-row">
                    <input
                        type="text"
                        class="add-tag-input"
                        placeholder="Add tag..."
                        bind:value={newFolderTagInput}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddFolderTag();
                            }
                        }}
                    />
                    <button
                        type="button"
                        class="add-tag-btn"
                        onclick={handleAddFolderTag}
                        title="Add tag"
                    >
                        +
                    </button>
                </div>
            </div>

            <!-- Folder Contents Section -->
            <div class="inspector-group">
                <span class="group-title">Contents</span>
                <div class="folder-stats-summary">
                    <span class="stat-pill"><i class="fa-solid fa-file-lines"></i> {folderDocs.length} documents</span>
                    <span class="stat-pill"><i class="fa-solid fa-folder"></i> {folderSubfolders.length} subfolders</span>
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
                                <span class="ref-icon"><i class={sub.icon || "fa-solid fa-folder"}></i></span>
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
                                <span class="ref-icon"><i class="fa-solid fa-file"></i></span>
                                <span class="ref-text">{d.title}</span>
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>

            <!-- Folder Footer Metadata -->
            <div class="inspector-group metadata-footer">
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span class="meta-val">{new Date(folder.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Updated:</span>
                    <span class="meta-val">{new Date(folder.updatedAt).toLocaleTimeString()}</span>
                </div>
            </div>
        {:else if document}
            <!-- DOCUMENT INSPECTOR MODE -->
            <div class="inspector-group">
                <label class="group-title" for="doc-type-select">Properties</label>

                <div class="field-row">
                    <span class="field-label">Type</span>
                    <select
                        id="doc-type-select"
                        class="field-select"
                        value={document.type}
                        onchange={handleTypeChange}
                    >
                        <option value="manuscript">Manuscript</option>
                        <option value="character">Character</option>
                        <option value="world">World & Lore</option>
                        <option value="plot">Plot / Arc</option>
                        <option value="note">Note / Outline</option>
                    </select>
                </div>

                <div class="field-row">
                    <label class="field-label" for="doc-status-select">Status</label>
                    <select
                        id="doc-status-select"
                        class="field-select"
                        value={document.status}
                        onchange={handleStatusChange}
                    >
                        <option value="draft">Draft</option>
                        <option value="in-progress">In Progress</option>
                        <option value="revised">Revised</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {#if document.type === "manuscript" || document.type === "character"}
                    <div class="field-row">
                        <label class="field-label" for="doc-pov-input">POV</label>
                        <input
                            id="doc-pov-input"
                            type="text"
                            class="field-input"
                            value={document.pov || ""}
                            oninput={handlePovChange}
                            placeholder="Point of view character"
                        />
                    </div>
                {/if}
            </div>

            <!-- Summary / Pitch -->
            <div class="inspector-group">
                <label class="group-title" for="doc-summary-textarea">Summary</label>
                <textarea
                    id="doc-summary-textarea"
                    class="field-textarea"
                    rows="3"
                    value={document.summary || ""}
                    oninput={handleSummaryChange}
                    placeholder="Brief premise or scene synopsis..."
                ></textarea>
            </div>

            <!-- Tags Section -->
            <div class="inspector-group">
                <div class="group-header">
                    <span class="group-title">Tags</span>
                    <span class="tag-count">{document.tags.length}</span>
                </div>

                <div class="tags-container">
                    {#each document.tags as tag}
                        <span class="tag-pill">
                            <span class="tag-text">#{tag}</span>
                            <button
                                type="button"
                                class="tag-remove-btn"
                                onclick={() => handleRemoveTag(tag)}
                                title="Remove tag"
                            >
                                ✕
                            </button>
                        </span>
                    {/each}
                </div>

                <div class="add-tag-row">
                    <input
                        type="text"
                        class="add-tag-input"
                        placeholder="Add tag..."
                        bind:value={newTagInput}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                    />
                    <button
                        type="button"
                        class="add-tag-btn"
                        onclick={handleAddTag}
                        title="Add tag"
                    >
                        +
                    </button>
                </div>
            </div>

            <!-- Outgoing Links Section -->
            <div class="inspector-group">
                <div class="group-header">
                    <span class="group-title">Mentions & Links</span>
                    <span class="tag-count">{outgoingLinks.length}</span>
                </div>

                {#if outgoingLinks.length === 0}
                    <div class="empty-note">No [[wikilinks]] in this document</div>
                {:else}
                    <ul class="link-list">
                        {#each outgoingLinks as link (link)}
                            <li>
                                <button
                                    type="button"
                                    class="ref-link-btn"
                                    onclick={() => onNavigateToDocTitle?.(link)}
                                >
                                    <span class="ref-icon"><i class="fa-solid fa-link"></i></span>
                                    <span class="ref-text">{link}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>

            <!-- Backlinks -->
            <div class="inspector-group">
                <div class="group-header">
                    <span class="group-title">Mentioned In ({backlinks.length})</span>
                </div>
                {#if backlinks.length === 0}
                    <div class="empty-note">No incoming backlinks</div>
                {:else}
                    <ul class="link-list">
                        {#each backlinks as backlink (backlink.id)}
                            <li>
                                <button
                                    type="button"
                                    class="ref-link-btn"
                                    onclick={() => onNavigateToDocTitle?.(backlink.title)}
                                >
                                    <span class="ref-icon"><i class="fa-solid fa-reply"></i></span>
                                    <span class="ref-text">{backlink.title}</span>
                                </button>
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>

            <!-- Metadata & Timestamps -->
            <div class="inspector-group metadata-footer">
                <div class="meta-item">
                    <span class="meta-label">ID:</span>
                    <span class="meta-val">{document.id}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created:</span>
                    <span class="meta-val">{new Date(document.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Updated:</span>
                    <span class="meta-val">{new Date(document.updatedAt).toLocaleTimeString()}</span>
                </div>
            </div>
        {:else}
            <div class="empty-inspector-state">
                <i class="fa-solid fa-circle-info"></i>
                <p>Select a document or folder to inspect its properties and metadata.</p>
            </div>
        {/if}
    </div>
</aside>

<style>
    .inspector {
        width: var(--inspector-width);
        background-color: var(--bg-secondary);
        border-left: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        height: calc(100vh - var(--header-height));
        user-select: none;
    }

    .inspector-header {
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        border-bottom: 1px solid var(--border-subtle);
        background-color: var(--bg-tertiary);
    }

    .inspector-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 13px;
    }

    .close-btn:hover {
        color: var(--text-primary);
    }

    .inspector-body {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .inspector-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .group-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .group-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
    }

    .tag-count {
        font-size: 10px;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 1px 5px;
        border-radius: 10px;
    }

    .field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .field-label {
        font-size: 12px;
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .field-select,
    .field-input {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        font-size: 12px;
        border-radius: 4px;
        padding: 4px 8px;
        outline: none;
        flex: 1;
    }

    .field-select:focus,
    .field-input:focus,
    .field-textarea:focus {
        border-color: var(--accent-primary);
    }

    .field-textarea {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        font-size: 12px;
        border-radius: 4px;
        padding: 6px 8px;
        resize: vertical;
        outline: none;
        font-family: inherit;
        line-height: 1.4;
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
        color: var(--accent-primary);
        flex-shrink: 0;
    }

    .meta-code-badge {
        font-family: var(--font-editor, monospace);
        font-size: 11px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 170px;
    }

    .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        min-height: 24px;
    }

    .tag-pill {
        display: flex;
        align-items: center;
        gap: 4px;
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
    }

    .tag-remove-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0;
        line-height: 1;
        font-size: 10px;
    }

    .tag-remove-btn:hover {
        color: var(--error);
    }

    .add-tag-row {
        display: flex;
        gap: 4px;
        margin-top: 2px;
    }

    .add-tag-input {
        flex: 1;
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        padding: 3px 6px;
        border-radius: 4px;
        font-size: 11px;
        outline: none;
    }

    .add-tag-btn {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 0 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }

    .add-tag-btn:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
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

    .empty-note {
        font-size: 11px;
        color: var(--text-muted);
        font-style: italic;
    }

    .empty-inspector-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 16px;
        color: var(--text-muted);
        gap: 12px;
    }

    .empty-inspector-state i {
        font-size: 28px;
        opacity: 0.5;
    }

    .empty-inspector-state p {
        font-size: 12px;
        line-height: 1.5;
    }

    .link-list {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin: 0;
    }

    .ref-link-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--accent-hover);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
    }

    .ref-link-btn:hover {
        background: var(--bg-hover);
        border-color: var(--accent-primary);
    }

    .ref-icon {
        font-size: 11px;
        opacity: 0.7;
    }

    .ref-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
    }

    .metadata-footer {
        margin-top: auto;
        border-top: 1px solid var(--border-subtle);
        padding-top: 12px;
        gap: 4px;
    }

    .meta-item {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--text-muted);
    }

    .meta-label {
        color: var(--text-muted);
    }

    .meta-val {
        color: var(--text-secondary);
        font-family: var(--font-editor, monospace);
    }
</style>