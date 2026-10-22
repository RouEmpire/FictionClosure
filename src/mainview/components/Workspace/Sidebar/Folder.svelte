<script lang="ts">
	import type { DocumentType, FictionDocument, ProjectFolder } from "../../../../shared/types";
	import Document from "./Document.svelte";
	import Folder from "./Folder.svelte";

	interface Props {
		folder: ProjectFolder;
		depth?: number;
		allFolders: ProjectFolder[];
		allDocs: FictionDocument[];
		activeFolderId: string | null;
		activeDocId: string | null;
		collapsedFolders: Record<string, boolean>;
		editingFolderId: string | null;
		editingFolderName: string;
		editingDocId: string | null;
		editingTitle: string;
		selectedNavId?: string;
		isContextMenuOpen?: boolean;
		onToggleFolder: (id: string) => void;
		onSelectFolder?: (id: string) => void;
		onSelectDoc: (id: string) => void;
		onNewDoc: (type: DocumentType, folderId: string) => void;
		onNewFolder?: (parentFolderId: string) => void;
		onFolderContextMenu: (e: MouseEvent, folder: ProjectFolder) => void;
		onDocContextMenu: (e: MouseEvent, doc: FictionDocument) => void;
		onCommitFolderRename: (name: string) => void;
		onCancelFolderRename: () => void;
		onCommitDocRename: (title: string) => void;
		onCancelDocRename: () => void;
	}

	let {
		folder,
		depth = 1,
		allFolders,
		allDocs,
		activeFolderId,
		activeDocId,
		collapsedFolders,
		editingFolderId,
		editingFolderName,
		editingDocId,
		editingTitle,
		selectedNavId,
		isContextMenuOpen = false,
		onToggleFolder,
		onSelectFolder,
		onSelectDoc,
		onNewDoc,
		onNewFolder,
		onFolderContextMenu,
		onDocContextMenu,
		onCommitFolderRename,
		onCancelFolderRename,
		onCommitDocRename,
		onCancelDocRename,
	}: Props = $props();

	const isFolderActive = $derived(activeFolderId === folder.id);
	const isCollapsed = $derived(Boolean(collapsedFolders[folder.id]));
	const isRenaming = $derived(editingFolderId === folder.id);

	let currentName = $state("");
	let inputEl: HTMLInputElement | null = $state(null);

	$effect(() => {
		currentName = editingFolderName;
	});

	$effect(() => {
		if (isRenaming && inputEl) {
			inputEl.focus();
			inputEl.select();
		}
	});

	const childFolders = $derived(allFolders.filter((f) => f.parentId === folder.id));
	const childDocs = $derived(
		allDocs
			.filter((d) => d.folderId === folder.id)
			.sort((a, b) => a.order - b.order),
	);
	const totalCount = $derived(childFolders.length + childDocs.length);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			onCommitFolderRename(currentName);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCancelFolderRename();
		}
	}
</script>

