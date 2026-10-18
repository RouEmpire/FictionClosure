<script lang="ts">
	import type { DocumentType, FictionDocument } from "../../shared/types";
	import { calculateWordCount, markdownToPlainText } from "../../shared/domain/markdown";
	import {
		getDocumentRelativePath,
		getDocumentSystemPath,
		copyToClipboard,
	} from "../../shared/domain/documentPaths";

	interface Props {
		documents: FictionDocument[];
		targetWordCount?: number;
		activeDocId: string | null;
		folderPath?: string;
		onSelectDoc: (id: string) => void;
		onNewDoc: (type?: DocumentType) => void;
		onDeleteDoc: (id: string) => void;
		onRenameDoc?: (id: string, newTitle: string) => void;
		onDuplicateDoc?: (id: string) => void;
		onOpenInspector?: (id: string) => void;
		onShowToast?: (msg: string) => void;
	}

	let {
		documents,
		targetWordCount = 80000,
		activeDocId,
		folderPath,
		onSelectDoc,
		onNewDoc,
		onDeleteDoc,
		onRenameDoc,
		onDuplicateDoc,
		onOpenInspector,
		onShowToast,
	}: Props = $props();

	let searchQuery = $state("");
	let collapsedSections = $state<Record<DocumentType, boolean>>({
		manuscript: false,
		character: false,
		world: false,
		note: false,
	});

	function toggleSection(type: DocumentType) {
		collapsedSections[type] = !collapsedSections[type];
	}

	const sections: { type: DocumentType; label: string; icon: string }[] = [
		{ type: "manuscript", label: "Manuscript", icon: "📖" },
		{ type: "character", label: "Characters", icon: "👤" },
		{ type: "world", label: "World & Lore", icon: "🗺️" },
		{ type: "note", label: "Notes & Outlines", icon: "📝" },
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

	function getDocsForType(type: DocumentType): FictionDocument[] {
		return filteredDocs.filter((d) => d.type === type).sort((a, b) => a.order - b.order);
	}

	export interface NavTreeItem {
		kind: "folder" | "doc";
		type: DocumentType;
		id: string;
		label: string;
	}

	const visibleNavItems = $derived.by<NavTreeItem[]>(() => {
		const items: NavTreeItem[] = [];
		for (const sec of sections) {
			items.push({ kind: "folder", type: sec.type, id: `folder-${sec.type}`, label: sec.label });
			if (!collapsedSections[sec.type]) {
				const docs = getDocsForType(sec.type);
				for (const doc of docs) {
					items.push({ kind: "doc", type: sec.type, id: doc.id, label: doc.title });
				}
			}
		}
		return items;
	});

	let sidebarEl: HTMLElement | null = $state(null);
	let isFocused = $state(false);
	let selectedIndex = $state(0);

	// Context Menu State
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

	let activeSubmenu = $state<"copy" | "path" | null>(null);

	const isNearRightEdge = $derived.by(() => {
		if (typeof window === "undefined") return false;
		return contextMenu.x + 220 + 200 > window.innerWidth;
	});

	// Inline Document Rename State
	let editingDocId = $state<string | null>(null);
	let editingTitle = $state<string>("");
	let renameInputEl = $state<HTMLInputElement | null>(null);

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

	// Rename actions
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

	// Context menu actions
	function handleDocContextMenu(e: MouseEvent, doc: FictionDocument) {
		e.preventDefault();
		e.stopPropagation();

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

	function closeContextMenu() {
		contextMenu.isOpen = false;
		contextMenu.doc = null;
		activeSubmenu = null;
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
		// If actively typing in an input, do not intercept navigation keys
		if (target.tagName === "INPUT") {
			if (e.key === "Escape") {
				target.blur();
				sidebarEl?.focus();
			}
			return;
		}

		// Escape closes context menu if open
		if (contextMenu.isOpen && e.key === "Escape") {
			e.preventDefault();
			closeContextMenu();
			return;
		}

		const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
		const modPressed = isMac ? e.metaKey : e.ctrlKey;

		// Ctrl+N while in sidebar: add new document in selected section
		if (modPressed && e.key.toLowerCase() === "n") {
			e.preventDefault();
			const current = visibleNavItems[selectedIndex];
			onNewDoc(current ? current.type : undefined);
			return;
		}

		// F2: Inline rename focused document
		if (e.key === "F2") {
			const current = visibleNavItems[selectedIndex];
			if (current?.kind === "doc") {
				const doc = documents.find((d) => d.id === current.id);
				if (doc) {
					e.preventDefault();
					startRename(doc);
					return;
				}
			}
		}

		// ContextMenu key or Shift+F10: Open context menu for focused document
		if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) {
			const current = visibleNavItems[selectedIndex];
			if (current?.kind === "doc") {
				const doc = documents.find((d) => d.id === current.id);
				if (doc && sidebarEl) {
					e.preventDefault();
					const rect = sidebarEl.getBoundingClientRect();
					contextMenu = {
						isOpen: true,
						x: rect.left + 80,
						y: rect.top + 120,
						doc,
					};
					activeSubmenu = null;
					return;
				}
			}
		}

		const key = e.key.toLowerCase();

		// Down or S: Move selection down
		if (e.key === "ArrowDown" || key === "s") {
			e.preventDefault();
			isFocused = true;
			if (visibleNavItems.length > 0) {
				selectedIndex = Math.min(visibleNavItems.length - 1, selectedIndex + 1);
				scrollSelectedIntoView();
			}
			return;
		}

		// Up or W: Move selection up
		if (e.key === "ArrowUp" || key === "w") {
			e.preventDefault();
			isFocused = true;
			if (visibleNavItems.length > 0) {
				selectedIndex = Math.max(0, selectedIndex - 1);
				scrollSelectedIntoView();
			}
			return;
		}

		// Right or D: Expand folder
		if (e.key === "ArrowRight" || key === "d") {
			e.preventDefault();
			isFocused = true;
			const current = visibleNavItems[selectedIndex];
			if (current?.kind === "folder") {
				collapsedSections[current.type] = false;
			}
			return;
		}

		// Left or A: Collapse folder or jump to parent folder
		if (e.key === "ArrowLeft" || key === "a") {
			e.preventDefault();
			isFocused = true;
			const current = visibleNavItems[selectedIndex];
			if (current?.kind === "folder") {
				collapsedSections[current.type] = true;
			} else if (current?.kind === "doc") {
				const parentIdx = visibleNavItems.findIndex(
					(it) => it.kind === "folder" && it.type === current.type,
				);
				if (parentIdx !== -1) {
					selectedIndex = parentIdx;
					scrollSelectedIntoView();
				}
			}
			return;
		}

		// Enter or Space: Toggle folder or select doc
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			const current = visibleNavItems[selectedIndex];
			if (!current) return;

			if (current.kind === "folder") {
				toggleSection(current.type);
			} else {
				onSelectDoc(current.id);
			}
			return;
		}

		// Escape: Exit sidebar focus
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
	}}
	onkeydown={(e) => {
		if (contextMenu.isOpen && e.key === "Escape") {
			closeContextMenu();
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
			<span class="search-glyph">🔍</span>
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
					✕
				</button>
			{/if}
		</div>
		<button
			type="button"
			class="new-doc-top-btn"
			onclick={() => onNewDoc()}
			title="Create new document"
		>
			+
		</button>
	</div>

	<!-- Document Tree -->
	<div class="tree-content">
		{#each sections as section (section.type)}
			{@const sectionDocs = getDocsForType(section.type)}
			<div class="tree-section">
				<div
					class="section-header"
					class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "folder" && visibleNavItems[selectedIndex]?.type === section.type}
				>
					<button
						type="button"
						class="section-toggle"
						onclick={() => toggleSection(section.type)}
						aria-expanded={!collapsedSections[section.type]}
					>
						<span class="arrow" class:collapsed={collapsedSections[section.type]}>▾</span>
						<span class="section-icon">{section.icon}</span>
						<span class="section-title">{section.label}</span>
						<span class="count-badge">{sectionDocs.length}</span>
					</button>
					<button
						type="button"
						class="section-add-btn"
						onclick={() => onNewDoc(section.type)}
						title="Add to {section.label}"
					>
						+
					</button>
				</div>

				{#if !collapsedSections[section.type]}
					<ul class="doc-list" role="tree">
						{#if sectionDocs.length === 0}
							<li class="empty-section-item">
								<span>No documents</span>
							</li>
						{:else}
							{#each sectionDocs as doc (doc.id)}
								{@const isActive = doc.id === activeDocId}
								{@const isEditing = editingDocId === doc.id}
								{@const words = calculateWordCount(doc.content)}
								<li
									class="doc-item"
									class:active={isActive}
									class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "doc" && visibleNavItems[selectedIndex]?.id === doc.id}
									class:context-active={contextMenu.isOpen && contextMenu.doc?.id === doc.id}
									role="treeitem"
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
													<span class="tag-label">{doc.tags[0]}</span>
												{/if}
											</div>
										</button>
										<button
											type="button"
											class="doc-actions-trigger"
											onclick={(e) => handleDocContextMenu(e, doc)}
											title="Document options (or right-click)"
											aria-label="Options for {doc.title}"
										>
											⋮
										</button>
									{/if}
								</li>
							{/each}
						{/if}
					</ul>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Bottom stats footer with goal progress -->
	<div class="sidebar-footer">
		<div class="progress-box">
			<div class="progress-label-row">
				<span class="progress-title">Manuscript Goal ({progressPercent}%)</span>
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
				if (e.key === "Escape") {
					closeContextMenu();
				}
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
				<span class="item-icon">✏️</span>
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
					<span class="item-icon">📋</span>
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
							<span class="item-icon">📄</span>
							<span class="item-text">Markdown</span>
						</button>
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyContent("plaintext")}
							role="menuitem"
						>
							<span class="item-icon">📝</span>
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
					<span class="item-icon">🔗</span>
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
							<span class="item-icon">💻</span>
							<span class="item-text">System path</span>
						</button>
						<button
							type="button"
							class="context-menu-item"
							onclick={() => handleCopyPath("relative")}
							role="menuitem"
						>
							<span class="item-icon">📁</span>
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
				<span class="item-icon">📑</span>
				<span class="item-text">Duplicate</span>
			</button>

			<!-- 5. Delete -->
			<button
				type="button"
				class="context-menu-item danger-item"
				onclick={handleDeleteFromContext}
				role="menuitem"
			>
				<span class="item-icon">🗑️</span>
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
				<span class="item-icon">🔍</span>
				<span class="item-text">Inspect</span>
			</button>
		</div>
	{/if}
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

	.sidebar-search {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		padding: 4px 8px;
		gap: 6px;
	}

	.search-box:focus-within {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 1px var(--accent-subtle);
	}

	.search-glyph {
		font-size: 12px;
		opacity: 0.6;
	}

	.search-box input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 12px;
		font-family: inherit;
	}

	.clear-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		font-size: 10px;
		cursor: pointer;
		padding: 0 2px;
	}

	.clear-btn:hover {
		color: var(--text-primary);
	}

	.new-doc-top-btn {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		border-radius: 6px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 16px;
		line-height: 1;
		transition: background-color 0.15s ease;
	}

	.new-doc-top-btn:hover {
		background-color: var(--bg-hover);
		border-color: var(--border-bold);
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.tree-section {
		margin-bottom: 10px;
	}

	.section-header {
		display: flex;
		align-items: center;
		padding: 4px 6px;
		border-radius: 6px;
		transition: background-color 0.1s ease;
	}

	.section-header:hover {
		background-color: var(--bg-hover);
	}

	.section-toggle {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		text-align: left;
		padding: 2px 0;
	}

	.arrow {
		font-size: 10px;
		display: inline-block;
		transition: transform 0.15s ease;
		width: 12px;
		text-align: center;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.section-icon {
		font-size: 13px;
	}

	.section-title {
		flex: 1;
	}

	.count-badge {
		font-size: 10px;
		background: var(--bg-active);
		color: var(--text-muted);
		padding: 1px 5px;
		border-radius: 10px;
		margin-left: auto;
		margin-right: 4px;
	}

	.section-add-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
		padding: 2px 4px;
	}

	.section-add-btn:hover {
		color: var(--text-primary);
		background-color: var(--bg-hover);
	}

	.doc-list {
		list-style: none;
		padding: 2px 0 2px 14px;
	}

	.empty-section-item {
		padding: 4px 10px;
		font-size: 11px;
		color: var(--text-muted);
		font-style: italic;
	}

	.doc-item {
		display: flex;
		align-items: center;
		border-radius: 6px;
		margin-bottom: 1px;
		position: relative;
	}

	.doc-item:hover {
		background-color: var(--bg-hover);
	}

	.doc-item.active {
		background-color: var(--bg-active);
	}

	.doc-item.context-active {
		background-color: var(--bg-hover);
		box-shadow: 0 0 0 1px var(--accent-subtle);
	}

	.section-header.nav-selected,
	.doc-item.nav-selected {
		outline: 2px solid var(--accent-primary);
		outline-offset: -2px;
		background-color: var(--bg-hover);
	}

	.doc-link-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: transparent;
		border: none;
		text-align: left;
		padding: 6px 8px;
		cursor: pointer;
		overflow: hidden;
	}

	.doc-item-title-row {
		display: flex;
		align-items: center;
		gap: 6px;
		overflow: hidden;
	}

	.status-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-draft {
		background-color: var(--text-muted);
	}

	.status-in-progress {
		background-color: var(--warning-color);
	}

	.status-revised {
		background-color: #58a6ff;
	}

	.status-completed {
		background-color: var(--success-color);
	}

	.doc-item-title {
		font-size: 13px;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-item.active .doc-item-title {
		font-weight: 600;
		color: var(--accent-hover);
	}

	.doc-item-meta {
		display: flex;
		gap: 6px;
		font-size: 10px;
		color: var(--text-muted);
		padding-left: 12px;
		margin-top: 2px;
	}

	.word-counter {
		font-family: var(--font-editor);
	}

	.tag-label {
		background: var(--bg-tertiary);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.doc-actions-trigger {
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 14px;
		line-height: 1;
		color: var(--text-muted);
		padding: 4px 6px;
		margin-right: 4px;
		border-radius: 4px;
		opacity: 0;
		transition: opacity 0.12s ease, background-color 0.12s ease, color 0.12s ease;
	}

	.doc-item:hover .doc-actions-trigger,
	.doc-item:focus-within .doc-actions-trigger,
	.doc-item.context-active .doc-actions-trigger {
		opacity: 0.8;
	}

	.doc-actions-trigger:hover {
		opacity: 1;
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
	}

	.rename-container {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		padding: 4px 6px;
	}

	.inline-rename-input {
		flex: 1;
		min-width: 0;
		background-color: var(--bg-primary);
		border: 1px solid var(--accent-primary);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		padding: 3px 6px;
		outline: none;
		box-shadow: 0 0 0 1px var(--accent-subtle);
	}

	/* Document Right-Click Context Menu */
	.doc-context-menu {
		position: fixed;
		min-width: 220px;
		background-color: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-bold, #3f4756);
		border-radius: 8px;
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
		padding: 6px;
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: 2px;
		user-select: none;
		animation: contextMenuPop 0.12s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes contextMenuPop {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.context-menu-header {
		padding: 4px 8px 6px 8px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.context-doc-name {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--accent-primary);
	}

	.context-menu-item {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px 8px;
		background: transparent;
		border: none;
		border-radius: 5px;
		color: var(--text-primary);
		font-size: 13px;
		font-family: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.1s ease, color 0.1s ease;
		position: relative;
	}

	.context-menu-item:hover,
	.context-menu-item:focus-visible,
	.context-menu-item.submenu-open {
		background-color: var(--bg-hover);
		color: var(--text-primary);
	}

	.context-menu-item.danger-item:hover,
	.context-menu-item.danger-item:focus-visible {
		background-color: rgba(248, 81, 73, 0.18);
		color: var(--danger-color, #f85149);
	}

	.context-menu-item .item-icon {
		font-size: 13px;
		width: 18px;
		display: flex;
		justify-content: center;
		flex-shrink: 0;
	}

	.context-menu-item .item-text {
		flex: 1;
		white-space: nowrap;
	}

	.context-menu-item kbd {
		font-size: 10px;
		padding: 1px 4px;
		color: var(--text-muted);
		background-color: var(--bg-tertiary);
		border-radius: 3px;
		margin-left: auto;
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
