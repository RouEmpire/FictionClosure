<script lang="ts">
	import type { DocumentStatus, DocumentType, FictionDocument } from "../../shared/types";
	import { extractWikilinks } from "../../shared/domain/markdown";

	interface Props {
		document: FictionDocument;
		allDocuments?: FictionDocument[];
		onUpdateDocMeta: (updates: Partial<FictionDocument>) => void;
		onNavigateToDocTitle: (title: string) => void;
		onClose: () => void;
	}

	let {
		document,
		allDocuments = [],
		onUpdateDocMeta,
		onNavigateToDocTitle,
		onClose,
	}: Props = $props();

	let newTagInput = $state("");

	// Extract outgoing links from content
	const outgoingLinks = $derived(extractWikilinks(document.content || ""));

	// Find backlinks (documents mentioning this document's title)
	const backlinks = $derived.by(() => {
		if (!document?.title || !Array.isArray(allDocuments)) return [];
		const docTitle = document.title.toLowerCase();
		return allDocuments.filter(
			(d) =>
				d &&
				d.id !== document.id &&
				extractWikilinks(d.content || "").some((link) => link.toLowerCase() === docTitle),
		);
	});

	function handleAddTag() {
		const tag = newTagInput.trim();
		if (tag && !document.tags.includes(tag)) {
			onUpdateDocMeta({
				tags: [...document.tags, tag],
			});
			newTagInput = "";
		}
	}

	function handleRemoveTag(tagToRemove: string) {
		onUpdateDocMeta({
			tags: document.tags.filter((t) => t !== tagToRemove),
		});
	}

	function handleStatusChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onUpdateDocMeta({ status: target.value as DocumentStatus });
	}

	function handleTypeChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onUpdateDocMeta({ type: target.value as DocumentType });
	}

	function handlePovChange(e: Event) {
		const target = e.target as HTMLInputElement;
		onUpdateDocMeta({ pov: target.value });
	}

	function handleSummaryChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		onUpdateDocMeta({ summary: target.value });
	}
</script>

<aside class="inspector">
	<div class="inspector-header">
		<span class="inspector-title">Document Inspector</span>
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
		<!-- Properties Section -->
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

			<div class="field-row">
				<label class="field-label" for="doc-pov-input">POV</label>
				<input
					id="doc-pov-input"
					type="text"
					class="field-input"
					placeholder="Narrative POV"
					value={document.pov ?? ""}
					oninput={handlePovChange}
				/>
			</div>
		</div>

		<!-- Synopsis / Summary -->
		<div class="inspector-group">
			<label class="group-title" for="doc-summary-textarea">Synopsis</label>
			<textarea
				id="doc-summary-textarea"
				class="summary-textarea"
				placeholder="Brief scene or chapter synopsis..."
				value={document.summary ?? ""}
				oninput={handleSummaryChange}
				rows="3"
			></textarea>
		</div>

		<!-- Tags Section -->
		<div class="inspector-group">
			<div class="group-title">Tags & Labels</div>
			<div class="tag-cloud">
				{#each document.tags as tag (tag)}
					<span class="tag-chip">
						{tag}
						<button
							type="button"
							class="tag-del-btn"
							onclick={() => handleRemoveTag(tag)}
							title="Remove {tag}"
						>
							<i class="fa-solid fa-xmark"></i>
						</button>
					</span>
				{/each}
			</div>
			<div class="add-tag-box">
				<input
					type="text"
					placeholder="New tag..."
					bind:value={newTagInput}
					onkeydown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleAddTag();
						}
					}}
				/>
				<button type="button" class="add-tag-btn" onclick={handleAddTag}>Add</button>
			</div>
		</div>

		<!-- Outgoing References -->
		<div class="inspector-group">
			<div class="group-title">
				Outgoing Links ({outgoingLinks.length})
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
								onclick={() => onNavigateToDocTitle(link)}
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
			<div class="group-title">
				Mentioned In ({backlinks.length})
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
								onclick={() => onNavigateToDocTitle(backlink.title)}
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

	.group-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
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
		width: 50px;
	}

	.field-select, .field-input {
		flex: 1;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		outline: none;
	}

	.field-select:focus, .field-input:focus {
		border-color: var(--accent-primary);
	}

	.summary-textarea {
		width: 100%;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 6px 8px;
		border-radius: 4px;
		font-size: 12px;
		line-height: 1.4;
		outline: none;
		resize: vertical;
		font-family: inherit;
	}

	.summary-textarea:focus {
		border-color: var(--accent-primary);
	}

	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		background: var(--bg-hover);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
	}

	.tag-del-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 10px;
		padding: 0;
	}

	.tag-del-btn:hover {
		color: var(--danger-color);
	}

	.add-tag-box {
		display: flex;
		gap: 4px;
		margin-top: 4px;
	}

	.add-tag-box input {
		flex: 1;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 3px 6px;
		border-radius: 4px;
		font-size: 11px;
		outline: none;
	}

	.add-tag-btn {
		background: var(--bg-hover);
		border: 1px solid var(--border-subtle);
		color: var(--text-secondary);
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		cursor: pointer;
	}

	.add-tag-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-bold);
	}

	.empty-note {
		font-size: 11px;
		color: var(--text-muted);
		font-style: italic;
	}

	.link-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 3px;
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
		font-size: 10px;
		color: var(--text-muted);
		font-family: var(--font-editor);
	}
</style>
