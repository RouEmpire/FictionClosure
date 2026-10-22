<script lang="ts">
	import type { DocumentType, FictionDocument, ProjectFolder } from "../../../../shared/types";
	import { calculateWordCount } from "../../../../shared/domain/markdown";
	import { buildVisibleNavItems, type NavTreeItem } from "./sidebarNav";
	import Toolbar from "./Toolbar.svelte";
	import ProgressBar from "./ProgressBar.svelte";
	import Section from "./Section.svelte";
	import Folder from "./Folder.svelte";
	import Document from "./Document.svelte";
	import DocumentContextMenu from "./DocumentContextMenu.svelte";
	import FolderContextMenu from "./FolderContextMenu.svelte";

	interface Props {
		documents: FictionDocument[];
		folders?: ProjectFolder[];
		targetWordCount?: number;
		activeDocId: string | null;
		activeFolderId?: string | null;
		folderPath?: string;
		onSelectDoc: (id: string) => void;
		onSelectFolder?: (folderId: string) => void;
		onNewDoc: (type?: DocumentType, parentFolderId?: string) => void;
		onNewFolder?: (parentFolderId?: string) => void;
		onDeleteDoc: (id: string) => void;
		onDeleteFolder?: (folderId: string) => void;
		onRenameDoc?: (id: string, newTitle: string) => void;
		onRenameFolder?: (folderId: string, newName: string) => void;
		onDuplicateDoc?: (id: string) => void;
		onOpenInspector?: (id: string) => void;
		onInspectFolder?: (folderId: string) => void;
		onShowToast?: (msg: string) => void;
	}

	let {
		documents,
		folders = [],
		targetWordCount = 80000,
		activeDocId,
		activeFolderId = null,
		folderPath,
		onSelectDoc,
		onSelectFolder,
		onNewDoc,
		onNewFolder,
		onDeleteDoc,
		onDeleteFolder,
		onRenameDoc,
		onRenameFolder,
		onDuplicateDoc,
		onOpenInspector,
		onInspectFolder,
		onShowToast,
	}: Props = $props();

	let searchQuery = $state("");
	let collapsedSections = $state<Record<DocumentType, boolean>>({
		manuscript: false,
		character: false,
		plot: false,
		world: false,
		note: false,
	});
	let collapsedFolders = $state<Record<string, boolean>>({});

	const sections: { type: DocumentType; label: string; icon: string }[] = [
		{ type: "manuscript", label: "Manuscript", icon: "fa-solid fa-book-open" },
		{ type: "character", label: "Characters", icon: "fa-solid fa-user" },
		{ type: "plot", label: "Plots & Arcs", icon: "fa-solid fa-chart-line" },
		{ type: "world", label: "World & Lore", icon: "fa-solid fa-map" },
		{ type: "note", label: "Notes & Outlines", icon: "fa-solid fa-file-lines" },
	];

	// Filter documents by search query
	const filteredDocs = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return documents;
		return documents.filter(
			(d) =>
				d.title.toLowerCase().includes(q) ||
				d.tags.some((t) => t.toLowerCase().includes(q)) ||
				d.summary?.toLowerCase().includes(q),
		);
	});

	// Total project manuscript word count
	const totalWordCount = $derived.by(() => {
		return documents
			.filter((d) => d.type === "manuscript")
			.reduce((acc, doc) => acc + calculateWordCount(doc.content), 0);
	});

	const visibleNavItems = $derived.by<NavTreeItem[]>(() => {
		return buildVisibleNavItems(
			sections,
			filteredDocs,
			folders,
			collapsedSections,
			collapsedFolders,
		);
	});

	let sidebarEl: HTMLElement | null = $state(null);
	let isFocused = $state(false);
	let selectedIndex = $state(0);

	// Context Menu State for Documents
	let contextMenu = $state<{
		isOpen: boolean;
		x: number;
		y: number;
		doc: FictionDocument | null;
	}>({
		isOpen: false,
		x: 0,
		y: 0,
		doc: null,
	});

	// Context Menu State for Folders
	let folderContextMenu = $state<{
		isOpen: boolean;
		x: number;
		y: number;
		folder: ProjectFolder | null;
	}>({
		isOpen: false,
		x: 0,
		y: 0,
		folder: null,
	});

	// Inline Document Rename State
	let editingDocId = $state<string | null>(null);
	let editingTitle = $state<string>("");

	// Inline Folder Rename State
	let editingFolderId = $state<string | null>(null);
	let editingFolderName = $state<string>("");

	export function focusSidebar() {
		isFocused = true;
		if (selectedIndex < 0 || selectedIndex >= visibleNavItems.length) {
			selectedIndex = 0;
		}
		sidebarEl?.focus();
		scrollSelectedIntoView();
	}

	function scrollSelectedIntoView() {
		setTimeout(() => {
			const el = sidebarEl?.querySelector(".nav-selected");
			el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}, 0);
	}

	function handleDocContextMenu(e: MouseEvent, doc: FictionDocument) {
		e.preventDefault();
		e.stopPropagation();
		folderContextMenu.isOpen = false;
		folderContextMenu.folder = null;

		const x = Math.min(e.clientX, window.innerWidth - 230);
		const y = Math.min(e.clientY, window.innerHeight - 290);
		contextMenu = { isOpen: true, x: Math.max(10, x), y: Math.max(10, y), doc };
	}

	function handleFolderContextMenu(e: MouseEvent, folder: ProjectFolder) {
		e.preventDefault();
		e.stopPropagation();
		contextMenu.isOpen = false;
		contextMenu.doc = null;

		const x = Math.min(e.clientX, window.innerWidth - 230);
		const y = Math.min(e.clientY, window.innerHeight - 250);
		folderContextMenu = { isOpen: true, x: Math.max(10, x), y: Math.max(10, y), folder };
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (editingDocId || editingFolderId) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (selectedIndex < visibleNavItems.length - 1) {
				selectedIndex += 1;
				scrollSelectedIntoView();
			}
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			if (selectedIndex > 0) {
				selectedIndex -= 1;
				scrollSelectedIntoView();
			}
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const item = visibleNavItems[selectedIndex];
			if (item) {
				if (item.kind === "section") {
					collapsedSections[item.type] = !collapsedSections[item.type];
				} else if (item.kind === "folder") {
					collapsedFolders[item.id] = !collapsedFolders[item.id];
					onSelectFolder?.(item.id);
				} else if (item.kind === "doc") {
					onSelectDoc(item.id);
				}
			}
		} else if (e.key === "F2") {
			const item = visibleNavItems[selectedIndex];
			if (item?.kind === "doc") {
				const doc = documents.find((d) => d.id === item.id);
				if (doc) {
					editingDocId = doc.id;
					editingTitle = doc.title;
				}
			} else if (item?.kind === "folder") {
				const folder = folders.find((f) => f.id === item.id);
				if (folder) {
					editingFolderId = folder.id;
					editingFolderName = folder.name;
				}
			}
		}
	}
