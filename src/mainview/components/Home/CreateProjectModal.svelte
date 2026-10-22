<script lang="ts">
    import {
        SUPPORTED_COVER_ACCEPT,
        SUPPORTED_COVER_FORMAT_LABELS,
        isSupportedCoverFile,
        getCoverFormatLabel,
        canRenderBrowserPreview,
    } from "@shared/domain/coverSupport";
    import { renderMarkdown } from "@shared/domain/markdown";
    import { promptSelectFolder } from "@services/storage";
    import { slugifyTitle } from "@shared/domain/documentPaths";

    export interface CreateProjectData {
        name: string;
        folderPath: string;
        author: string;
        genre: string;
        targetWordCount: number;
        coverImage?: string;
        readme?: string;
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        onCreate: (data: CreateProjectData) => void;
    }

    let { isOpen, onClose, onCreate }: Props = $props();

    type TabType = "general" | "cover" | "readme";
    let activeTab = $state<TabType>("general");

    // Form fields
    let name = $state("My Novel");
    let folderPath = $state("~/FictionProjects/my-novel");
    let author = $state("");
    let genre = $state("Fiction");
    let targetWordCount = $state(50000);
    let coverImage = $state<string | undefined>(undefined);
    let coverFileName = $state<string>("");
    let readme = $state("");

    // UI state
    let isCustomPath = $state(false);
    let isDragging = $state(false);
    let isSelectingFolder = $state(false);
    let readmePreviewMode = $state(false);
    let fileInputEl: HTMLInputElement | null = $state(null);

    const GENRE_SUGGESTIONS = [
        "Fantasy",
        "Science Fiction",
        "Mystery / Thriller",
        "Horror",
        "Romance",
        "Historical Fiction",
        "Literary Fiction",
        "Young Adult",
        "Adventure",
        "Speculative Fiction",
        "Non-Fiction",
    ];

    $effect(() => {
        if (isOpen) {
            name = "My Novel";
            folderPath = "~/FictionProjects/my-novel";
            author = "";
            genre = "Fiction";
            targetWordCount = 50000;
            coverImage = undefined;
            coverFileName = "";
            readme = `# My Novel\n\n**Author:** Author\n**Genre:** Fiction\n\n## Synopsis\nBegin your story outline and notes here...\n`;
            activeTab = "general";
            isCustomPath = false;
            readmePreviewMode = false;
            isDragging = false;
        }
    });

    // Auto-update folder path suggestion as user types name, unless they picked custom path
    function handleNameInput(e: Event) {
        const val = (e.target as HTMLInputElement).value;
        name = val;
        if (!isCustomPath) {
            const slug = slugifyTitle(val) || "my-novel";
            folderPath = `~/FictionProjects/${slug}`;
        }
    }

    const isCoverRenderable = $derived(
        coverImage ? canRenderBrowserPreview(coverImage) : false,
    );
    const coverBadgeLabel = $derived(
        coverImage ? getCoverFormatLabel(coverFileName || coverImage) : "",
    );
    const renderedReadmeHtml = $derived(renderMarkdown(readme));

    async function handleBrowseFolder() {
        isSelectingFolder = true;
        try {
            const res = await promptSelectFolder(folderPath || undefined);
            if (!res.canceled && res.folderPath) {
                folderPath = res.folderPath;
                isCustomPath = true;
            }
        } finally {
            isSelectingFolder = false;
        }
    }

    function handleFileSelected(file: File) {
        if (!isSupportedCoverFile(file.name)) {
            alert(
                `Unsupported cover format. Please use one of: ${SUPPORTED_COVER_FORMAT_LABELS.join(", ")}`,
            );
            return;
        }

        coverFileName = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === "string") {
                coverImage = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    function handleFileInputChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files.length > 0 && files[0]) {
            handleFileSelected(files[0]);
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelected(file);
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave() {
        isDragging = false;
    }

    function handleRemoveCover() {
        coverImage = undefined;
        coverFileName = "";
    }

    function handleCreate() {
        const trimmedName = name.trim();
        const trimmedFolder = folderPath.trim();

        if (!trimmedName) {
            alert("Please enter a project name.");
            return;
        }

        if (!trimmedFolder) {
            alert("Please choose or specify a destination save folder.");
            return;
        }

        onCreate({
            name: trimmedName,
            folderPath: trimmedFolder,
            author: author.trim() || "Author",
            genre: genre.trim() || "Fiction",
            targetWordCount: Math.max(1000, Number(targetWordCount) || 50000),
            coverImage,
            readme: readme.trim() || `# ${trimmedName}\n`,
        });
        onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            handleCreate();
        }
    }
