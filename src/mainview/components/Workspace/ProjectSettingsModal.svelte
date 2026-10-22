<script lang="ts">
    import type { ProjectInfo } from "@shared/types";
    import {
        SUPPORTED_COVER_ACCEPT,
        SUPPORTED_COVER_FORMAT_LABELS,
        isSupportedCoverFile,
        getCoverFormatLabel,
        canRenderBrowserPreview,
    } from "@shared/domain/coverSupport";
    import { renderMarkdown } from "@shared/domain/markdown";

    interface Props {
        isOpen: boolean;
        project: ProjectInfo;
        onClose: () => void;
        onSaveSettings: (updated: {
            name: string;
            author: string;
            genre: string;
            targetWordCount: number;
            coverImage?: string;
            readme?: string;
        }) => void;
    }

    let { isOpen, project, onClose, onSaveSettings }: Props = $props();

    type TabType = "general" | "cover" | "readme";
    let activeTab = $state<TabType>("general");

    // Form fields
    let name = $state("");
    let author = $state("");
    let genre = $state("");
    let targetWordCount = $state(50000);
    let coverImage = $state<string | undefined>(undefined);
    let readme = $state("");

    // UI state
    let isDragging = $state(false);
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
            name = project.name || "Untitled Project";
            author = project.author || "";
            genre = project.genre || "Fiction";
            targetWordCount = project.targetWordCount || 50000;
            coverImage = project.coverImage;
            readme = project.readme || `# ${project.name}\n\nProject overview and world notes.\n`;
            activeTab = "general";
            readmePreviewMode = false;
        }
    });

    const isCoverRenderable = $derived(
        coverImage ? canRenderBrowserPreview(coverImage) : false,
    );
    const coverBadgeLabel = $derived(
        coverImage ? getCoverFormatLabel(coverImage) : "",
    );
    const renderedReadmeHtml = $derived(renderMarkdown(readme));

    function handleFileSelected(file: File) {
        if (!isSupportedCoverFile(file.name)) {
            alert(
                `Unsupported cover format. Please use one of: ${SUPPORTED_COVER_FORMAT_LABELS.join(", ")}`,
            );
            return;
        }

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
    }

    function handleSelectExistingCover(cov: string) {
        coverImage = cov;
    }

    function handleSave() {
        if (!name.trim()) {
            alert("Project name cannot be empty.");
            return;
        }

        onSaveSettings({
            name: name.trim(),
            author: author.trim(),
            genre: genre.trim() || "Fiction",
            targetWordCount: Math.max(1000, Number(targetWordCount) || 50000),
            coverImage,
            readme,
        });
        onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            onClose();
        }
    }
</script>

<svelte:window onkeydown={isOpen ? handleKeyDown : undefined} />