</script>

<aside
	class="sidebar"
	bind:this={sidebarEl}
	tabindex="0"
	role="navigation"
	aria-label="Document Tree"
	onfocus={() => (isFocused = true)}
	onblur={() => (isFocused = false)}
	onkeydown={handleKeyDown}
>
	<Toolbar
		bind:searchQuery
		onSearchChange={(q) => (searchQuery = q)}
		onNewDoc={() => onNewDoc("manuscript")}
	/>

	<div class="tree-content" role="tree">
		{#each sections as sec}
			{@const secDocs = filteredDocs.filter((d) => d.type === sec.type)}
			{@const secRootFolders = folders.filter((f) => !f.parentId && f.type === sec.type)}
			{@const secRootDocs = filteredDocs.filter((d) => !d.folderId && d.type === sec.type).sort((a, b) => a.order - b.order)}
			{@const isSecSelected = isFocused && visibleNavItems[selectedIndex]?.id === `section-${sec.type}`}

			<Section
				type={sec.type}
				label={sec.label}
				icon={sec.icon}
				count={secDocs.length}
				isCollapsed={collapsedSections[sec.type]}
				isSelected={isSecSelected}
				onToggle={() => (collapsedSections[sec.type] = !collapsedSections[sec.type])}
				onNewDoc={(type) => onNewDoc(type)}
				onNewFolder={() => onNewFolder?.()}
			>
				{#each secRootFolders as rf (rf.id)}
					<Folder
						folder={rf}
						allFolders={folders}
						allDocs={filteredDocs}
						{activeFolderId}
						{activeDocId}
						{collapsedFolders}
						{editingFolderId}
						{editingFolderName}
						{editingDocId}
						{editingTitle}
						selectedNavId={isFocused ? visibleNavItems[selectedIndex]?.id : undefined}
						isContextMenuOpen={folderContextMenu.isOpen && folderContextMenu.folder?.id === rf.id}
						onToggleFolder={(id) => (collapsedFolders[id] = !collapsedFolders[id])}
						{onSelectFolder}
						{onSelectDoc}
						{onNewDoc}
						{onNewFolder}
						onFolderContextMenu={handleFolderContextMenu}
						onDocContextMenu={handleDocContextMenu}
						onCommitFolderRename={(name) => {
							if (editingFolderId && name.trim()) {
								onRenameFolder?.(editingFolderId, name.trim());
							}
							editingFolderId = null;
						}}
						onCancelFolderRename={() => (editingFolderId = null)}
						onCommitDocRename={(title) => {
							if (editingDocId && title.trim()) {
								onRenameDoc?.(editingDocId, title.trim());
							}
							editingDocId = null;
						}}
						onCancelDocRename={() => (editingDocId = null)}
					/>
				{/each}

				{#each secRootDocs as doc (doc.id)}
					<Document
						{doc}
						depth={1}
						isActive={doc.id === activeDocId}
						isSelected={isFocused && visibleNavItems[selectedIndex]?.id === doc.id}
						isContextMenuOpen={contextMenu.isOpen && contextMenu.doc?.id === doc.id}
						isRenaming={editingDocId === doc.id}
						editingTitle={editingTitle}
						onSelect={onSelectDoc}
						onContextMenu={handleDocContextMenu}
						onCommitRename={(title) => {
							if (editingDocId && title.trim()) {
								onRenameDoc?.(editingDocId, title.trim());
							}
							editingDocId = null;
						}}
						onCancelRename={() => (editingDocId = null)}
					/>
				{/each}
			</Section>
		{/each}
	</div>

	<ProgressBar {totalWordCount} {targetWordCount} />

	<DocumentContextMenu
		isOpen={contextMenu.isOpen}
		x={contextMenu.x}
		y={contextMenu.y}
		doc={contextMenu.doc}
		{folders}
		{folderPath}
		onClose={() => {
			contextMenu.isOpen = false;
			contextMenu.doc = null;
		}}
		{onSelectDoc}
		onStartRename={(doc) => {
			contextMenu.isOpen = false;
			editingDocId = doc.id;
			editingTitle = doc.title;
		}}
		{onDuplicateDoc}
		{onOpenInspector}
		{onDeleteDoc}
		{onShowToast}
	/>

	<FolderContextMenu
		isOpen={folderContextMenu.isOpen}
		x={folderContextMenu.x}
		y={folderContextMenu.y}
		folder={folderContextMenu.folder}
		onClose={() => {
			folderContextMenu.isOpen = false;
			folderContextMenu.folder = null;
		}}
		{onNewDoc}
		{onNewFolder}
		{onInspectFolder}
		onStartRename={(folder) => {
			folderContextMenu.isOpen = false;
			editingFolderId = folder.id;
			editingFolderName = folder.name;
		}}
		{onDeleteFolder}
	/>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width, 280px);
		min-width: 200px;
		max-width: 450px;
		height: 100%;
		background-color: var(--bg-secondary);
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		user-select: none;
		outline: none;
		position: relative;
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 8px 0;
	}
</style>
