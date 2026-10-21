<script lang="ts">
	import type { FictionDocument, ViewMode } from "../../shared/types";

	interface Props {
		isOpen: boolean;
		documents: FictionDocument[];
		onClose: () => void;
		onSelectDoc: (id: string) => void;
		onNewDoc: (type?: "manuscript" | "character" | "world" | "note") => void;
		onSetViewMode: (mode: ViewMode) => void;
		onSave: () => void;
		onChangeFolder?: () => void;
		onOpenSettings?: () => void;
	}

	let {
		isOpen,
		documents,
		onClose,
		onSelectDoc,
		onNewDoc,
		onSetViewMode,
		onSave,
		onChangeFolder,
		onOpenSettings,
	}: Props = $props();

	let searchQuery = $state("");
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement | null = $state(null);

	// Focus input when opened
	$effect(() => {
		if (isOpen) {
			searchQuery = "";
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
			}, 50);
		}
	});

	interface PaletteAction {
		id: string;
		type: "action";
		title: string;
		subtitle: string;
		icon: string;
		execute: () => void;
	}

	interface PaletteDoc {
		id: string;
		type: "document";
		doc: FictionDocument;
	}

	type PaletteItem = PaletteAction | PaletteDoc;

	const staticActions: PaletteAction[] = [
		{
			id: "act-new-ch",
			type: "action",
			title: "Create New Chapter",
			subtitle: "Add a new manuscript chapter",
			icon: "fa-solid fa-book-open",
			execute: () => onNewDoc("manuscript"),
		},
		{
			id: "act-new-char",
			type: "action",
			title: "Create Character Sheet",
			subtitle: "Add a new character profile",
			icon: "fa-solid fa-user",
			execute: () => onNewDoc("character"),
		},
		{
			id: "act-new-world",
			type: "action",
			title: "Create Worldbuilding Note",
			subtitle: "Add setting, magic, or lore entry",
			icon: "fa-solid fa-map",
			execute: () => onNewDoc("world"),
		},
		{
			id: "act-save",
			type: "action",
			title: "Save Project",
			subtitle: "Commit changes to disk (Ctrl+S)",
			icon: "fa-solid fa-floppy-disk",
			execute: () => onSave(),
		},
		{
			id: "act-change-folder",
			type: "action",
			title: "Change Project Save Folder...",
			subtitle: "Select where on disk to store project Markdown files",
			icon: "fa-solid fa-folder-open",
			execute: () => onChangeFolder?.(),
		},
		{
			id: "act-settings",
			type: "action",
			title: "Preferences & Settings",
			subtitle: "Customize editor font family and typography (Ctrl+P)",
			icon: "fa-solid fa-gear",
			execute: () => onOpenSettings?.(),
		},
		{
			id: "act-split",
			type: "action",
			title: "View: Split Mode",
			subtitle: "Editor and live preview side-by-side",
			icon: "fa-solid fa-table-columns",
			execute: () => onSetViewMode("split"),
		},
		{
			id: "act-edit",
			type: "action",
			title: "View: Editor Only",
			subtitle: "Distraction-free markdown writing",
			icon: "fa-solid fa-pen-to-square",
			execute: () => onSetViewMode("editor"),
		},
		{
			id: "act-read",
			type: "action",
			title: "View: Preview Only",
			subtitle: "Clean formatted reading mode",
			icon: "fa-solid fa-eye",
			execute: () => onSetViewMode("preview"),
		},
	];

	const filteredItems = $derived.by<PaletteItem[]>(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) {
			// Show documents first, then actions
			const docs: PaletteItem[] = documents.map((d) => ({ id: d.id, type: "document", doc: d }));
			return [...docs, ...staticActions];
		}

		const matchedDocs: PaletteItem[] = documents
			.filter(
				(d) =>
					d.title.toLowerCase().includes(q) ||
					d.tags.some((t) => t.toLowerCase().includes(q)) ||
					d.content.toLowerCase().includes(q),
			)
			.map((d) => ({ id: d.id, type: "document", doc: d }));

		const matchedActions: PaletteItem[] = staticActions.filter(
			(a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q),
		);

		return [...matchedDocs, ...matchedActions];
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex = (selectedIndex + 1) % filteredItems.length;
			}
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
			}
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			const selected = filteredItems[selectedIndex];
			if (selected) {
				selectItem(selected);
			}
		}
	}

	function selectItem(item: PaletteItem) {
		if (item.type === "document") {
			onSelectDoc(item.doc.id);
		} else {
			item.execute();
		}
		onClose();
	}
