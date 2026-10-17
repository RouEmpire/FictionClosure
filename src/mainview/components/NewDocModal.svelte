<script lang="ts">
	import type { DocumentType, FictionDocument } from "../types";

	interface Props {
		isOpen: boolean;
		initialType?: DocumentType;
		onClose: () => void;
		onCreate: (doc: FictionDocument) => void;
		existingCount: number;
	}

	let {
		isOpen,
		initialType = "manuscript",
		onClose,
		onCreate,
		existingCount,
	}: Props = $props();

	let docType = $state<DocumentType>("manuscript");
	let title = $state("");
	let tagsInput = $state("");
	let inputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (isOpen) {
			docType = initialType;
			if (docType === "manuscript") {
				title = `Chapter ${existingCount + 1}`;
			} else if (docType === "character") {
				title = "New Character";
			} else if (docType === "world") {
				title = "New Lore Entry";
			} else {
				title = "New Note";
			}
			tagsInput = "";
			setTimeout(() => {
				inputEl?.focus();
				inputEl?.select();
			}, 50);
		}
	});

	function handleSubmit() {
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
		} else {
			initialContent = `# ${trimmedTitle}\n\n## Objective\n\n- [ ] Initial beat\n- [ ] Key reveal\n`;
		}

		const newDoc: FictionDocument = {
			id: `doc-${Date.now()}`,
			title: trimmedTitle,
			type: docType,
			status: "draft",
			tags,
			summary: "",
			order: existingCount + 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			content: initialContent,
		};

		onCreate(newDoc);
		onClose();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		} else if (e.key === "Enter") {
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
				<h2 id="modal-title" class="modal-heading">Create New Document</h2>
				<button type="button" class="close-btn" onclick={onClose}>✕</button>
			</div>

			<div class="modal-body">
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
							<span class="type-choice-icon">📖</span>
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
							<span class="type-choice-icon">👤</span>
							<span class="type-choice-label">Character</span>
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
							<span class="type-choice-icon">🗺️</span>
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
							<span class="type-choice-icon">📝</span>
							<span class="type-choice-label">Outline/Note</span>
						</button>
					</div>
				</div>

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
			</div>

			<div class="modal-footer">
				<button type="button" class="btn secondary" onclick={onClose}>Cancel</button>
				<button type="button" class="btn primary" onclick={handleSubmit}>Create Document</button>
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
		padding: 14px 18px;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.modal-heading {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
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
