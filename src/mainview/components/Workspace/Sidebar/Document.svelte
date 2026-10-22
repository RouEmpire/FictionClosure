<script lang="ts">
	import type { FictionDocument } from "@shared/types";
	import { calculateWordCount, countContentLines } from "@shared/domain/markdown";

	interface Props {
		doc: FictionDocument;
		depth?: number;
		isActive: boolean;
		isSelected?: boolean;
		isContextMenuOpen?: boolean;
		isRenaming: boolean;
		editingTitle?: string;
		onSelect: (id: string) => void;
		onContextMenu: (e: MouseEvent, doc: FictionDocument) => void;
		onCommitRename: (title: string) => void;
		onCancelRename: () => void;
	}

	let {
		doc,
		depth = 1,
		isActive,
		isSelected = false,
		isContextMenuOpen = false,
		isRenaming,
		editingTitle = "",
		onSelect,
		onContextMenu,
		onCommitRename,
		onCancelRename,
	}: Props = $props();

	let currentTitle = $state("");
	let inputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		currentTitle = editingTitle;
	});

	$effect(() => {
		if (isRenaming && inputEl) {
			inputEl.focus();
			inputEl.select();
		}
	});

	const words = $derived(calculateWordCount(doc.content));
	const contentLines = $derived(countContentLines(doc.content));
	const isShort = $derived(contentLines < 10);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			onCommitRename(currentTitle);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancelRename();
		}
	}
</script>

<div
	class="doc-item"
	class:active={isActive}
	class:nav-selected={isSelected}
	class:context-active={isContextMenuOpen}
	class:is-short={isShort}
	style="padding-left: calc({depth} * 12px + 14px);"
	role="treeitem"
	tabindex={isActive ? 0 : -1}
	aria-selected={isActive}
	oncontextmenu={(e) => onContextMenu(e, doc)}
>
	{#if isRenaming}
		<div class="rename-container">
			<span class="status-indicator status-{doc.status}"></span>
			<input
				type="text"
				class="inline-rename-input"
				bind:value={currentTitle}
				bind:this={inputEl}
				onclick={(e) => e.stopPropagation()}
				onkeydown={handleKeyDown}
				onblur={() => onCommitRename(currentTitle)}
				aria-label="Rename document"
			/>
		</div>
	{:else}
		<button
			type="button"
			class="doc-link-btn"
			class:is-short={isShort}
			onclick={() => onSelect(doc.id)}
			title="{doc.title}{isShort ? ` (${contentLines} ${contentLines === 1 ? 'line' : 'lines'})` : ''}"
		>
			<div class="doc-item-title-row">
				<span class="status-indicator status-{doc.status}"></span>
				<span class="doc-item-title" class:is-short={isShort}>{doc.title}</span>
			</div>
			<div class="doc-item-meta">
				{#if doc.type === "manuscript"}
					<span class="word-counter" class:is-short={isShort}>
						{words.toLocaleString()} words
					</span>
				{:else if doc.tags.length > 0}
					<span class="tag-label">#{doc.tags[0]}</span>
				{/if}
			</div>
		</button>
	{/if}
</div>

<style>
	.doc-item {
		margin: 1px 4px;
		border-radius: 4px;
		transition: background-color 0.15s ease, color 0.15s ease;
		padding-right: 8px;
		color: var(--text-primary);
	}

	.doc-item.is-short {
		color: var(--text-muted);
	}

	.doc-item:hover {
		background-color: var(--bg-hover);
	}

	.doc-item.active {
		background-color: var(--accent-subtle);
		border-left: 2px solid var(--accent-primary);
	}

	.doc-item.nav-selected {
		background-color: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.doc-item.context-active {
		background-color: var(--bg-hover);
	}

	.doc-link-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5px 6px;
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		text-align: left;
		text-decoration: none;
	}

	.doc-item-title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 0;
	}

	.doc-item-title {
		font-size: 12px;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s ease;
	}

	.doc-item.is-short .doc-item-title,
	.doc-item-title.is-short,
	.doc-link-btn.is-short .doc-item-title {
		color: var(--text-muted);
	}

	.doc-item.is-short:hover .doc-item-title {
		color: var(--text-secondary);
	}

	.doc-item.active .doc-item-title {
		color: var(--text-primary);
	}

	.doc-item-meta {
		margin-left: 6px;
		flex-shrink: 0;
	}

	.word-counter {
		font-size: 10px;
		color: var(--text-muted);
		font-family: var(--font-editor, monospace);
	}

	.tag-label {
		font-size: 10px;
		color: var(--text-muted);
		background-color: var(--bg-tertiary);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.status-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-draft { background-color: var(--status-draft); }
	.status-in-progress { background-color: var(--status-in-progress); }
	.status-revised { background-color: var(--status-revised); }
	.status-completed { background-color: var(--status-completed); }

	.rename-container {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 6px;
		width: 100%;
	}

	.inline-rename-input {
		flex: 1;
		background-color: var(--bg-primary);
		border: 1px solid var(--accent-primary);
		color: var(--text-primary);
		font-size: 12px;
		padding: 2px 6px;
		border-radius: 3px;
		outline: none;
	}
</style>
