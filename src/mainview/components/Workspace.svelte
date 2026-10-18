<script lang="ts">
	import { onMount } from "svelte";
	import type { DocumentType, FictionDocument, ProjectInfo, SaveState, ViewMode, ZenModeType } from "../../shared/types";
	import {
		promptSelectFolder,
		saveProject,
		setRememberedFolder,
		saveCrashCache,
		clearCrashCache,
		LOCAL_STORAGE_STACKS,
	} from "../services/storage";
	import { globalHistoryManager } from "../services/historyManager";
	import Header from "./Header.svelte";
	import Sidebar from "./Sidebar.svelte";
	import Editor from "./Editor.svelte";
	import Preview from "./Preview.svelte";
	import Inspector from "./Inspector.svelte";
	import CommandPalette from "./CommandPalette.svelte";
	import NewDocModal from "./NewDocModal.svelte";

	interface Props {
		project: ProjectInfo;
		documents: FictionDocument[];
		editorFont?: string;
		onCloseProject: () => void;
		onOpenSettings: () => void;
		onOpenShortcuts: () => void;
		onProjectSaved?: (project: ProjectInfo, documents: FictionDocument[]) => void;
		onShowToast: (msg: string) => void;
	}

	let {
		project = $bindable(),
		documents = $bindable([]),
		editorFont = "",
		onCloseProject,
		onOpenSettings,
		onOpenShortcuts,
		onProjectSaved,
		onShowToast,
	}: Props = $props();

	let activeDocId = $state<string | null>(documents[0]?.id ?? null);
	let saveState = $state<SaveState>("saved");
	let viewMode = $state<ViewMode>("split");
	let isSidebarOpen = $state(true);
	let showInspector = $state(true);
	let zenMode = $state<ZenModeType>("none");
	let isCommandPaletteOpen = $state(false);
	let isNewDocModalOpen = $state(false);
	let wordWrap = $state<boolean>(true);
	let sidebarRef = $state<ReturnType<typeof Sidebar> | null>(null);
	let newDocInitialType = $state<DocumentType>("manuscript");

	let preZenState = { sidebar: true, inspector: true };

	// Active document derived from id
	const activeDoc = $derived(documents.find((d) => d.id === activeDocId) ?? null);

	// Ensure activeDocId always points to a valid document in current project
	$effect(() => {
		if (documents.length > 0) {
			if (!activeDocId || !documents.some((d) => d.id === activeDocId)) {
				activeDocId = documents[0].id;
			}
		} else {
			activeDocId = null;
		}
	});

	function toggleWordWrap() {
		wordWrap = !wordWrap;
		onShowToast(wordWrap ? "Word wrap enabled" : "Word wrap disabled");
	}

	function setZenMode(target: ZenModeType) {
		if (zenMode === target) {
			exitZenMode();
			return;
		}

		if (zenMode === "none") {
			preZenState = { sidebar: isSidebarOpen, inspector: showInspector };
		}

		zenMode = target;
		isSidebarOpen = false;
		showInspector = false;

		if (target === "zen") {
			onShowToast("Zen mode enabled (Press Esc or Ctrl+\\ to exit)");
		} else if (target === "focus") {
			onShowToast("Focus Zen mode enabled (Press Esc or Ctrl+Shift+\\ to exit)");
		} else if (target === "czm") {
			onShowToast("Concentrate Zen mode enabled (Press Esc to exit)");
		}
	}

	function exitZenMode() {
		if (zenMode !== "none") {
			isSidebarOpen = preZenState.sidebar;
			showInspector = preZenState.inspector;
			zenMode = "none";
			onShowToast("Exited Zen mode");
		}
	}

	function toggleZenMode(target: ZenModeType = "zen") {
		if (zenMode === target) {
			exitZenMode();
		} else {
			setZenMode(target);
		}
	}

	onMount(() => {
		// Sync max stack size with project targetWordCount
		globalHistoryManager.setTargetWordCount(project.targetWordCount);
		if (!activeDocId && documents.length > 0) {
			activeDocId = documents[0].id;
		}
	});

	let crashCacheTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleCrashCache() {
		if (!project.folderPath) return;
		if (crashCacheTimer) clearTimeout(crashCacheTimer);
		crashCacheTimer = setTimeout(() => {
			if (saveState === "unsaved" && project.folderPath) {
				void saveCrashCache(project.folderPath, project, documents);
			}
		}, 800);
	}

	function handleContentChange(newContent: string) {
		if (!activeDoc) return;
		activeDoc.content = newContent;
		activeDoc.updatedAt = new Date().toISOString();
		saveState = "unsaved";
		scheduleCrashCache();
	}

	async function handleSave() {
		if (saveState === "saving") return;

		// If no folder path yet, prompt user
		if (!project.folderPath) {
			const selectRes = await promptSelectFolder();
			if (selectRes.canceled || !selectRes.folderPath) {
				onShowToast("Save canceled: no destination folder selected");
				return;
			}
			project.folderPath = selectRes.folderPath;
			await setRememberedFolder(selectRes.folderPath);
		}

		saveState = "saving";
		const stacks = globalHistoryManager.exportAllStacks(project.targetWordCount);

		const res = await saveProject(project.folderPath, project, documents, stacks);

		if (res.success) {
			saveState = "saved";
			project.lastSaved = res.savedAt;
			if (crashCacheTimer) clearTimeout(crashCacheTimer);
			if (project.folderPath) {
				await clearCrashCache(project.folderPath);
			}
			onProjectSaved?.(project, documents);
			onShowToast(`Saved to ${project.folderPath}`);
		} else {
			saveState = "error";
			onShowToast(`Save failed: ${res.error || "Unknown error"}`);
		}
	}

	async function handleChangeFolder() {
		const res = await promptSelectFolder(project.folderPath);
		if (res.canceled || !res.folderPath) return;

		project.folderPath = res.folderPath;
		await setRememberedFolder(res.folderPath);
		await handleSave();
	}

	function handleSelectDoc(id: string) {
		if (activeDocId !== id) {
			if (saveState === "unsaved" && project.folderPath) {
				void handleSave();
			}
			activeDocId = id;
		}
	}

	function handleNavigateToDocTitle(title: string) {
		const targetLower = title.trim().toLowerCase();
		const matched = documents.find((d) => d.title.toLowerCase() === targetLower);
		if (matched) {
			handleSelectDoc(matched.id);
		} else {
			if (confirm(`Document "${title}" not found. Create it now?`)) {
				const newDoc: FictionDocument = {
					id: `doc-${Date.now()}`,
					title: title.trim(),
					type: "world",
					status: "draft",
					tags: [],
					order: documents.length + 1,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					content: `# ${title.trim()}\n\nAdd your notes for ${title} here...\n`,
				};
				documents.push(newDoc);
				activeDocId = newDoc.id;
				void handleSave();
			}
		}
	}

	function handleOpenNewDocModal(type: DocumentType = "manuscript") {
		newDocInitialType = type;
		isNewDocModalOpen = true;
	}

	function handleCreateDoc(newDoc: FictionDocument) {
		documents.push(newDoc);
		activeDocId = newDoc.id;
		void handleSave();
	}

	function handleDeleteDoc(id: string) {
		const idx = documents.findIndex((d) => d.id === id);
		if (idx !== -1) {
			documents.splice(idx, 1);
			if (activeDocId === id) {
				activeDocId = documents[0]?.id ?? null;
			}
			void handleSave();
		}
	}

	function handleUpdateDocMeta(updates: Partial<FictionDocument>) {
		if (!activeDoc) return;
		Object.assign(activeDoc, updates);
		activeDoc.updatedAt = new Date().toISOString();
		saveState = "unsaved";
		scheduleCrashCache();
	}

	function handleRenameDoc(id: string, newTitle: string) {
		const doc = documents.find((d) => d.id === id);
		if (!doc || !newTitle.trim()) return;
		doc.title = newTitle.trim();
		doc.updatedAt = new Date().toISOString();
		saveState = "unsaved";
		onShowToast(`Renamed to "${doc.title}"`);
		void handleSave();
	}

	function handleDuplicateDoc(id: string) {
		const doc = documents.find((d) => d.id === id);
		if (!doc) return;
		const newDoc: FictionDocument = {
			id: `doc-${Date.now()}`,
			title: `${doc.title} (Copy)`,
			type: doc.type,
			status: doc.status,
			tags: [...doc.tags],
			order: doc.order + 1,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			content: doc.content,
			pov: doc.pov,
			summary: doc.summary,
		};
		const idx = documents.findIndex((d) => d.id === id);
		if (idx !== -1) {
			documents.splice(idx + 1, 0, newDoc);
		} else {
			documents.push(newDoc);
		}
		activeDocId = newDoc.id;
		saveState = "unsaved";
		onShowToast(`Duplicated "${doc.title}"`);
		void handleSave();
	}

	function handleOpenInspector(id: string) {
		activeDocId = id;
		showInspector = true;
	}

	async function handleCloseAndReturn() {
		if (saveState === "unsaved" && project.folderPath) {
			await handleSave();
		}
		onCloseProject();
	}

	function handleGlobalKeyDown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		const isTyping =
			target.tagName === "INPUT" ||
			target.tagName === "TEXTAREA" ||
			target.isContentEditable;

		const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
		const modPressed = isMac ? e.metaKey : e.ctrlKey;

		// Escape closes open modals or floating drawers in order of depth
		if (e.key === "Escape") {
			if (isCommandPaletteOpen) {
				e.preventDefault();
				isCommandPaletteOpen = false;
				return;
			}
			if (isNewDocModalOpen) {
				e.preventDefault();
				isNewDocModalOpen = false;
				return;
			}
			if (zenMode !== "none") {
				e.preventDefault();
				exitZenMode();
				return;
			}
			if (showInspector) {
				e.preventDefault();
				showInspector = false;
				return;
			}
		}

		// Help cheatsheet: ?
		if (e.key === "?" && !isTyping && !modPressed) {
			e.preventDefault();
			onOpenShortcuts();
			return;
		}

		// Focus Sidebar: Ctrl+Tab
		if (modPressed && (e.key === "Tab" || e.code === "Tab" || e.keyCode === 9)) {
			e.preventDefault();
			if (!isSidebarOpen) {
				isSidebarOpen = true;
			}
			setTimeout(() => {
				sidebarRef?.focusSidebar();
			}, 30);
			return;
		}

		// View Mode: Edit (Ctrl+1)
		if (modPressed && !e.altKey && !e.shiftKey && e.key === "1") {
			e.preventDefault();
			viewMode = "editor";
			onShowToast("Switched to Edit mode");
			return;
		}

		// View Mode: Split (Ctrl+2)
		if (modPressed && !e.altKey && !e.shiftKey && e.key === "2") {
			e.preventDefault();
			viewMode = "split";
			onShowToast("Switched to Split mode");
			return;
		}

		// View Mode: Read (Ctrl+3)
		if (modPressed && !e.altKey && !e.shiftKey && e.key === "3") {
			e.preventDefault();
			viewMode = "preview";
			onShowToast("Switched to Read mode");
			return;
		}

		// Toggle word wrap: Ctrl+W
		if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "w") {
			e.preventDefault();
			toggleWordWrap();
			return;
		}

		// Settings modal: Ctrl+P
		if (modPressed && !e.altKey && e.key.toLowerCase() === "p") {
			e.preventDefault();
			onOpenSettings();
			return;
		}

		// Sidebar toggle: Ctrl+Alt+B
		if (modPressed && e.altKey && e.key.toLowerCase() === "b") {
			e.preventDefault();
			isSidebarOpen = !isSidebarOpen;
			return;
		}

		// Inspector toggle: Ctrl+J
		if (modPressed && e.key.toLowerCase() === "j") {
			e.preventDefault();
			showInspector = !showInspector;
			return;
		}

		// Zen Mode: Ctrl+\
		if (modPressed && !e.shiftKey && !e.altKey && (e.key === "\\" || e.code === "Backslash")) {
			e.preventDefault();
			toggleZenMode("zen");
			return;
		}

		// Focus Zen Mode: Ctrl+Shift+\
		if (modPressed && e.shiftKey && !e.altKey && (e.key === "\\" || e.key === "|" || e.code === "Backslash")) {
			e.preventDefault();
			toggleZenMode("focus");
			return;
		}

		// Concentrate Zen Mode (CZM): Ctrl+Alt+\
		if (modPressed && e.altKey && !e.shiftKey && (e.key === "\\" || e.code === "Backslash")) {
			e.preventDefault();
			toggleZenMode("czm");
			return;
		}

		// Command palette: Ctrl+K
		if (modPressed && e.key.toLowerCase() === "k") {
			e.preventDefault();
			isCommandPaletteOpen = !isCommandPaletteOpen;
			return;
		}

		// Save As / Change Folder: Ctrl+Shift+S
		if (modPressed && e.shiftKey && e.key.toLowerCase() === "s") {
			e.preventDefault();
			void handleChangeFolder();
			return;
		}

		// Save: Ctrl+S
		if (modPressed && !e.shiftKey && e.key.toLowerCase() === "s") {
			e.preventDefault();
			void handleSave();
			return;
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="fictionclosure-workspace" class:zen-active={zenMode !== "none"} class:czm-active={zenMode === "czm"}>
	<!-- Workspace Topbar: hidden in CZM -->
	{#if zenMode !== "czm"}
		<Header
			projectName={project.name}
			folderPath={project.folderPath}
			lastSaved={project.lastSaved}
			{activeDoc}
			{saveState}
			{viewMode}
			{isSidebarOpen}
			onToggleSidebar={() => (isSidebarOpen = !isSidebarOpen)}
			{zenMode}
			onSelectZenMode={setZenMode}
			{showInspector}
			onToggleInspector={() => (showInspector = !showInspector)}
			onSetViewMode={(mode) => (viewMode = mode)}
			onSave={handleSave}
			onChangeFolder={handleChangeFolder}
			onOpenCommandPalette={() => (isCommandPaletteOpen = true)}
			onOpenShortcuts={onOpenShortcuts}
			onCloseProject={handleCloseAndReturn}
		/>
	{/if}

	<!-- Main Workspace Split -->
	<div class="workspace-main">
		<!-- Left: Document Tree Sidebar (collapsible) -->
		{#if isSidebarOpen}
			<Sidebar
				bind:this={sidebarRef}
				{documents}
				targetWordCount={project.targetWordCount}
				{activeDocId}
				folderPath={project.folderPath}
				onSelectDoc={handleSelectDoc}
				onNewDoc={handleOpenNewDocModal}
				onDeleteDoc={handleDeleteDoc}
				onRenameDoc={handleRenameDoc}
				onDuplicateDoc={handleDuplicateDoc}
				onOpenInspector={handleOpenInspector}
				onShowToast={onShowToast}
			/>
		{/if}

		<!-- Center: Main Writing & Reading Surface -->
		<main class="center-stage view-{viewMode}">
			{#if activeDoc}
				{#if viewMode === "editor" || viewMode === "split" || zenMode !== "none"}
					<section class="pane pane-editor" aria-label="Editor">
						<Editor
							document={activeDoc}
							customFont={editorFont}
							{wordWrap}
							{zenMode}
							onContentChange={handleContentChange}
							onSave={handleSave}
							onToggleWordWrap={toggleWordWrap}
							onToggleZenMode={toggleZenMode}
							onExitZen={exitZenMode}
						/>
					</section>
				{/if}

				{#if viewMode === "split" && zenMode === "none"}
					<div class="pane-divider" aria-hidden="true"></div>
				{/if}

				{#if (viewMode === "preview" || viewMode === "split") && zenMode === "none"}
					<section class="pane pane-preview" aria-label="Reading Preview">
						<Preview
							document={activeDoc}
							onSelectWikilink={handleNavigateToDocTitle}
						/>
					</section>
				{/if}
			{:else}
				<div class="empty-state">
					<div class="empty-card">
						<span class="empty-icon">🖋️</span>
						<h2>No Document Selected</h2>
						<p>Select a chapter, character sheet, or lore note from the sidebar, or create a new one to begin writing.</p>
						<button
							type="button"
							class="create-btn"
							onclick={() => handleOpenNewDocModal("manuscript")}
						>
							Create New Document
						</button>
					</div>
				</div>
			{/if}
		</main>

		<!-- Right: Document Inspector / Metadata Drawer (collapsible) -->
		{#if showInspector && activeDoc && zenMode === "none"}
			<Inspector
				document={activeDoc}
				allDocuments={documents}
				onUpdateDocMeta={handleUpdateDocMeta}
				onNavigateToDocTitle={handleNavigateToDocTitle}
				onClose={() => (showInspector = false)}
			/>
		{/if}
	</div>

	<!-- Quick Command Palette Modal (Ctrl+K) -->
	<CommandPalette
		isOpen={isCommandPaletteOpen}
		{documents}
		onClose={() => (isCommandPaletteOpen = false)}
		onSelectDoc={handleSelectDoc}
		onNewDoc={handleOpenNewDocModal}
		onSave={handleSave}
		onOpenSettings={onOpenSettings}
		onOpenShortcuts={onOpenShortcuts}
	/>

	<!-- Create New Document Modal -->
	<NewDocModal
		isOpen={isNewDocModalOpen}
		initialType={newDocInitialType}
		onClose={() => (isNewDocModalOpen = false)}
		onCreate={handleCreateDoc}
		existingCount={documents.length}
	/>
</div>

<style>
	.fictionclosure-workspace {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
		background-color: var(--bg-primary, #0d1117);
		position: relative;
	}

	.workspace-main {
		display: flex;
		flex: 1;
		height: calc(100vh - var(--header-height, 46px));
		overflow: hidden;
		position: relative;
	}

	.czm-active .workspace-main {
		height: 100vh;
	}

	.center-stage {
		flex: 1;
		display: flex;
		height: 100%;
		overflow: hidden;
		background-color: var(--bg-primary, #0d1117);
		position: relative;
		transition: all 0.2s ease;
	}

	.zen-active .center-stage {
		max-width: 900px;
		margin: 0 auto;
	}

	.czm-active .center-stage {
		max-width: 100%;
		margin: 0;
	}

	.pane {
		height: 100%;
		overflow: hidden;
	}

	.view-editor .pane-editor {
		flex: 1;
		width: 100%;
	}

	.view-preview .pane-preview {
		flex: 1;
		width: 100%;
	}

	.view-split .pane-editor {
		flex: 1;
		width: 50%;
	}

	.view-split .pane-preview {
		flex: 1;
		width: 50%;
	}

	.pane-divider {
		width: 1px;
		background-color: var(--border-subtle, #30363d);
		height: 100%;
		flex-shrink: 0;
	}

	.empty-state {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-primary, #0d1117);
	}

	.empty-card {
		text-align: center;
		max-width: 360px;
		padding: 32px;
		background-color: var(--bg-secondary, #161b22);
		border: 1px dashed var(--border-subtle, #30363d);
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.empty-icon {
		font-size: 36px;
	}

	.empty-card h2 {
		font-size: 16px;
		color: var(--text-primary, #e6edf3);
		margin: 0;
	}

	.empty-card p {
		font-size: 13px;
		color: var(--text-muted, #8b949e);
		line-height: 1.5;
		margin: 0;
	}

	.create-btn {
		margin-top: 8px;
		background: var(--accent-primary, #e69d45);
		color: #12151a;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.create-btn:hover {
		background: var(--accent-hover, #f0b060);
	}
</style>
