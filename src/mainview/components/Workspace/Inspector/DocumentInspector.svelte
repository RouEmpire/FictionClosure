<script lang="ts">
    import type {
        DocumentStatus,
        DocumentType,
        FictionDocument,
    } from "../../../../shared/types";
    import { extractWikilinks } from "../../../../shared/domain/markdown";
    import TagsSection from "./TagsSection.svelte";
    import MetadataFooter from "./MetadataFooter.svelte";

    interface Props {
        document: FictionDocument;
        allDocuments: FictionDocument[];
        onUpdateDocMeta?: (updates: Partial<FictionDocument>) => void;
        onNavigateToDocTitle?: (title: string) => void;
    }

    let {
        document,
        allDocuments,
        onUpdateDocMeta,
        onNavigateToDocTitle,
    }: Props = $props();

    // Extract outgoing links from document content
    const outgoingLinks = $derived(extractWikilinks(document.content || ""));

    // Find backlinks (documents mentioning this document's title)
    const backlinks = $derived.by(() => {
        if (!document.title || !Array.isArray(allDocuments)) return [];
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

    function handleAddTag(tag: string) {
        if (!document.tags.includes(tag)) {
            onUpdateDocMeta?.({
                tags: [...document.tags, tag],
            });
        }
    }

    function handleRemoveTag(tagToRemove: string) {
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
</script>

<div class="document-inspector-content">
    <!-- Properties -->
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
    <TagsSection
        title="Tags"
        tags={document.tags}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
    />

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
    <MetadataFooter
        id={document.id}
        createdAt={document.createdAt}
        updatedAt={document.updatedAt}
    />
</div>

<style>
    @import "./inspector.css";

    .document-inspector-content {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .tag-count {
        font-size: 10px;
        color: var(--text-muted);
        background: var(--bg-tertiary);
        padding: 1px 5px;
        border-radius: 10px;
    }

    .link-list {
        list-style: none;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin: 0;
    }
</style>
