<script lang="ts">
	import type { DocumentType, FictionDocument } from "../types";
	import { calculateWordCount } from "../utils/markdown";

	interface Props {
		documents: FictionDocument[];
		targetWordCount?: number;
		activeDocId: string | null;
		onSelectDoc: (id: string) => void;
		onNewDoc: (type?: DocumentType) => void;
		onDeleteDoc: (id: string) => void;
	}

	let {
		documents,
		targetWordCount = 80000,
		activeDocId,
		onSelectDoc,
		onNewDoc,
		onDeleteDoc,
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

	function handleKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		// If actively typing in the filter input, do not intercept WASD/arrows
		if (target.tagName === "INPUT") {
			if (e.key === "Escape") {
				target.blur();
				sidebarEl?.focus();
			}
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
								{@const words = calculateWordCount(doc.content)}
								<li
									class="doc-item"
									class:active={isActive}
									class:nav-selected={isFocused && visibleNavItems[selectedIndex]?.kind === "doc" && visibleNavItems[selectedIndex]?.id === doc.id}
									role="treeitem"
									aria-selected={isActive}
								>
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
										class="doc-delete-btn"
										onclick={(e) => {
											e.stopPropagation();
											if (confirm(`Delete "${doc.title}"?`)) {
												onDeleteDoc(doc.id);
											}
										}}
										title="Delete document"
									>
										🗑️
									</button>
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

		<div class="stat-row">
			<span class="stat-label">Total Documents:</span>
			<span class="stat-val">{documents.length}</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		background-color: var(--bg-secondary);
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		height: calc(100vh - var(--header-height));
		user-select: none;
	}

	.sidebar-search {
		padding: 10px;
		display: flex;
		gap: 6px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.search-box {
		flex: 1;
		display: flex;
		align-items: center;
		background-color: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		padding: 4px 8px;
		gap: 6px;
	}

	.search-glyph {
		font-size: 11px;
		color: var(--text-muted);
	}

	.search-box input {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 12px;
	}

	.search-box input::placeholder {
		color: var(--text-muted);
	}

	.clear-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 11px;
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
		font-weight: 500;
		transition: all 0.15s ease;
	}

	.new-doc-top-btn:hover {
		background: var(--accent-subtle);
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 8px 6px;
	}

	.tree-section {
		margin-bottom: 8px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 6px;
		border-radius: 4px;
	}

	.section-header:hover {
		background-color: var(--bg-tertiary);
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
	}

	.arrow {
		display: inline-block;
		transition: transform 0.15s ease;
		font-size: 10px;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.section-icon {
		font-size: 12px;
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

	.doc-delete-btn {
		display: none;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 11px;
		padding: 4px;
		margin-right: 4px;
		border-radius: 4px;
		opacity: 0.7;
	}

	.doc-item:hover .doc-delete-btn {
		display: block;
	}

	.doc-delete-btn:hover {
		opacity: 1;
		background-color: rgba(248, 81, 73, 0.2);
	}

	.sidebar-footer {
		padding: 12px 14px;
		background-color: var(--bg-tertiary);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 11px;
	}

	.progress-box {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.progress-label-row {
		display: flex;
		justify-content: space-between;
		font-size: 10px;
	}

	.progress-title {
		color: var(--accent-primary);
		font-weight: 600;
	}

	.progress-nums {
		color: var(--text-muted);
		font-family: var(--font-editor);
	}

	.progress-bar-track {
		width: 100%;
		height: 5px;
		background-color: var(--bg-active);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
	}

	.stat-label {
		color: var(--text-muted);
	}

	.stat-val {
		color: var(--text-secondary);
		font-family: var(--font-editor);
		font-weight: 500;
	}
</style>