</script>

{#if isOpen}
	<div
		class="palette-overlay"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		role="presentation"
	>
		<div class="palette-modal" role="dialog" aria-modal="true" aria-label="Command Palette">
			<div class="palette-input-box">
				<span class="palette-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
				<input
					bind:this={inputEl}
					type="text"
					placeholder="Type a command or jump to document..."
					bind:value={searchQuery}
					onkeydown={handleKeyDown}
					aria-label="Search documents and commands"
				/>
				<kbd class="esc-kbd">Esc</kbd>
			</div>

			<div class="palette-list" role="listbox">
				{#if filteredItems.length === 0}
					<div class="palette-empty">No matching documents or actions</div>
				{:else}
					{#each filteredItems as item, idx (item.id)}
						{@const isSelected = idx === selectedIndex}
						<button
							type="button"
							class="palette-item"
							class:selected={isSelected}
							onclick={() => selectItem(item)}
							onmouseenter={() => (selectedIndex = idx)}
							role="option"
							aria-selected={isSelected}
						>
							{#if item.type === "document"}
								<span class="item-icon">
									{#if item.doc.type === "manuscript"}<i class="fa-solid fa-book-open"></i>
									{:else if item.doc.type === "character"}<i class="fa-solid fa-user"></i>
									{:else if item.doc.type === "plot"}<i class="fa-solid fa-chart-line"></i>
									{:else if item.doc.type === "world"}<i class="fa-solid fa-map"></i>
									{:else}<i class="fa-solid fa-file-lines"></i>{/if}
								</span>
								<div class="item-details">
									<div class="item-title-row">
										<span class="item-title">{item.doc.title}</span>
										<span class="type-pill pill-{item.doc.type}">{item.doc.type}</span>
									</div>
									<div class="item-snippet">
										{item.doc.summary || item.doc.content.slice(0, 90).replace(/^[#\s]+/, "")}
									</div>
								</div>
							{:else}
								<span class="item-icon"><i class={item.icon}></i></span>
								<div class="item-details">
									<div class="item-title-row">
										<span class="item-title">{item.title}</span>
										<span class="action-pill">Action</span>
									</div>
									<div class="item-snippet">{item.subtitle}</div>
								</div>
							{/if}
						</button>
					{/each}
				{/if}
			</div>

			<div class="palette-footer">
				<span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
				<span><kbd>↵</kbd> to select</span>
				<span><kbd>Esc</kbd> to dismiss</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.palette-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		z-index: 999;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 10vh;
	}

	.palette-modal {
		width: 100%;
		max-width: 600px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-bold);
		border-radius: 10px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.15s ease-out;
	}

	@keyframes scaleIn {
		from { transform: scale(0.97); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.palette-input-box {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-subtle);
		gap: 10px;
		background: var(--bg-tertiary);
	}

	.palette-icon {
		font-size: 16px;
		color: var(--text-muted);
	}

	.palette-input-box input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 15px;
	}

	.palette-input-box input::placeholder {
		color: var(--text-muted);
	}

	.esc-kbd {
		font-size: 11px;
	}

	.palette-list {
		max-height: 380px;
		overflow-y: auto;
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.palette-empty {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
		font-size: 13px;
	}

	.palette-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.1s ease;
		color: inherit;
		width: 100%;
	}

	.palette-item.selected {
		background: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.item-icon {
		font-size: 18px;
		flex-shrink: 0;
	}

	.item-details {
		flex: 1;
		overflow: hidden;
	}

	.item-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.item-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.palette-item.selected .item-title {
		color: var(--accent-hover);
	}

	.item-snippet {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}

	.type-pill, .action-pill {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 1px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.pill-manuscript { background: rgba(88, 166, 255, 0.15); color: #58a6ff; }
	.pill-character { background: rgba(210, 153, 34, 0.15); color: #d29922; }
	.pill-world { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
	.pill-note { background: rgba(188, 140, 255, 0.15); color: #bc8cff; }
	.action-pill { background: var(--bg-tertiary); color: var(--text-secondary); }

	.palette-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-secondary);
		font-size: 11px;
		color: var(--text-muted);
	}

	.palette-footer span {
		display: flex;
		align-items: center;
		gap: 4px;
	}
</style>
