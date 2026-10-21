<script lang="ts">
	import type { DocumentType, FictionDocument, ProjectFolder } from "../../shared/types";
	import { calculateWordCount, markdownToPlainText } from "../../shared/domain/markdown";
	import {
		getDocumentRelativePath,
		getDocumentSystemPath,
		copyToClipboard,
	} from "../../shared/domain/documentPaths";

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

	function toggleSection(type: DocumentType) {
		collapsedSections[type] = !collapsedSections[type];
	}

	function toggleFolder(folderId: string) {
		collapsedFolders[folderId] = !collapsedFolders[folderId];
	}

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

	// Total project word count
	const totalWordCount = $derived.by(() => {
		return documents
			.filter((d) => d.type === "manuscript")
			.reduce((acc, doc) => acc + calculateWordCount(doc.content), 0);
	});

	const progressPercent = $derived(
		targetWordCount > 0
			? Math.min(100, Math.round((totalWordCount / targetWordCount) * 100))
			: 0,
	);

	function getChildFolders(parentId: string): ProjectFolder[] {
		return folders.filter((f) => f.parentId === parentId);
	}

	function getFolderDocs(folderId: string): FictionDocument[] {
		return filteredDocs.filter((d) => d.folderId === folderId).sort((a, b) => a.order - b.order);
	}

	function getRootFoldersForSection(type: DocumentType): ProjectFolder[] {
		return folders.filter((f) => !f.parentId && f.type === type);
	}

	function getRootDocsForSection(type: DocumentType): FictionDocument[] {
		return filteredDocs.filter((d) => !d.folderId && d.type === type).sort((a, b) => a.order - b.order);
	}

	export interface NavTreeItem {
		kind: "section" | "folder" | "doc";
		type: DocumentType;
		id: string;
		label: string;
	}

	const visibleNavItems = $derived.by<NavTreeItem[]>(() => {
		const items: NavTreeItem[] = [];
		for (const sec of sections) {
			items.push({ kind: "section", type: sec.type, id: `section-${sec.type}`, label: sec.label });
			if (!collapsedSections[sec.type]) {
				function addFolderItems(f: ProjectFolder) {
					items.push({ kind: "folder", type: f.type || sec.type, id: f.id, label: f.name });
					if (!collapsedFolders[f.id]) {
						for (const child of getChildFolders(f.id)) {
							addFolderItems(child);
						}
						for (const doc of getFolderDocs(f.id)) {
							items.push({ kind: "doc", type: doc.type, id: doc.id, label: doc.title });
						}
					}
				}

				for (const rf of getRootFoldersForSection(sec.type)) {
					addFolderItems(rf);
				}

				for (const doc of getRootDocsForSection(sec.type)) {
					items.push({ kind: "doc", type: doc.type, id: doc.id, label: doc.title });
				}
			}
		}
		return items;
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

	let activeSubmenu = $state<"copy" | "path" | null>(null);

	const isNearRightEdge = $derived.by(() => {
		if (typeof window === "undefined") return false;
		return contextMenu.x + 220 + 200 > window.innerWidth;
	});

	// Inline Document Rename State
	let editingDocId = $state<string | null>(null);
	let editingTitle = $state<string>("");
	let renameInputEl = $state<HTMLInputElement | null>(null);

	// Inline Folder Rename State
	let editingFolderId = $state<string | null>(null);
	let editingFolderName = $state<string>("");
	let renameFolderInputEl = $state<HTMLInputElement | null>(null);

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

	// Rename actions for documents
	function startRename(doc: FictionDocument) {
		editingDocId = doc.id;
		editingTitle = doc.title;
		closeContextMenu();
		setTimeout(() => {
			if (renameInputEl) {
				renameInputEl.focus();
				renameInputEl.select();
			}
		}, 30);
	}

	function commitRename() {
		if (editingDocId && editingTitle.trim()) {
			onRenameDoc?.(editingDocId, editingTitle.trim());
		}
		editingDocId = null;
		editingTitle = "";
	}

	function cancelRename() {
		editingDocId = null;
		editingTitle = "";
	}

	function handleRenameKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			commitRename();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancelRename();
		}
	}

	// Rename actions for folders
	function startFolderRename(folder: ProjectFolder) {
		editingFolderId = folder.id;
		editingFolderName = folder.name;
		closeFolderContextMenu();
		setTimeout(() => {
			if (renameFolderInputEl) {
				renameFolderInputEl.focus();
				renameFolderInputEl.select();
			}
		}, 30);
	}

	function commitFolderRename() {
		if (editingFolderId && editingFolderName.trim()) {
			onRenameFolder?.(editingFolderId, editingFolderName.trim());
		}
		editingFolderId = null;
		editingFolderName = "";
	}

	function cancelFolderRename() {
		editingFolderId = null;
		editingFolderName = "";
	}

	function handleFolderRenameKeyDown(e: KeyboardEvent) {
		if (e.key === "Enter") {
			e.preventDefault();
			commitFolderRename();
		} else if (e.key === "Escape") {
			e.preventDefault();
			cancelFolderRename();
		}
	}

	// Context menu handlers
	function handleDocContextMenu(e: MouseEvent, doc: FictionDocument) {
		e.preventDefault();
		e.stopPropagation();
		closeFolderContextMenu();

		const menuWidth = 220;
		const menuHeight = 280;
		const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
		const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

		const x = Math.min(e.clientX, viewportWidth - menuWidth - 10);
		const y = Math.min(e.clientY, viewportHeight - menuHeight - 10);

		contextMenu = {
			isOpen: true,
			x: Math.max(10, x),
			y: Math.max(10, y),
			doc,
		};
		activeSubmenu = null;
	}

	function handleFolderContextMenu(e: MouseEvent, folder: ProjectFolder) {
		e.preventDefault();
		e.stopPropagation();
		closeContextMenu();

		const menuWidth = 220;
		const menuHeight = 240;
		const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
		const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

		const x = Math.min(e.clientX, viewportWidth - menuWidth - 10);
		const y = Math.min(e.clientY, viewportHeight - menuHeight - 10);

		folderContextMenu = {
			isOpen: true,
			x: Math.max(10, x),
			y: Math.max(10, y),
			folder,
		};
	}

	function closeContextMenu() {
		contextMenu.isOpen = false;
		contextMenu.doc = null;
		activeSubmenu = null;
	}

	function closeFolderContextMenu() {
		folderContextMenu.isOpen = false;
		folderContextMenu.folder = null;
	}

	function toggleSubmenu(submenuName: "copy" | "path") {
		activeSubmenu = activeSubmenu === submenuName ? null : submenuName;
	}

	async function handleCopyContent(format: "markdown" | "plaintext") {
		const doc = contextMenu.doc;
		if (!doc) return;
		closeContextMenu();

		if (format === "markdown") {
			const text = doc.content || "";
			await copyToClipboard(text);
			onShowToast?.(`Copied "${doc.title}" as Markdown`);
		} else {
			const text = markdownToPlainText(doc.content || "");
			await copyToClipboard(text);
			onShowToast?.(`Copied "${doc.title}" as Plain text`);
		}
	}

	async function handleCopyPath(type: "system" | "relative") {
		const doc = contextMenu.doc;
		if (!doc) return;
		closeContextMenu();

		if (type === "system") {
			const sysPath = getDocumentSystemPath(doc, folderPath);
			await copyToClipboard(sysPath);
			onShowToast?.(`Copied system path: ${sysPath}`);
		} else {
			const relPath = getDocumentRelativePath(doc);
			await copyToClipboard(relPath);
			onShowToast?.(`Copied relative path: ${relPath}`);
		}
	}

	function handleDuplicateFromContext() {
		const doc = contextMenu.doc;
		if (!doc) return;
		closeContextMenu();
		onDuplicateDoc?.(doc.id);
	}

	function handleDeleteFromContext() {
		const doc = contextMenu.doc;
		if (!doc) return;
		closeContextMenu();
		if (confirm(`Delete "${doc.title}"?`)) {
			onDeleteDoc(doc.id);
		}
	}

	function handleInspectFromContext() {
		const doc = contextMenu.doc;
		if (!doc) return;
		closeContextMenu();
		onSelectDoc(doc.id);
		onOpenInspector?.(doc.id);
		onShowToast?.(`Inspecting "${doc.title}"`);
	}

	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.tagName === "INPUT") {
			if (e.key === "Escape") {
				target.blur();
				sidebarEl?.focus();
			}
			return;
		}

		if (contextMenu.isOpen && e.key === "Escape") {
			e.preventDefault();
			closeContextMenu();
			return;
		}

		if (folderContextMenu.isOpen && e.key === "Escape") {
			e.preventDefault();
			closeFolderContextMenu();
			return;
		}

		const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
		const modPressed = isMac ? e.metaKey : e.ctrlKey;

		if (modPressed && e.key.toLowerCase() === "n") {
			e.preventDefault();
			const current = visibleNavItems[selectedIndex];
			onNewDoc(current ? current.type : undefined);
			return;
		}

		if (e.key === "F2") {
			const current = visibleNavItems[selectedIndex];
			if (current?.kind === "doc") {
				const doc = documents.find((d) => d.id === current.id);
				if (doc) {
					e.preventDefault();
					startRename(doc);
					return;
				}
			} else if (current?.kind === "folder") {
				const folder = folders.find((f) => f.id === current.id);
				if (folder) {
					e.preventDefault();
					startFolderRename(folder);
					return;
				}
			}
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (selectedIndex < visibleNavItems.length - 1) {
				selectedIndex++;
				scrollSelectedIntoView();
			}
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (selectedIndex > 0) {
				selectedIndex--;
				scrollSelectedIntoView();
			}
			return;
		}

		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const current = visibleNavItems[selectedIndex];
			if (!current) return;

			if (current.kind === "section") {
				toggleSection(current.type);
			} else if (current.kind === "folder") {
				toggleFolder(current.id);
				onSelectFolder?.(current.id);
			} else {
				onSelectDoc(current.id);
			}
			return;
		}

		if (e.key === "Escape") {
			isFocused = false;
			sidebarEl?.blur();
			return;
		}
	}