{#if isOpen}
    <div
        class="modal-backdrop"
        role="presentation"
        onclick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
    >
        <div
            class="project-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-settings-title"
        >
            <!-- Modal Header -->
            <div class="modal-header">
                <div class="title-row">
                    <span class="header-icon"><i class="fa-solid fa-sliders"></i></span>
                    <h2 id="project-settings-title">Project Settings</h2>
                </div>
                <button
                    type="button"
                    class="close-btn"
                    onclick={onClose}
                    aria-label="Close dialog"
                >
                    ✕
                </button>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-nav" role="tablist">
                <button
                    type="button"
                    class="tab-btn"
                    class:active={activeTab === "general"}
                    onclick={() => (activeTab = "general")}
                    role="tab"
                    aria-selected={activeTab === "general"}
                >
                    <i class="fa-solid fa-book"></i> General
                </button>
                <button
                    type="button"
                    class="tab-btn"
                    class:active={activeTab === "cover"}
                    onclick={() => (activeTab = "cover")}
                    role="tab"
                    aria-selected={activeTab === "cover"}
                >
                    <i class="fa-solid fa-image"></i> Covers
                    {#if coverImage}
                        <span class="cover-dot" title="Cover configured"></span>
                    {/if}
                </button>
                <button
                    type="button"
                    class="tab-btn"
                    class:active={activeTab === "readme"}
                    onclick={() => (activeTab = "readme")}
                    role="tab"
                    aria-selected={activeTab === "readme"}
                >
                    <i class="fa-solid fa-file-lines"></i> README.md
                </button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
                {#if activeTab === "general"}
                    <div class="tab-pane">
                        <div class="form-group">
                            <label for="ps-name">Project Name</label>
                            <input
                                id="ps-name"
                                type="text"
                                class="form-input"
                                bind:value={name}
                                placeholder="Enter novel or story title..."
                            />
                        </div>

                        <div class="form-row">
                            <div class="form-group flex-1">
                                <label for="ps-author">Author Name</label>
                                <input
                                    id="ps-author"
                                    type="text"
                                    class="form-input"
                                    bind:value={author}
                                    placeholder="Author name or pen name..."
                                />
                            </div>

                            <div class="form-group flex-1">
                                <label for="ps-genre">Genre</label>
                                <div class="genre-input-wrap">
                                    <input
                                        id="ps-genre"
                                        type="text"
                                        class="form-input"
                                        bind:value={genre}
                                        placeholder="Fiction genre..."
                                        list="genre-list"
                                    />
                                    <datalist id="genre-list">
                                        {#each GENRE_SUGGESTIONS as g}
                                            <option value={g}></option>
                                        {/each}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="label-with-hint">
                                <label for="ps-word-target">Target Word Count</label>
                                <span class="hint-val">{(Number(targetWordCount) || 0).toLocaleString()} words</span>
                            </div>
                            <input
                                id="ps-word-target"
                                type="number"
                                min="1000"
                                max="1000000"
                                step="1000"
                                class="form-input"
                                bind:value={targetWordCount}
                            />
                            <div class="target-presets">
                                <button type="button" class="preset-btn" onclick={() => (targetWordCount = 30000)}>Novella (30k)</button>
                                <button type="button" class="preset-btn" onclick={() => (targetWordCount = 50000)}>Standard (50k)</button>
                                <button type="button" class="preset-btn" onclick={() => (targetWordCount = 80000)}>Novel (80k)</button>
                                <button type="button" class="preset-btn" onclick={() => (targetWordCount = 120000)}>Epic (120k)</button>
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "cover"}
                    <div class="tab-pane">
                        <div class="supported-formats-banner">
                            <span class="banner-title"><i class="fa-solid fa-circle-check"></i> Supported Cover Formats</span>
                            <div class="format-chips">
                                {#each SUPPORTED_COVER_FORMAT_LABELS as fmt}
                                    <span class="format-chip">{fmt}</span>
                                {/each}
                            </div>
                        </div>

                        <div class="cover-section-grid">
                            <!-- Left: Upload & Drop Area -->
                            <div
                                class="cover-dropzone"
                                class:dragging={isDragging}
                                ondragover={handleDragOver}
                                ondragleave={handleDragLeave}
                                ondrop={handleDrop}
                                role="region"
                                aria-label="Cover file dropzone"
                            >
                                <input
                                    type="file"
                                    accept={SUPPORTED_COVER_ACCEPT}
                                    class="hidden-file-input"
                                    bind:this={fileInputEl}
                                    onchange={handleFileInputChange}
                                />
                                <div class="dropzone-content">
                                    <span class="drop-icon"><i class="fa-solid fa-cloud-arrow-up"></i></span>
                                    <p class="drop-prompt">Drag & drop cover file here</p>
                                    <span class="drop-sub">or</span>
                                    <button
                                        type="button"
                                        class="browse-btn"
                                        onclick={() => fileInputEl?.click()}
                                    >
                                        Choose Cover File
                                    </button>
                                    <span class="ext-note">
                                        .jpg, .jpeg, .jxl, .png, .avif, .webp, .gif, TIFF, HEIC, PSD, PSB, PDF, APNG
                                    </span>
                                </div>
                            </div>

                            <!-- Right: Current Cover Preview -->
                            <div class="cover-preview-card">
                                <span class="preview-title">Current Cover</span>
                                {#if coverImage}
                                    <div class="cover-display-box">
                                        {#if isCoverRenderable}
                                            <img
                                                src={coverImage}
                                                alt="Project Cover Preview"
                                                class="cover-img-preview"
                                            />
                                        {:else}
                                            <!-- Non-browser renderable formats (PSD, PSB, TIFF, HEIC, PDF, JXL) -->
                                            <div class="artwork-file-badge">
                                                <span class="doc-icon"><i class="fa-solid fa-file-image"></i></span>
                                                <span class="format-badge-large">{coverBadgeLabel}</span>
                                                <span class="badge-sub">High-Resolution Production Asset</span>
                                            </div>
                                        {/if}
                                        <div class="cover-meta-bar">
                                            <span class="active-badge">{coverBadgeLabel}</span>
                                            <button
                                                type="button"
                                                class="remove-cover-btn"
                                                onclick={handleRemoveCover}
                                                title="Remove cover"
                                            >
                                                <i class="fa-solid fa-trash-can"></i> Remove
                                            </button>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="empty-cover-box">
                                        <span class="empty-cover-icon"><i class="fa-solid fa-book-open"></i></span>
                                        <p>No cover image set</p>
                                        <span class="empty-sub">Add a cover image to personalize your novel workspace</span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Previous Project Covers if Available -->
                        {#if project.covers && project.covers.length > 0}
                            <div class="existing-covers-gallery">
                                <span class="gallery-title">Covers in Project (media/covers/)</span>
                                <div class="gallery-row">
                                    {#each project.covers as cov}
                                        <button
                                            type="button"
                                            class="gallery-item-btn"
                                            class:active={coverImage === cov}
                                            onclick={() => handleSelectExistingCover(cov)}
                                            title={cov}
                                        >
                                            <span class="gallery-label">{cov.split("/").pop()}</span>
                                            <span class="gallery-ext">{getCoverFormatLabel(cov)}</span>
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else if activeTab === "readme"}
                    <div class="tab-pane readme-pane">
                        <div class="readme-toolbar">
                            <span class="readme-hint">
                                <i class="fa-brands fa-markdown"></i> Edit root <code>README.md</code> for this fiction project
                            </span>
                            <div class="preview-toggle-btns">
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={!readmePreviewMode}
                                    onclick={() => (readmePreviewMode = false)}
                                >
                                    Edit Markdown
                                </button>
                                <button
                                    type="button"
                                    class="mode-btn"
                                    class:active={readmePreviewMode}
                                    onclick={() => (readmePreviewMode = true)}
                                >
                                    Preview
                                </button>
                            </div>
                        </div>

                        {#if readmePreviewMode}
                            <div class="readme-rendered-preview">
                                {@html renderedReadmeHtml}
                            </div>
                        {:else}
                            <textarea
                                class="readme-editor"
                                bind:value={readme}
                                placeholder="Enter project description and world notes in Markdown..."
                                rows="12"
                                aria-label="Project README.md markdown content"
                            ></textarea>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <button type="button" class="cancel-btn" onclick={onClose}>
                    Cancel
                </button>
                <button type="button" class="save-settings-btn" onclick={handleSave}>
                    Save Settings
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1050;
        backdrop-filter: blur(2px);
    }

    .project-settings-modal {
        background-color: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 10px;
        width: 680px;
        max-width: 95vw;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-subtle, #30363d);
        background-color: var(--bg-tertiary, #1f242c);
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .header-icon {
        color: var(--accent-primary, #e69d45);
        font-size: 14px;
    }

    .modal-header h2 {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary, #f0f3f6);
        margin: 0;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted, #6b7582);
        font-size: 14px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
    }

    .close-btn:hover {
        color: var(--text-primary, #f0f3f6);
    }

    /* Tabs */
    .tab-nav {
        display: flex;
        background-color: var(--bg-secondary, #161b22);
        border-bottom: 1px solid var(--border-subtle, #30363d);
        padding: 0 14px;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary, #9da7b3);
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .tab-btn:hover {
        color: var(--text-primary, #f0f3f6);
    }

    .tab-btn.active {
        color: var(--accent-primary, #e69d45);
        border-bottom-color: var(--accent-primary, #e69d45);
    }

    .cover-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--accent-secondary, #58a6ff);
    }

    /* Body */
    .modal-body {
        padding: 18px;
        overflow-y: auto;
        flex: 1;
        background-color: var(--bg-primary, #0d1117);
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

    .form-row {
        display: flex;
        gap: 12px;
    }

    .flex-1 {
        flex: 1;
    }

    label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary, #9da7b3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .label-with-hint {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .hint-val {
        font-size: 12px;
        color: var(--accent-primary, #e69d45);
        font-family: var(--font-editor, monospace);
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

    .target-presets {
        display: flex;
        gap: 6px;
        margin-top: 4px;
    }

    .preset-btn {
        background: var(--bg-tertiary, #1f242c);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 4px;
        padding: 4px 8px;
        color: var(--text-secondary, #9da7b3);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .preset-btn:hover {
        background: var(--bg-hover, #262c36);
        color: var(--text-primary, #f0f3f6);
    }

    /* Cover Tab Styles */
    .supported-formats-banner {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .banner-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--accent-secondary, #58a6ff);
        display: flex;
        align-items: center;
        gap: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .format-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .format-chip {
        font-size: 10px;
        font-family: var(--font-editor, monospace);
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
        color: var(--accent-secondary, #58a6ff);
        padding: 2px 6px;
        border-radius: 3px;
    }

    .cover-section-grid {
        display: grid;
        grid-template-columns: 1fr 240px;
        gap: 14px;
    }

    .cover-dropzone {
        border: 2px dashed var(--border-subtle, #30363d);
        border-radius: 8px;
        background: var(--bg-secondary, #161b22);
        padding: 24px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: all 0.2s ease;
    }

    .cover-dropzone.dragging {
        border-color: var(--accent-secondary, #58a6ff);
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
    }

    .hidden-file-input {
        display: none;
    }

    .dropzone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .drop-icon {
        font-size: 28px;
        color: var(--accent-secondary, #58a6ff);
    }

    .drop-prompt {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary, #f0f3f6);
        margin: 0;
    }

    .drop-sub {
        font-size: 11px;
        color: var(--text-muted, #6b7582);
    }

    .browse-btn {
        background: var(--accent-secondary, #58a6ff);
        color: #0d1117;
        font-weight: 600;
        font-size: 12px;
        border: none;
        border-radius: 5px;
        padding: 6px 14px;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .browse-btn:hover {
        background: var(--accent-secondary-hover, #79b8ff);
    }

    .ext-note {
        font-size: 10px;
        color: var(--text-muted, #6b7582);
        margin-top: 4px;
        line-height: 1.3;
    }

    .cover-preview-card {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .preview-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #9da7b3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        align-self: flex-start;
    }

    .cover-display-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    .cover-img-preview {
        max-width: 100%;
        max-height: 220px;
        border-radius: 4px;
        object-fit: contain;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    .artwork-file-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary, #1f242c);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 24px 16px;
        width: 100%;
        gap: 6px;
    }

    .doc-icon {
        font-size: 32px;
        color: var(--accent-secondary, #58a6ff);
    }

    .format-badge-large {
        font-size: 16px;
        font-weight: 700;
        font-family: var(--font-editor, monospace);
        color: var(--text-primary, #f0f3f6);
    }

    .badge-sub {
        font-size: 10px;
        color: var(--text-muted, #6b7582);
        text-align: center;
    }

    .cover-meta-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .active-badge {
        font-size: 10px;
        font-family: var(--font-editor, monospace);
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
        color: var(--accent-secondary, #58a6ff);
        padding: 2px 6px;
        border-radius: 3px;
        font-weight: 600;
    }

    .remove-cover-btn {
        background: transparent;
        border: none;
        color: var(--danger-color, #f85149);
        font-size: 11px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .remove-cover-btn:hover {
        background: rgba(248, 81, 73, 0.15);
    }

    .empty-cover-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 180px;
        width: 100%;
        gap: 6px;
        text-align: center;
        color: var(--text-muted, #6b7582);
    }

    .empty-cover-icon {
        font-size: 32px;
        opacity: 0.5;
    }

    .empty-cover-box p {
        font-size: 12px;
        font-weight: 500;
        margin: 0;
        color: var(--text-secondary, #9da7b3);
    }

    .empty-sub {
        font-size: 10px;
        line-height: 1.3;
        max-width: 160px;
    }

    .existing-covers-gallery {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 6px;
    }

    .gallery-title {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-secondary, #9da7b3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .gallery-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
    }

    .gallery-item-btn {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 5px;
        padding: 6px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
    }

    .gallery-item-btn:hover {
        border-color: var(--accent-secondary, #58a6ff);
    }

    .gallery-item-btn.active {
        border-color: var(--accent-secondary, #58a6ff);
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
    }

    .gallery-label {
        font-size: 11px;
        color: var(--text-primary, #f0f3f6);
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .gallery-ext {
        font-size: 9px;
        font-family: var(--font-editor, monospace);
        color: var(--accent-secondary, #58a6ff);
        font-weight: 600;
    }

    /* README Tab Styles */
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
        min-height: 240px;
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
        min-height: 240px;
        max-height: 360px;
        overflow-y: auto;
        color: var(--text-primary, #f0f3f6);
        font-family: var(--font-prose, serif);
        line-height: 1.6;
    }

    /* Modal Footer */
    .modal-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        padding: 12px 18px;
        border-top: 1px solid var(--border-subtle, #30363d);
        background-color: var(--bg-tertiary, #1f242c);
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
        background: var(--bg-hover, #262c36);
        color: var(--text-primary, #f0f3f6);
    }

    .save-settings-btn {
        background: var(--accent-primary, #e69d45);
        color: #0d1117;
        font-size: 12px;
        font-weight: 600;
        border: none;
        border-radius: 6px;
        padding: 6px 16px;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .save-settings-btn:hover {
        background: var(--accent-hover, #f3ae5c);
    }
</style>