</script>

{#if isOpen}
    <div
        class="create-project-modal-backdrop"
        role="presentation"
        onclick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        onkeydown={handleKeyDown}
        tabindex="-1"
    >
        <div
            class="create-project-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-proj-title"
        >
            <!-- Header -->
            <div class="modal-header">
                <div class="header-title-row">
                    <div class="title-with-icon">
                        <i class="fa-solid fa-folder-plus header-icon"></i>
                        <h2 id="create-proj-title">Create New Fiction Project</h2>
                    </div>
                    <button
                        type="button"
                        class="close-btn"
                        onclick={onClose}
                        title="Close (Esc)"
                        aria-label="Close modal"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <p class="header-description">
                    Configure your manuscript metadata, destination directory, target goal, cover asset, and project README.
                </p>

                <!-- Navigation Tabs -->
                <div class="tabs-nav" role="tablist">
                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "general"}
                        role="tab"
                        aria-selected={activeTab === "general"}
                        onclick={() => (activeTab = "general")}
                    >
                        <i class="fa-solid fa-sliders"></i> General & Goal
                    </button>
                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "cover"}
                        role="tab"
                        aria-selected={activeTab === "cover"}
                        onclick={() => (activeTab = "cover")}
                    >
                        <i class="fa-solid fa-image"></i> Cover Asset
                        {#if coverImage}
                            <span class="tab-indicator" title="Cover selected">●</span>
                        {/if}
                    </button>
                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "readme"}
                        role="tab"
                        aria-selected={activeTab === "readme"}
                        onclick={() => (activeTab = "readme")}
                    >
                        <i class="fa-solid fa-book"></i> Initial README.md
                    </button>
                </div>
            </div>

            <!-- Body -->
            <div class="modal-body">
                <!-- TAB 1: General & Goal -->
                {#if activeTab === "general"}
                    <div class="tab-pane general-pane">
                        <div class="form-group">
                            <label for="create-proj-name">
                                Project Name <span class="required-star">*</span>
                            </label>
                            <input
                                id="create-proj-name"
                                type="text"
                                class="form-input"
                                value={name}
                                oninput={handleNameInput}
                                placeholder="e.g. The Whispering Tide"
                                required
                            />
                            <span class="field-hint">
                                The title of your story, book, or series project.
                            </span>
                        </div>

                        <!-- Save Destination Folder with Browse Button -->
                        <div class="form-group">
                            <label for="create-proj-path">
                                Destination Save Folder <span class="required-star">*</span>
                            </label>
                            <div class="path-input-group">
                                <input
                                    id="create-proj-path"
                                    type="text"
                                    class="form-input path-input"
                                    bind:value={folderPath}
                                    oninput={() => (isCustomPath = true)}
                                    placeholder="e.g. ~/FictionProjects/my-novel"
                                    required
                                />
                                <button
                                    type="button"
                                    class="browse-folder-btn"
                                    onclick={handleBrowseFolder}
                                    disabled={isSelectingFolder}
                                    title="Browse native file system"
                                >
                                    <i class="fa-solid fa-folder-open"></i>
                                    {isSelectingFolder ? "Selecting..." : "Browse..."}
                                </button>
                            </div>
                            <span class="field-hint">
                                Location where manuscript markdown files, <code>project.json</code>, and <code>.fictionclosure/</code> metadata will be stored.
                            </span>
                        </div>

                        <div class="form-row-two">
                            <div class="form-group">
                                <label for="create-proj-author">Author Name</label>
                                <input
                                    id="create-proj-author"
                                    type="text"
                                    class="form-input"
                                    bind:value={author}
                                    placeholder="e.g. Jane Doe"
                                />
                            </div>

                            <div class="form-group">
                                <label for="create-proj-genre">Genre</label>
                                <input
                                    id="create-proj-genre"
                                    type="text"
                                    class="form-input"
                                    bind:value={genre}
                                    list="create-genre-datalist"
                                    placeholder="e.g. Fantasy"
                                />
                                <datalist id="create-genre-datalist">
                                    {#each GENRE_SUGGESTIONS as g}
                                        <option value={g}></option>
                                    {/each}
                                </datalist>
                            </div>
                        </div>

                        <!-- Target Word Count -->
                        <div class="form-group">
                            <div class="label-with-presets">
                                <label for="create-proj-target">Target Word Count Goal</label>
                                <div class="preset-buttons">
                                    <button
                                        type="button"
                                        class="preset-btn"
                                        class:selected={targetWordCount === 20000}
                                        onclick={() => (targetWordCount = 20000)}
                                    >
                                        Novella (20k)
                                    </button>
                                    <button
                                        type="button"
                                        class="preset-btn"
                                        class:selected={targetWordCount === 50000}
                                        onclick={() => (targetWordCount = 50000)}
                                    >
                                        Standard (50k)
                                    </button>
                                    <button
                                        type="button"
                                        class="preset-btn"
                                        class:selected={targetWordCount === 80000}
                                        onclick={() => (targetWordCount = 80000)}
                                    >
                                        Novel (80k)
                                    </button>
                                    <button
                                        type="button"
                                        class="preset-btn"
                                        class:selected={targetWordCount === 120000}
                                        onclick={() => (targetWordCount = 120000)}
                                    >
                                        Epic (120k)
                                    </button>
                                </div>
                            </div>
                            <input
                                id="create-proj-target"
                                type="number"
                                class="form-input"
                                bind:value={targetWordCount}
                                min="1000"
                                step="1000"
                            />
                            <span class="field-hint">
                                Sets the total manuscript target word count and sizes your undo/redo history buffer.
                            </span>
                        </div>
                    </div>
                {/if}

                <!-- TAB 2: Cover Asset -->
                {#if activeTab === "cover"}
                    <div class="tab-pane cover-pane">
                        <div class="cover-format-banner">
                            <div class="banner-header">
                                <i class="fa-solid fa-circle-info"></i>
                                <strong>Supported Formats:</strong>
                            </div>
                            <div class="format-chips-grid">
                                {#each SUPPORTED_COVER_FORMAT_LABELS as label}
                                    <span class="format-chip">{label}</span>
                                {/each}
                            </div>
                            <p class="banner-note">
                                Supports standard web images, vector/lossless formats (APNG, AVIF, WebP, JXL), professional print files (TIFF), and graphics source masters (PSD, PSB, PDF, HEIC).
                            </p>
                        </div>

                        <!-- Active Cover Preview & Management -->
                        {#if coverImage}
                            <div class="active-cover-container">
                                <div class="cover-preview-card">
                                    {#if isCoverRenderable}
                                        <img
                                            src={coverImage}
                                            alt="Project cover preview"
                                            class="rendered-cover-img"
                                        />
                                    {:else}
                                        <div class="non-browser-preview-card">
                                            <i class="fa-solid fa-file-image large-file-icon"></i>
                                            <div class="format-badge-banner">
                                                {coverBadgeLabel || "High-Res Asset"}
                                            </div>
                                            {#if coverFileName}
                                                <span class="asset-filename">{coverFileName}</span>
                                            {/if}
                                            <span class="asset-hint">
                                                Master production file stored safely in <code>media/covers/</code>
                                            </span>
                                        </div>
                                    {/if}
                                </div>

                                <div class="cover-actions">
                                    <div class="cover-info-block">
                                        <h4>Current Cover Asset</h4>
                                        <p class="cover-type-tag">
                                            Format: <strong>{coverBadgeLabel}</strong>
                                        </p>
                                        <p class="cover-info-text">
                                            This asset will be copied into your project's <code>media/covers/</code> folder upon creation.
                                        </p>
                                    </div>

                                    <div class="action-buttons-group">
                                        <button
                                            type="button"
                                            class="change-cover-btn"
                                            onclick={() => fileInputEl?.click()}
                                        >
                                            <i class="fa-solid fa-arrows-rotate"></i> Replace File...
                                        </button>
                                        <button
                                            type="button"
                                            class="remove-cover-btn"
                                            onclick={handleRemoveCover}
                                        >
                                            <i class="fa-solid fa-trash-can"></i> Remove Cover
                                        </button>
                                    </div>
                                </div>
                            </div>
                        {:else}
                            <!-- Drag & Drop Zone -->
                            <div
                                class="dropzone"
                                class:dragging={isDragging}
                                ondragover={handleDragOver}
                                ondragleave={handleDragLeave}
                                ondrop={handleDrop}
                                role="button"
                                tabindex="0"
                                onclick={() => fileInputEl?.click()}
                                onkeydown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        fileInputEl?.click();
                                    }
                                }}
                            >
                                <i class="fa-solid fa-cloud-arrow-up drop-icon"></i>
                                <h3>Drop your cover image here</h3>
                                <p class="dropzone-sub">
                                    or <span class="highlight-link">browse your files</span>
                                </p>
                                <span class="dropzone-formats">
                                    JPG, PNG, WebP, AVIF, JXL, GIF, APNG, TIFF, HEIC, PSD, PSB, PDF
                                </span>
                            </div>
                        {/if}

                        <input
                            type="file"
                            bind:this={fileInputEl}
                            accept={SUPPORTED_COVER_ACCEPT}
                            onchange={handleFileInputChange}
                            class="hidden-file-input"
                            aria-hidden="true"
                        />
                    </div>
                {/if}

                <!-- TAB 3: README.md -->
                {#if activeTab === "readme"}
                    <div class="tab-pane readme-pane">
                        <div class="readme-toolbar">
                            <span class="readme-hint">
                                Markdown documentation stored at <code>README.md</code> in project root.
                            </span>
                            <div class="preview-toggle-btns">
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={!readmePreviewMode}
                                    onclick={() => (readmePreviewMode = false)}
                                >
                                    <i class="fa-solid fa-pen-to-square"></i> Markdown Editor
                                </button>
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={readmePreviewMode}
                                    onclick={() => (readmePreviewMode = true)}
                                >
                                    <i class="fa-solid fa-eye"></i> Rendered Preview
                                </button>
                            </div>
                        </div>

                        {#if readmePreviewMode}
                            <div class="readme-rendered-preview markdown-body">
                                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                                {@html renderedReadmeHtml}
                            </div>
                        {:else}
                            <textarea
                                class="readme-editor"
                                bind:value={readme}
                                rows="12"
                                placeholder="# My Novel&#10;&#10;Project notes and overview..."
                                spellcheck="false"
                            ></textarea>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Footer -->
            <div class="modal-footer">
                <span class="shortcut-legend">
                    <kbd>Ctrl+Enter</kbd> to create, <kbd>Esc</kbd> to cancel
                </span>
                <div class="footer-buttons">
                    <button
                        type="button"
                        class="cancel-btn"
                        onclick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        class="create-project-btn"
                        onclick={handleCreate}
                        disabled={!name.trim() || !folderPath.trim()}
                    >
                        <i class="fa-solid fa-plus"></i> Create Project
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .create-project-modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .create-project-modal-dialog {
        background-color: var(--bg-primary, #0d1117);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 12px;
        width: 90vw;
        max-width: 680px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
        overflow: hidden;
    }

    /* Header */
    .modal-header {
        padding: 18px 24px 0 24px;
        background-color: var(--bg-secondary, #161b22);
        border-bottom: 1px solid var(--border-subtle, #30363d);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .header-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .title-with-icon {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .header-icon {
        font-size: 18px;
        color: var(--accent-primary, #e69d45);
    }

    .header-title-row h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary, #f0f3f6);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted, #8b949e);
        font-size: 14px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.15s ease;
    }

    .close-btn:hover {
        color: var(--text-primary, #f0f3f6);
        background: var(--bg-hover, #21262d);
    }

    .header-description {
        margin: 0;
        font-size: 12px;
        color: var(--text-secondary, #9da7b3);
        line-height: 1.4;
    }

    /* Navigation Tabs */
    .tabs-nav {
        display: flex;
        gap: 4px;
        margin-top: 6px;
    }

    .tab-btn {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary, #9da7b3);
        font-size: 12px;
        font-weight: 500;
        padding: 8px 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
    }

    .tab-btn:hover {
        color: var(--text-primary, #f0f3f6);
    }

    .tab-btn.active {
        color: var(--accent-primary, #e69d45);
        border-bottom-color: var(--accent-primary, #e69d45);
        font-weight: 600;
    }

    .tab-indicator {
        font-size: 9px;
        color: var(--accent-primary, #e69d45);
    }

    /* Modal Body */
    .modal-body {
        padding: 20px 24px;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .tab-pane {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .form-row-two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary, #f0f3f6);
    }

    .required-star {
        color: #f85149;
    }

    .form-input {
        background-color: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 8px 12px;
        color: var(--text-primary, #f0f3f6);
        font-size: 13px;
        outline: none;
        transition: border-color 0.15s ease;
    }

    .form-input:focus {
        border-color: var(--accent-primary, #e69d45);
    }

    .field-hint {
        font-size: 11px;
        color: var(--text-muted, #6b7582);
    }

    .field-hint code {
        color: var(--accent-primary, #e69d45);
    }

    /* Path Input Group with Browse Button */
    .path-input-group {
        display: flex;
        gap: 8px;
    }

    .path-input {
        flex: 1;
        font-family: var(--font-editor, monospace);
        font-size: 12px;
    }

    .browse-folder-btn {
        background-color: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 0 14px;
        color: var(--text-primary, #f0f3f6);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        transition: all 0.15s ease;
    }

    .browse-folder-btn:hover:not(:disabled) {
        background-color: var(--bg-hover, #2d333b);
        border-color: var(--accent-primary, #e69d45);
        color: var(--accent-primary, #e69d45);
    }

    .browse-folder-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Preset Word Count Buttons */
    .label-with-presets {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-wrap: wrap;
    }

    .preset-buttons {
        display: flex;
        gap: 4px;
    }

    .preset-btn {
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 4px;
        padding: 2px 8px;
        font-size: 10px;
        color: var(--text-secondary, #9da7b3);
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .preset-btn:hover {
        color: var(--text-primary, #f0f3f6);
        border-color: var(--accent-primary, #e69d45);
    }

    .preset-btn.selected {
        background: var(--accent-subtle, rgba(230, 157, 69, 0.15));
        border-color: var(--accent-primary, #e69d45);
        color: var(--accent-primary, #e69d45);
        font-weight: 600;
    }

    /* Cover Tab Styles */
    .cover-format-banner {
        background-color: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 8px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .banner-header {
        font-size: 11px;
        color: var(--accent-primary, #e69d45);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .format-chips-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .format-chip {
        font-size: 9px;
        font-family: var(--font-editor, monospace);
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-subtle, #30363d);
        color: var(--text-secondary, #9da7b3);
        padding: 2px 5px;
        border-radius: 3px;
    }

    .banner-note {
        margin: 0;
        font-size: 10px;
        color: var(--text-muted, #6b7582);
    }

    .dropzone {
        border: 2px dashed var(--border-subtle, #30363d);
        border-radius: 8px;
        padding: 36px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        transition: all 0.15s ease;
        background-color: var(--bg-secondary, #161b22);
    }

    .dropzone:hover,
    .dropzone.dragging {
        border-color: var(--accent-primary, #e69d45);
        background-color: rgba(230, 157, 69, 0.05);
    }

    .drop-icon {
        font-size: 32px;
        color: var(--accent-primary, #e69d45);
        margin-bottom: 8px;
    }

    .dropzone h3 {
        margin: 0;
        font-size: 14px;
        color: var(--text-primary, #f0f3f6);
    }

    .dropzone-sub {
        margin: 4px 0 0 0;
        font-size: 12px;
        color: var(--text-secondary, #9da7b3);
    }

    .highlight-link {
        color: var(--accent-primary, #e69d45);
        text-decoration: underline;
    }

    .dropzone-formats {
        margin-top: 10px;
        font-size: 10px;
        color: var(--text-muted, #6b7582);
    }

    .hidden-file-input {
        display: none;
    }

    /* Active Cover Preview */
    .active-cover-container {
        display: flex;
        gap: 18px;
        align-items: flex-start;
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 8px;
        padding: 16px;
    }

    .cover-preview-card {
        width: 120px;
        height: 180px;
        flex-shrink: 0;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid var(--border-subtle, #30363d);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        background: var(--bg-tertiary, #21262d);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .rendered-cover-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .non-browser-preview-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 12px;
        text-align: center;
        height: 100%;
        gap: 6px;
    }

    .large-file-icon {
        font-size: 36px;
        color: var(--accent-primary, #e69d45);
    }

    .format-badge-banner {
        background: var(--accent-primary, #e69d45);
        color: #0d1117;
        font-size: 9px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
    }

    .asset-filename {
        font-size: 10px;
        color: var(--text-primary, #f0f3f6);
        word-break: break-all;
        font-family: var(--font-editor, monospace);
    }

    .asset-hint {
        font-size: 9px;
        color: var(--text-muted, #6b7582);
    }

    .asset-hint code {
        color: var(--accent-primary, #e69d45);
    }

    .cover-actions {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .cover-info-block h4 {
        margin: 0;
        font-size: 14px;
        color: var(--text-primary, #f0f3f6);
    }

    .cover-type-tag {
        margin: 4px 0;
        font-size: 12px;
        color: var(--text-secondary, #9da7b3);
    }

    .cover-info-text {
        margin: 0;
        font-size: 11px;
        color: var(--text-muted, #6b7582);
        line-height: 1.4;
    }

    .cover-info-text code {
        color: var(--accent-primary, #e69d45);
    }

    .action-buttons-group {
        display: flex;
        gap: 8px;
        margin-top: auto;
    }

    .change-cover-btn {
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 6px 12px;
        color: var(--text-primary, #f0f3f6);
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
    }

    .change-cover-btn:hover {
        background: var(--bg-hover, #2d333b);
        border-color: var(--accent-primary, #e69d45);
    }

    .remove-cover-btn {
        background: transparent;
        border: 1px solid rgba(248, 81, 73, 0.4);
        border-radius: 6px;
        padding: 6px 12px;
        color: #f85149;
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s ease;
    }

    .remove-cover-btn:hover {
        background: rgba(248, 81, 73, 0.15);
        border-color: #f85149;
    }

    /* README Tab */
    .readme-pane {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .readme-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .readme-hint {
        font-size: 11px;
        color: var(--text-muted, #6b7582);
    }

    .readme-hint code {
        color: var(--accent-primary, #e69d45);
    }

    .preview-toggle-btns {
        display: flex;
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 5px;
        overflow: hidden;
    }

    .mode-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary, #9da7b3);
        font-size: 11px;
        padding: 4px 10px;
        cursor: pointer;
    }

    .mode-btn.active {
        background: var(--accent-subtle, rgba(230, 157, 69, 0.15));
        color: var(--accent-primary, #e69d45);
        font-weight: 600;
    }

    .readme-editor {
        width: 100%;
        min-height: 220px;
        background-color: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 10px 12px;
        color: var(--text-primary, #f0f3f6);
        font-family: var(--font-editor, monospace);
        font-size: 13px;
        line-height: 1.5;
        outline: none;
        resize: vertical;
    }

    .readme-editor:focus {
        border-color: var(--accent-primary, #e69d45);
    }

    .readme-rendered-preview {
        background-color: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 16px 20px;
        min-height: 220px;
        max-height: 320px;
        overflow-y: auto;
        color: var(--text-primary, #f0f3f6);
        font-family: var(--font-prose, serif);
        line-height: 1.6;
    }

    /* Modal Footer */
    .modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid var(--border-subtle, #30363d);
        background-color: var(--bg-secondary, #161b22);
    }

    .shortcut-legend {
        font-size: 10px;
        color: var(--text-muted, #6b7582);
    }

    .shortcut-legend kbd {
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 3px;
        padding: 1px 4px;
        color: var(--text-secondary, #9da7b3);
    }

    .footer-buttons {
        display: flex;
        gap: 8px;
    }

    .cancel-btn {
        background: transparent;
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 6px 14px;
        color: var(--text-secondary, #9da7b3);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .cancel-btn:hover {
        background: var(--bg-hover, #21262d);
        color: var(--text-primary, #f0f3f6);
    }

    .create-project-btn {
        background: var(--accent-primary, #e69d45);
        color: #0d1117;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: 6px;
        padding: 6px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background-color 0.15s ease;
    }

    .create-project-btn:hover:not(:disabled) {
        background: var(--accent-hover, #f3ae5c);
    }

    .create-project-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