<div class="tree-folder-node" style="--depth: {depth};">
	<div
		class="folder-row"
		class:is-active={isFolderActive}
		class:nav-selected={selectedNavId === folder.id}
		oncontextmenu={(e) => onFolderContextMenu(e, folder)}
		role="treeitem"
		tabindex={isFolderActive ? 0 : -1}
		aria-selected={isFolderActive}
	>
		{#if isRenaming}
			<div class="rename-container">
				<span class="folder-icon">
					<i class={folder.icon || "fa-solid fa-folder"}></i>
				</span>
				<input
					type="text"
					class="inline-rename-input"
					bind:value={currentName}
					bind:this={inputEl}
					onclick={(e) => e.stopPropagation()}
					onkeydown={handleKeyDown}
					onblur={() => onCommitFolderRename(currentName)}
					aria-label="Rename folder"
				/>
			</div>
		{:else}
			<button
				type="button"
				class="folder-toggle-btn"
				onclick={() => {
					onToggleFolder(folder.id);
					onSelectFolder?.(folder.id);
				}}
				title={folder.note || folder.name}
			>
				<span class="folder-arrow" class:collapsed={isCollapsed}>▾</span>
				<span class="folder-icon">
					<i class={folder.icon || (isCollapsed ? "fa-solid fa-folder" : "fa-solid fa-folder-open")}></i>
				</span>
				<span class="folder-title">{folder.name}</span>
				{#if folder.tags && folder.tags.length > 0}
					<span class="folder-tag-badge">#{folder.tags[0]}</span>
				{/if}
				<span class="count-badge">{totalCount}</span>
			</button>

			<div class="folder-actions">
				<button
					type="button"
					class="folder-action-btn"
					onclick={(e) => {
						e.stopPropagation();
						onNewFolder?.(folder.id);
					}}
					title="New subfolder in {folder.name}"
				>
					<i class="fa-solid fa-folder-plus"></i>
				</button>
				<button
					type="button"
					class="folder-action-btn"
					onclick={(e) => {
						e.stopPropagation();
						onNewDoc(folder.type, folder.id);
					}}
					title="New document in {folder.name}"
				>
					<i class="fa-solid fa-plus"></i>
				</button>
			</div>
		{/if}
	</div>

	{#if !isCollapsed}
		<div class="folder-children-container">
			{#each childFolders as child (child.id)}
				<Folder
					folder={child}
					depth={depth + 1}
					{allFolders}
					{allDocs}
					{activeFolderId}
					{activeDocId}
					{collapsedFolders}
					{editingFolderId}
					{editingFolderName}
					{editingDocId}
					{editingTitle}
					{selectedNavId}
					isContextMenuOpen={isContextMenuOpen}
					{onToggleFolder}
					{onSelectFolder}
					{onSelectDoc}
					{onNewDoc}
					{onNewFolder}
					{onFolderContextMenu}
					{onDocContextMenu}
					{onCommitFolderRename}
					{onCancelFolderRename}
					{onCommitDocRename}
					{onCancelDocRename}
				/>
			{/each}

			{#each childDocs as doc (doc.id)}
				<Document
					{doc}
					depth={depth + 1}
					isActive={doc.id === activeDocId}
					isSelected={selectedNavId === doc.id}
					isRenaming={editingDocId === doc.id}
					editingTitle={editingTitle}
					onSelect={onSelectDoc}
					onContextMenu={onDocContextMenu}
					onCommitRename={onCommitDocRename}
					onCancelRename={onCancelDocRename}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	@import "./tree.css";

	.tree-folder-node {
		display: flex;
		flex-direction: column;
	}

	.folder-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-left: calc(var(--depth, 1) * 12px + 6px);
		padding-right: 8px;
		min-height: 28px;
		margin: 1px 4px;
		border-radius: 4px;
		color: var(--accent-secondary);
		transition: background-color 0.15s ease, color 0.15s ease;
	}

	.folder-row:hover {
		background-color: var(--bg-hover);
		color: var(--accent-secondary-hover);
	}

	.folder-row.is-active {
		background-color: var(--accent-secondary-subtle);
		border-left: 2px solid var(--accent-secondary);
		color: var(--accent-secondary-hover);
	}

	.folder-row.nav-selected {
		background-color: var(--bg-hover);
		outline: 1px solid var(--accent-secondary);
	}

	.folder-toggle-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--accent-secondary);
		font-size: 12px;
		cursor: pointer;
		flex: 1;
		min-width: 0;
		text-align: left;
		padding: 2px 0;
		transition: color 0.15s ease;
	}

	.folder-row:hover .folder-toggle-btn,
	.folder-toggle-btn:hover {
		color: var(--accent-secondary-hover);
	}

	.folder-arrow {
		font-size: 9px;
		color: var(--accent-secondary);
		opacity: 0.8;
		transition: transform 0.15s ease, color 0.15s ease;
		display: inline-block;
		width: 10px;
		flex-shrink: 0;
	}

	.folder-arrow.collapsed {
		transform: rotate(-90deg);
	}

	.folder-row:hover .folder-arrow {
		color: var(--accent-secondary-hover);
		opacity: 1;
	}

	.folder-icon {
		font-size: 12px;
		color: var(--accent-secondary);
		flex-shrink: 0;
		transition: color 0.15s ease;
	}

	.folder-row:hover .folder-icon,
	.folder-row.is-active .folder-icon {
		color: var(--accent-secondary-hover);
	}

	.folder-title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--accent-secondary);
		flex: 1;
		transition: color 0.15s ease;
	}

	.folder-row:hover .folder-title,
	.folder-row.is-active .folder-title {
		color: var(--accent-secondary-hover);
	}

	.folder-tag-badge {
		font-size: 10px;
		color: var(--accent-secondary);
		background: var(--accent-secondary-subtle);
		padding: 1px 4px;
		border-radius: 3px;
		font-family: var(--font-editor, monospace);
		flex-shrink: 0;
		transition: color 0.15s ease, background-color 0.15s ease;
	}

	.folder-row:hover .folder-tag-badge {
		color: var(--accent-secondary-hover);
	}

	.folder-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.1s ease;
	}

	.folder-row:hover .folder-actions {
		opacity: 1;
	}

	.folder-action-btn {
		background: transparent;
		border: none;
		color: var(--accent-secondary);
		opacity: 0.7;
		font-size: 10px;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 3px;
		transition: color 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
	}

	.folder-action-btn:hover {
		color: var(--accent-secondary-hover);
		opacity: 1;
		background: var(--accent-secondary-subtle);
	}

	.folder-children-container {
		display: flex;
		flex-direction: column;
	}
</style>
