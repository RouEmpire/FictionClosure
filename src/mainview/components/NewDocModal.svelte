<script lang="ts">
	import type { DocumentType, FictionDocument, ProjectFolder } from "../../shared/types";
	import { slugifyTitle } from "../../shared/domain/documentPaths";

	interface Props {
		isOpen: boolean;
		initialType?: DocumentType;
		initialMode?: "document" | "folder";
		initialParentFolderId?: string | null;
		folders?: ProjectFolder[];
		onClose: () => void;
		onCreate: (doc: FictionDocument) => void;
		onCreateFolder?: (folder: ProjectFolder) => void;
		existingCount: number;
	}

	let {
		isOpen,
		initialType = "manuscript",
		initialMode = "document",
		initialParentFolderId = null,
		folders = [],
		onClose,
		onCreate,
		onCreateFolder,
		existingCount,
	}: Props = $props();

	let createMode = $state<"document" | "folder">("document");
	let docType = $state<DocumentType>("manuscript");
	let title = $state("");
	let tagsInput = $state("");
	let parentFolderId = $state<string | null>(null);

	// Folder-specific fields
	let folderName = $state("");
	let folderNote = $state("");
	let folderTagsInput = $state("");
	let folderIcon = $state("fa-solid fa-folder");

	let inputEl: HTMLInputElement | null = $state(null);
	let folderInputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (isOpen) {
			createMode = initialMode;
			docType = initialType;
			parentFolderId = initialParentFolderId;

			if (docType === "manuscript") {
				title = `Chapter ${existingCount + 1}`;
			} else if (docType === "character") {
				title = "New Character";
			} else if (docType === "plot") {
				title = "New Plot Arc";
			} else if (docType === "world") {
				title = "New Lore Entry";
			} else {
				title = "New Note";
			}

			folderName = "New Folder";
			folderNote = "";
			folderTagsInput = "";
			folderIcon = "fa-solid fa-folder";
			tagsInput = "";

			setTimeout(() => {
				if (createMode === "folder") {
					folderInputEl?.focus();
					folderInputEl?.select();
				} else {
					inputEl?.focus();
					inputEl?.select();
				}
			}, 50);
		}
	});

	function handleSubmit() {
		if (createMode === "folder") {
			handleCreateFolder();
		} else {
			handleCreateDocument();
		}
	}

	function handleCreateDocument() {
		const trimmedTitle = title.trim();
		if (!trimmedTitle) return;

		const tags = tagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		let initialContent = "";
		if (docType === "manuscript") {
			initialContent = `# ${trimmedTitle}\n\nThe scene opens...\n`;
		} else if (docType === "character") {
			initialContent = `# ${trimmedTitle}\n\n## Overview\n\n## Appearance\n\n## Motivation & Goals\n\n## Relationships\n`;
		} else if (docType === "world") {
			initialContent = `# ${trimmedTitle}\n\n## Description\n\n## History\n\n## Rules & Significance\n`;
		} else if (docType === "plot") {
			initialContent = `# ${trimmedTitle}\n\n## Premise & Stakes\n\n## Inciting Incident\n\n## Rising Action & Climax\n\n## Resolution\n`;
		} else {
			initialContent = `# ${trimmedTitle}\n\n## Objective\n\n- [ ] Initial beat\n- [ ] Key reveal\n`;
		}

		// Calculate relativePath if inside a folder
		let relativePath: string | undefined = undefined;
		if (parentFolderId) {
			const parentFolder = folders.find((f) => f.id === parentFolderId);
			if (parentFolder) {
				const prefix = docType === "manuscript" ? `${String(existingCount + 1).padStart(2, "0")}_` : "";
				relativePath = `${parentFolder.relativePath}/${prefix}${slugifyTitle(trimmedTitle)}.md`;
			}
		}

		const newDoc: FictionDocument = {
			id: `doc-${Date.now()}`,
			title: trimmedTitle,
			type: docType,
			status: "draft",
			tags,
			summary: "",
			order: existingCount + 1,
			folderId: parentFolderId,
			relativePath,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			content: initialContent,
		};

		onCreate(newDoc);
		onClose();
	}

	function handleCreateFolder() {
		const trimmedName = folderName.trim();
		if (!trimmedName) return;

		const tags = folderTagsInput
			.split(",")
			.map((t) => t.trim())
			.filter(Boolean);

		const slug = slugifyTitle(trimmedName);
		let relPath = slug;

		if (parentFolderId) {
			const parent = folders.find((f) => f.id === parentFolderId);
			if (parent) {
				relPath = `${parent.relativePath}/${slug}`;
			}
		} else {
			// Place under canonical section folder matching docType
			const typePrefix = docType === "character" ? "characters" : docType === "plot" ? "plots" : docType === "world" ? "world" : docType === "manuscript" ? "manuscript" : "notes";
			relPath = `${typePrefix}/${slug}`;
		}

		const now = new Date().toISOString();
		const newFolder: ProjectFolder = {
			id: `folder-${Date.now()}`,
			name: trimmedName,
			type: docType,
			icon: folderIcon || "fa-solid fa-folder",
			tags,
			note: folderNote.trim(),
			parentId: parentFolderId,
			relativePath: relPath,
			createdAt: now,
			updatedAt: now,
		};

		onCreateFolder?.(newFolder);
		onClose();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		} else if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		role="presentation"
	>
		<div
			class="modal-box"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<div class="modal-header">
				<div class="modal-mode-tabs">
					<button
						type="button"
						class="mode-tab-btn"
						class:active={createMode === "document"}
						onclick={() => (createMode = "document")}
					>
						<i class="fa-solid fa-file-lines"></i> Document
					</button>
					<button
						type="button"
						class="mode-tab-btn"
						class:active={createMode === "folder"}
						onclick={() => (createMode = "folder")}
					>
						<i class="fa-solid fa-folder-plus"></i> Folder
					</button>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
			</div>

			<div class="modal-body">
				{#if createMode === "document"}
					<!-- Type Selector -->
					<div class="field-item">
						<label class="field-label" for="doc-type-radio-group">Document Type</label>
						<div id="doc-type-radio-group" class="type-selector-grid">
							<button
								type="button"
								class="type-choice-btn"
								class:active={docType === "manuscript"}
								onclick={() => {
									docType = "manuscript";
									title = `Chapter ${existingCount + 1}`;
								}}
							>
								<span class="type-choice-icon"><i class="fa-solid fa-book-open"></i></span>
								<span class="type-choice-label">Chapter</span>
							</button>

							<button
								type="button"
								class="type-choice-btn"
								class:active={docType === "character"}
								onclick={() => {
									docType = "character";
									title = "New Character";
								}}
							>
								<span class="type-choice-icon"><i class="fa-solid fa-user"></i></span>
								<span class="type-choice-label">Character</span>
							</button>

							<button
								type="button"
								class="type-choice-btn"
								class:active={docType === "plot"}
								onclick={() => {
									docType = "plot";
									title = "New Plot Arc";
								}}
							>
								<span class="type-choice-icon"><i class="fa-solid fa-chart-line"></i></span>
								<span class="type-choice-label">Plot / Arc</span>
							</button>

							<button
								type="button"
								class="type-choice-btn"
								class:active={docType === "world"}
								onclick={() => {
									docType = "world";
									title = "New Lore Entry";
								}}
							>
								<span class="type-choice-icon"><i class="fa-solid fa-map"></i></span>
								<span class="type-choice-label">World Lore</span>
							</button>

							<button
								type="button"
								class="type-choice-btn"
								class:active={docType === "note"}
								onclick={() => {
									docType = "note";
									title = "New Note";
								}}
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
				{:else}
					<!-- Folder Creation Mode -->
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
				{/if}
			</div>

			<div class="modal-footer">
				<button type="button" class="btn secondary" onclick={onClose}>Cancel</button>
				<button type="button" class="btn primary" onclick={handleSubmit}>
					{#if createMode === "folder"}
						<i class="fa-solid fa-folder-plus"></i> Create Folder
					{:else}
						<i class="fa-solid fa-plus"></i> Create Document
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(2px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-box {
		width: 100%;
		max-width: 480px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-bold);
		border-radius: 10px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.15s ease-out;
	}

	@keyframes scaleIn {
		from { transform: scale(0.96); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 18px;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.modal-mode-tabs {
		display: flex;
		background: var(--bg-secondary);
		padding: 2px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle);
		gap: 2px;
	}

	.mode-tab-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		padding: 5px 12px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: all 0.15s ease;
	}

	.mode-tab-btn:hover {
		color: var(--text-primary);
	}

	.mode-tab-btn.active {
		background: var(--bg-tertiary);
		color: var(--accent-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.modal-heading {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.textarea-note {
		resize: vertical;
		font-family: inherit;
		min-height: 64px;
	}

	.icon-picker-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.icon-preview {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		font-size: 16px;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 14px;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}

	.modal-body {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.field-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.type-selector-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.type-choice-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 10px 4px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.type-choice-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
		border-color: var(--border-bold);
	}

	.type-choice-btn.active {
		background: var(--accent-subtle);
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.type-choice-icon {
		font-size: 18px;
	}

	.type-choice-label {
		font-size: 11px;
		font-weight: 500;
	}

	.text-input {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 13px;
		outline: none;
	}

	.text-input:focus {
		border-color: var(--accent-primary);
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 12px 18px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.btn {
		padding: 7px 14px;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition: all 0.15s ease;
	}

	.btn.secondary {
		background: transparent;
		border-color: var(--border-subtle);
		color: var(--text-secondary);
	}

	.btn.secondary:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.btn.primary {
		background: var(--accent-primary);
		color: #000;
		font-weight: 600;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}
</style>