</script>

<svelte:window
	onclick={(e) => {
		if (contextMenu.isOpen) {
			const target = e.target as HTMLElement;
			if (!target.closest(".doc-context-menu")) {
				closeContextMenu();
			}
		}
		if (folderContextMenu.isOpen) {
			const target = e.target as HTMLElement;
			if (!target.closest(".doc-context-menu")) {
				closeFolderContextMenu();
			}
		}
	}}
	onkeydown={(e) => {
		if ((contextMenu.isOpen || folderContextMenu.isOpen) && e.key === "Escape") {
			closeContextMenu();
			closeFolderContextMenu();
		}
	}}
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<aside
	class="sidebar"
	bind:this={sidebarEl}
	tabindex="-1"
	aria-label="Document navigation sidebar"
	onkeydown={handleKeyDown}
	onfocus={() => (isFocused = true)}
	onblur={(e) => {
		if (!sidebarEl?.contains(e.relatedTarget as Node)) {
			isFocused = false;
		}
	}}
>
	<!-- Filter & Search Input -->
	<div class="sidebar-search">
		<div class="search-box">
			<span class="search-glyph"><i class="fa-solid fa-magnifying-glass"></i></span>
			<input
				type="text"
				placeholder="Filter tree..."
				bind:value={searchQuery}
				aria-label="Filter documents in tree"
			/>
			{#if searchQuery}
				<button
					type="button"
					class="clear-btn"
					onclick={() => (searchQuery = "")}
					title="Clear filter"
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			{/if}
		</div>
		<div class="sidebar-top-actions">
			<button
				type="button"
				class="new-doc-top-btn"
				onclick={() => onNewFolder?.()}
				title="Create new folder"
			>
				<i class="fa-solid fa-folder-plus"></i>
			</button>
			<button
				type="button"
				class="new-doc-top-btn"
				onclick={() => onNewDoc()}
				title="Create new document"
			>
				<i class="fa-solid fa-plus"></i>
			</button>
		</div>
	</div>

	<!-- Document Tree with Arbitrary Recursive Nested Folders -->
	<div class="tree-content">
		{#each sections as section (section.type)}
			{@const rootFolders = getRootFoldersForSection(section.type)}
			{@const rootDocs = getRootDocsForSection(section.type)}
			{@const totalSectionItems = rootFolders.length + rootDocs.length}

			<div class="tree-section">
				<div
					class="section-header"
					class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "section" && visibleNavItems[selectedIndex]?.type === section.type}
				>
					<button
						type="button"
						class="section-toggle"
						onclick={() => toggleSection(section.type)}
						aria-expanded={!collapsedSections[section.type]}
					>
						<span class="arrow" class:collapsed={collapsedSections[section.type]}>▾</span>
						<span class="section-icon"><i class={section.icon}></i></span>
						<span class="section-title">{section.label}</span>
						<span class="count-badge">{totalSectionItems}</span>
					</button>
					<div class="section-btn-group">
						<button
							type="button"
							class="section-add-btn"
							onclick={() => onNewFolder?.(undefined)}
							title="New folder in {section.label}"
						>
							<i class="fa-solid fa-folder-plus"></i>
						</button>
						<button
							type="button"
							class="section-add-btn"
							onclick={() => onNewDoc(section.type)}
							title="Add document to {section.label}"
						>
							<i class="fa-solid fa-plus"></i>
						</button>
					</div>
				</div>

				{#if !collapsedSections[section.type]}
					<div class="section-items-container">
						{#if rootFolders.length === 0 && rootDocs.length === 0}
							<div class="empty-section-item">
								<span>No items</span>
							</div>
						{:else}
							<!-- Render Root Folders of this Section Recursively -->
							{#each rootFolders as rf (rf.id)}
								{@render renderFolderNode(rf, 1)}
							{/each}

							<!-- Render Root Documents of this Section -->
							{#each rootDocs as doc (doc.id)}
								{@render renderDocNode(doc, 1)}
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Footer: Progress & Goal -->
	<div class="sidebar-footer">
		<div class="progress-box">
			<div class="progress-label-row">
				<span>Progress</span>
				<span class="progress-nums">{totalWordCount.toLocaleString()} / {targetWordCount.toLocaleString()}</span>
			</div>
			<div
				class="progress-bar-track"
				role="progressbar"
				aria-valuenow={progressPercent}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label="Manuscript word goal progress"
			>
				<div class="progress-bar-fill" style="width: {progressPercent}%;"></div>
			</div>
		</div>
	</div>

	<!-- Document Right-Click Context Menu -->
	{#if contextMenu.isOpen && contextMenu.doc}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="doc-context-menu"
			style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
			role="menu"
			aria-label="Document options"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === "Escape") closeContextMenu();
			}}
		>
			<div class="context-menu-header">
				<span class="context-doc-name" title={contextMenu.doc.title}>{contextMenu.doc.title}</span>
			</div>

			<!-- 1. Edit name -->
			<button
				type="button"
				class="context-menu-item"
				onclick={() => {
					const d = contextMenu.doc;
					if (d) startRename(d);
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-pen"></i></span>
				<span class="item-text">Edit name</span>
				<kbd>F2</kbd>
			</button>

			<!-- 2. Copy (Submenu) -->
			<div
				class="submenu-wrapper"
				role="none"
				onmouseenter={() => (activeSubmenu = "copy")}
				onmouseleave={() => {
					if (activeSubmenu === "copy") activeSubmenu = null;
				}}
			>
				<button
					type="button"
					class="context-menu-item has-submenu"
					class:submenu-open={activeSubmenu === "copy"}
					onclick={() => toggleSubmenu("copy")}
					role="menuitem"
					aria-haspopup="true"
					aria-expanded={activeSubmenu === "copy"}
				>
					<span class="item-icon"><i class="fa-solid fa-clipboard"></i></span>
					<span class="item-text">Copy</span>
					<span class="submenu-arrow">▶</span>
				</button>
				{#if activeSubmenu === "copy"}
					<div class="context-submenu" class:open-left={isNearRightEdge} role="menu">
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyContent("markdown")}
							role="menuitem"
						>
							<span class="item-icon"><i class="fa-solid fa-file"></i></span>
							<span class="item-text">Markdown</span>
						</button>
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyContent("plaintext")}
							role="menuitem"
						>
							<span class="item-icon"><i class="fa-solid fa-file-lines"></i></span>
							<span class="item-text">Plain text (Cleaned)</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- 3. Copy File Path (Submenu) -->
			<div
				class="submenu-wrapper"
				role="none"
				onmouseenter={() => (activeSubmenu = "path")}
				onmouseleave={() => {
					if (activeSubmenu === "path") activeSubmenu = null;
				}}
			>
				<button
					type="button"
					class="context-menu-item has-submenu"
					class:submenu-open={activeSubmenu === "path"}
					onclick={() => toggleSubmenu("path")}
					role="menuitem"
					aria-haspopup="true"
					aria-expanded={activeSubmenu === "path"}
				>
					<span class="item-icon"><i class="fa-solid fa-link"></i></span>
					<span class="item-text">Copy File Path</span>
					<span class="submenu-arrow">▶</span>
				</button>
				{#if activeSubmenu === "path"}
					<div class="context-submenu" class:open-left={isNearRightEdge} role="menu">
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyPath("system")}
							role="menuitem"
						>
							<span class="item-icon"><i class="fa-solid fa-laptop"></i></span>
							<span class="item-text">System path</span>
						</button>
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyPath("relative")}
							role="menuitem"
						>
							<span class="item-icon"><i class="fa-solid fa-folder"></i></span>
							<span class="item-text">Relative path</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- 4. Duplicate -->
			<button
				type="button"
				class="context-menu-item"
				onclick={handleDuplicateFromContext}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-copy"></i></span>
				<span class="item-text">Duplicate</span>
			</button>

			<!-- 5. Delete -->
			<button
				type="button"
				class="context-menu-item danger-item"
				onclick={handleDeleteFromContext}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-trash-can"></i></span>
				<span class="item-text">Delete</span>
			</button>

			<!-- 6. Horizontal separator -->
			<div class="context-menu-divider" role="separator"></div>

			<!-- 7. Inspect -->
			<button
				type="button"
				class="context-menu-item"
				onclick={handleInspectFromContext}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
				<span class="item-text">Inspect</span>
			</button>
		</div>
	{/if}

	<!-- Folder Right-Click Context Menu -->
	{#if folderContextMenu.isOpen && folderContextMenu.folder}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="doc-context-menu"
			style="left: {folderContextMenu.x}px; top: {folderContextMenu.y}px;"
			role="menu"
			aria-label="Folder options"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === "Escape") closeFolderContextMenu();
			}}
		>
			<div class="context-menu-header">
				<span class="context-doc-name" title={folderContextMenu.folder.name}>
					<i class={folderContextMenu.folder.icon || "fa-solid fa-folder"}></i> {folderContextMenu.folder.name}
				</span>
			</div>

			<!-- 1. New Document inside -->
			<button
				type="button"
				class="context-menu-item"
				onclick={() => {
					const f = folderContextMenu.folder;
					closeFolderContextMenu();
					if (f) onNewDoc(f.type, f.id);
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-plus"></i></span>
				<span class="item-text">New Document inside</span>
			</button>

			<!-- 2. New Subfolder inside -->
			<button
				type="button"
				class="context-menu-item"
				onclick={() => {
					const f = folderContextMenu.folder;
					closeFolderContextMenu();
					if (f) onNewFolder?.(f.id);
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-folder-plus"></i></span>
				<span class="item-text">New Subfolder inside</span>
			</button>

			<!-- 3. Copy Folder Path -->
			<button
				type="button"
				class="context-menu-item"
				onclick={async () => {
					const f = folderContextMenu.folder;
					closeFolderContextMenu();
					if (f) {
						await copyToClipboard(f.relativePath);
						onShowToast?.(`Copied path: ${f.relativePath}`);
					}
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-link"></i></span>
				<span class="item-text">Copy Folder Path</span>
			</button>

			<!-- 4. Rename Folder -->
			<button
				type="button"
				class="context-menu-item"
				onclick={() => {
					const f = folderContextMenu.folder;
					if (f) startFolderRename(f);
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-pen"></i></span>
				<span class="item-text">Rename Folder</span>
				<kbd>F2</kbd>
			</button>

			<!-- 5. Delete Folder -->
			<button
				type="button"
				class="context-menu-item danger-item"
				onclick={() => {
					const f = folderContextMenu.folder;
					closeFolderContextMenu();
					if (f && confirm(`Delete folder "${f.name}" and all items inside?`)) {
						onDeleteFolder?.(f.id);
					}
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-trash-can"></i></span>
				<span class="item-text">Delete Folder</span>
			</button>

			<!-- 6. Separator -->
			<div class="context-menu-divider" role="separator"></div>

			<!-- 7. Inspect Folder -->
			<button
				type="button"
				class="context-menu-item"
				onclick={() => {
					const f = folderContextMenu.folder;
					closeFolderContextMenu();
					if (f) {
						onInspectFolder?.(f.id);
						onShowToast?.(`Inspecting folder "${f.name}"`);
					}
				}}
				role="menuitem"
			>
				<span class="item-icon"><i class="fa-solid fa-circle-info"></i></span>
				<span class="item-text">Inspect Folder</span>
			</button>
		</div>
	{/if}
</aside>

<!-- SVELTE 5 RECURSIVE SNIPPET FOR FOLDERS -->
{#snippet renderFolderNode(folder: ProjectFolder, depth: number)}
	{@const isCollapsed = Boolean(collapsedFolders[folder.id])}
	{@const childFolders = getChildFolders(folder.id)}
	{@const childDocs = getFolderDocs(folder.id)}
	{@const totalCount = childFolders.length + childDocs.length}
	{@const isFolderActive = folder.id === activeFolderId}
	{@const isRenaming = editingFolderId === folder.id}

	<div class="tree-folder-node" style="--depth: {depth};">
		<div
			class="folder-row"
			class:is-active={isFolderActive}
			class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "folder" && visibleNavItems[selectedIndex]?.id === folder.id}
			oncontextmenu={(e) => handleFolderContextMenu(e, folder)}
			role="treeitem"
			tabindex={isFolderActive ? 0 : -1}
			aria-selected={isFolderActive}
		>
			{#if isRenaming}
				<div class="rename-container">
					<span class="folder-icon"><i class={folder.icon || "fa-solid fa-folder"}></i></span>
					<input
						type="text"
						class="inline-rename-input"
						bind:value={editingFolderName}
						bind:this={renameFolderInputEl}
						onclick={(e) => e.stopPropagation()}
						onkeydown={handleFolderRenameKeyDown}
						onblur={commitFolderRename}
						aria-label="Rename folder"
					/>
				</div>
			{:else}
				<button
					type="button"
					class="folder-toggle-btn"
					onclick={() => {
						toggleFolder(folder.id);
						onSelectFolder?.(folder.id);
					}}
					title={folder.note || folder.name}
				>
					<span class="folder-arrow" class:collapsed={isCollapsed}>▾</span>
					<span class="folder-icon"><i class={folder.icon || (isCollapsed ? "fa-solid fa-folder" : "fa-solid fa-folder-open")}></i></span>
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
				<!-- Child Folders (Recursively nested) -->
				{#each childFolders as child (child.id)}
					{@render renderFolderNode(child, depth + 1)}
				{/each}

				<!-- Child Documents -->
				{#each childDocs as doc (doc.id)}
					{@render renderDocNode(doc, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<!-- SVELTE 5 SNIPPET FOR DOCUMENT NODES -->
{#snippet renderDocNode(doc: FictionDocument, depth: number)}
	{@const isActive = doc.id === activeDocId}
	{@const isEditing = editingDocId === doc.id}
	{@const words = calculateWordCount(doc.content)}

	<div
		class="doc-item"
		class:active={isActive}
		class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "doc" && visibleNavItems[selectedIndex]?.id === doc.id}
		class:context-active={contextMenu.isOpen && contextMenu.doc?.id === doc.id}
		style="padding-left: calc({depth} * 12px + 14px);"
		role="treeitem"
		tabindex={isActive ? 0 : -1}
		aria-selected={isActive}
		oncontextmenu={(e) => handleDocContextMenu(e, doc)}
	>
		{#if isEditing}
			<div class="rename-container">
				<span class="status-indicator status-{doc.status}"></span>
				<input
					type="text"
					class="inline-rename-input"
					bind:value={editingTitle}
					bind:this={renameInputEl}
					onclick={(e) => e.stopPropagation()}
					onkeydown={handleRenameKeyDown}
					onblur={commitRename}
					aria-label="Rename document"
				/>
			</div>
		{:else}
			<button
				type="button"
				class="doc-link-btn"
				onclick={() => onSelectDoc(doc.id)}
				title={doc.title}
			>
				<div class="doc-item-title-row">
					<span class="status-indicator status-{doc.status}"></span>
					<span class="doc-item-title">{doc.title}</span>
				</div>
				<div class="doc-item-meta">
					{#if doc.type === "manuscript"}
						<span class="word-counter">{words.toLocaleString()} words</span>
					{:else if doc.tags.length > 0}
						<span class="tag-label">#{doc.tags[0]}</span>
					{/if}
				</div>
			</button>
		{/if}
	</div>
{/snippet}

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

	.sidebar-search {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.search-box {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-glyph {
		position: absolute;
		left: 8px;
		font-size: 11px;
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		background-color: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 5px 24px 5px 26px;
		border-radius: 5px;
		font-size: 12px;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.search-box input:focus {
		border-color: var(--accent-primary);
	}

	.clear-btn {
		position: absolute;
		right: 6px;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 11px;
		padding: 2px;
	}

	.clear-btn:hover {
		color: var(--text-primary);
	}

	.sidebar-top-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.new-doc-top-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: 5px;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 11px;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.new-doc-top-btn:hover {
		background: var(--bg-hover);
		color: var(--accent-primary);
		border-color: var(--border-bold);
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 8px 0;
	}

	.tree-section {
		margin-bottom: 4px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5px 12px;
		border-radius: 4px;
		margin: 0 4px;
		transition: background-color 0.15s ease;
	}

	.section-header:hover {
		background-color: var(--bg-hover);
	}

	.section-header.nav-selected {
		background-color: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.section-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		flex: 1;
		text-align: left;
		padding: 0;
	}

	.arrow {
		font-size: 10px;
		color: var(--text-muted);
		transition: transform 0.15s ease;
		display: inline-block;
		width: 10px;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.section-icon {
		font-size: 12px;
		color: var(--accent-primary);
	}

	.section-title {
		flex: 1;
	}

	.count-badge {
		font-size: 10px;
		font-weight: normal;
		color: var(--text-muted);
		background-color: var(--bg-tertiary);
		padding: 1px 6px;
		border-radius: 10px;
	}

	.section-btn-group {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.section-header:hover .section-btn-group {
		opacity: 1;
	}

	.section-add-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px 5px;
		font-size: 11px;
		border-radius: 3px;
	}

	.section-add-btn:hover {
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
	}

	.section-items-container {
		display: flex;
		flex-direction: column;
	}

	.empty-section-item {
		padding: 4px 0 4px 30px;
		font-size: 11px;
		color: var(--text-muted);
		font-style: italic;
	}

	/* RECURSIVE FOLDER STYLING */
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
		transition: background-color 0.1s ease;
	}

	.folder-row:hover {
		background-color: var(--bg-hover);
	}

	.folder-row.is-active {
		background-color: var(--accent-subtle);
		border-left: 2px solid var(--accent-primary);
	}

	.folder-row.nav-selected {
		background-color: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.folder-toggle-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 12px;
		cursor: pointer;
		flex: 1;
		min-width: 0;
		text-align: left;
		padding: 2px 0;
	}

	.folder-arrow {
		font-size: 9px;
		color: var(--text-muted);
		transition: transform 0.15s ease;
		display: inline-block;
		width: 10px;
		flex-shrink: 0;
	}

	.folder-arrow.collapsed {
		transform: rotate(-90deg);
	}

	.folder-icon {
		font-size: 12px;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.folder-title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text-primary);
		flex: 1;
	}

	.folder-tag-badge {
		font-size: 10px;
		color: var(--text-muted);
		background: var(--bg-tertiary);
		padding: 1px 4px;
		border-radius: 3px;
		font-family: var(--font-editor, monospace);
		flex-shrink: 0;
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
		color: var(--text-muted);
		font-size: 10px;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 3px;
	}

	.folder-action-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.folder-children-container {
		display: flex;
		flex-direction: column;
	}

	/* DOCUMENT ITEM STYLING */
	.doc-item {
		margin: 1px 4px;
		border-radius: 4px;
		transition: background-color 0.15s ease;
		padding-right: 8px;
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

	/* CONTEXT MENUS */
	.doc-context-menu {
		position: fixed;
		min-width: 200px;
		background-color: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-bold, #3f4756);
		border-radius: 8px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
		padding: 5px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		z-index: 10000;
		outline: none;
		user-select: none;
		animation: contextMenuPop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes contextMenuPop {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}

	.context-menu-header {
		padding: 6px 10px;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 3px;
	}

	.context-doc-name {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 10px;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 12px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background-color 0.1s ease;
	}

	.context-menu-item:hover,
	.context-menu-item.submenu-open {
		background-color: var(--bg-hover);
		color: var(--accent-primary);
	}

	.context-menu-item.danger-item:hover {
		background-color: rgba(248, 81, 73, 0.15);
		color: var(--error, #f85149);
	}

	.context-menu-item kbd {
		margin-left: auto;
		font-size: 9px;
		font-family: inherit;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		padding: 1px 4px;
		border-radius: 3px;
		color: var(--text-muted);
	}

	.item-icon {
		width: 14px;
		font-size: 11px;
		text-align: center;
		color: var(--text-muted);
	}

	.context-menu-item:hover .item-icon {
		color: inherit;
	}

	.context-menu-divider {
		height: 1px;
		background-color: var(--border-subtle);
		margin: 4px 0;
	}

	.submenu-wrapper {
		position: relative;
		width: 100%;
	}

	.context-menu-item.has-submenu {
		justify-content: space-between;
	}

	.submenu-arrow {
		font-size: 9px;
		color: var(--text-muted);
		margin-left: auto;
	}

	.context-submenu {
		position: absolute;
		left: 100%;
		top: -4px;
		min-width: 190px;
		background-color: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-bold, #3f4756);
		border-radius: 8px;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
		padding: 5px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		z-index: 10001;
		animation: contextMenuPop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.context-submenu.open-left {
		left: auto;
		right: 100%;
	}

	.sidebar-footer {
		padding: 12px;
		border-top: 1px solid var(--border-subtle);
		background-color: var(--bg-secondary);
	}

	.progress-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.progress-label-row {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--text-secondary);
	}

	.progress-nums {
		font-family: var(--font-editor);
		color: var(--text-muted);
	}

	.progress-bar-track {
		height: 6px;
		background-color: var(--bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-primary), var(--accent-hover));
		border-radius: 3px;
		transition: width 0.3s ease;
	}
</style>