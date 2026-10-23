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
    import type { FictionDocument } from "@shared/types";
    import ExportTab from "./ExportTab/ExportTab.svelte";

    interface Props {
        isOpen: boolean;
        project: ProjectInfo;
        documents?: FictionDocument[];
        onClose: () => void;
        onSaveSettings: (updated: {
            name: string;
            author: string;
            genre: string;
            targetWordCount: number;
            coverImage?: string;
            readme?: string;
        }) => void;
        onShowToast?: (msg: string) => void;
    }

    let {
        isOpen,
        project,
        documents = [],
        onClose,
        onSaveSettings,
        onShowToast,
    }: Props = $props();

    type TabType = "general" | "cover" | "readme" | "export";
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
                <button
                    type="button"
                    class="tab-btn"
                    class:active={activeTab === "export"}
                    onclick={() => (activeTab = "export")}
                    role="tab"
                    aria-selected={activeTab === "export"}
                >
                    <i class="fa-solid fa-file-export"></i> Export
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

                {#if activeTab === "export"}
                    <div class="tab-pane">
                        <ExportTab {project} {documents} {onShowToast} />
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

