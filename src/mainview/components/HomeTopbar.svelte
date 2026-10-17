<script lang="ts">
	interface Props {
		onNewProject: () => void;
		onImportProject: () => void;
		onOpenSettings: () => void;
		onOpenShortcuts: () => void;
		onOpenAbout: () => void;
		onShowToast: (msg: string) => void;
	}

	let {
		onNewProject,
		onImportProject,
		onOpenSettings,
		onOpenShortcuts,
		onOpenAbout,
		onShowToast,
	}: Props = $props();

	let activeMenu = $state<string | null>(null);

	function toggleMenu(name: string) {
		activeMenu = activeMenu === name ? null : name;
	}

	function closeMenu() {
		activeMenu = null;
	}

	function handleAction(actionFn: () => void) {
		closeMenu();
		actionFn();
	}

	function handleTodo(featureName: string) {
		closeMenu();
		onShowToast(`${featureName} is planned for a future update (TODO)`);
	}
</script>

<svelte:window
	onclick={(e) => {
		if (activeMenu) {
			const target = e.target as HTMLElement;
			if (!target.closest(".app-menu-bar")) {
				activeMenu = null;
			}
		}
	}}
	onkeydown={(e) => {
		if (activeMenu && e.key === "Escape") {
			activeMenu = null;
		}
	}}
/>

<header class="home-topbar">
	<div class="topbar-left">
		<button
			type="button"
			class="brand-btn"
			onclick={onOpenAbout}
			title="About FictionClosure"
		>
			<span class="brand-icon">🖋️</span>
			<span class="brand-text">FictionClosure</span>
		</button>

		<!-- Standard Application Menus -->
		<nav class="app-menu-bar" aria-label="Application menu">
			<!-- File Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "file"}
					onclick={() => toggleMenu("file")}
					aria-expanded={activeMenu === "file"}
					aria-haspopup="true"
				>
					File
				</button>
				{#if activeMenu === "file"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item" onclick={() => handleAction(onNewProject)}>
							<span>New Project...</span>
							<kbd>Ctrl+N</kbd>
						</button>
						<button type="button" class="dropdown-item" onclick={() => handleAction(onImportProject)}>
							<span>Open / Import Project...</span>
							<kbd>Ctrl+O</kbd>
						</button>
						<div class="menu-divider"></div>
						<button type="button" class="dropdown-item" onclick={() => handleAction(onOpenSettings)}>
							<span>Preferences...</span>
							<kbd>Ctrl+P</kbd>
						</button>
					</div>
				{/if}
			</div>

			<!-- Edit Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "edit"}
					onclick={() => toggleMenu("edit")}
					aria-expanded={activeMenu === "edit"}
					aria-haspopup="true"
				>
					Edit
				</button>
				{#if activeMenu === "edit"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item disabled" disabled>
							<span>Undo</span>
							<kbd>Ctrl+Z</kbd>
						</button>
						<button type="button" class="dropdown-item disabled" disabled>
							<span>Redo</span>
							<kbd>Ctrl+Alt+Z</kbd>
						</button>
						<div class="menu-divider"></div>
						<button type="button" class="dropdown-item" onclick={() => handleAction(onOpenSettings)}>
							<span>Editor Font Settings...</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- View Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "view"}
					onclick={() => toggleMenu("view")}
					aria-expanded={activeMenu === "view"}
					aria-haspopup="true"
				>
					View
				</button>
				{#if activeMenu === "view"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item" onclick={() => handleAction(onOpenShortcuts)}>
							<span>Keyboard Shortcuts Cheatsheet</span>
							<kbd>?</kbd>
						</button>
						<div class="menu-divider"></div>
						<button type="button" class="dropdown-item" onclick={() => handleTodo("Fullscreen Mode")}>
							<span>Toggle Fullscreen [TODO]</span>
							<kbd>F11</kbd>
						</button>
					</div>
				{/if}
			</div>

			<!-- Selection Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "selection"}
					onclick={() => toggleMenu("selection")}
					aria-expanded={activeMenu === "selection"}
					aria-haspopup="true"
				>
					Selection
				</button>
				{#if activeMenu === "selection"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item" onclick={() => handleTodo("Multi-select")}>
							<span>Select All Projects [TODO]</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- Tools Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "tools"}
					onclick={() => toggleMenu("tools")}
					aria-expanded={activeMenu === "tools"}
					aria-haspopup="true"
				>
					Tools
				</button>
				{#if activeMenu === "tools"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item" onclick={() => handleAction(onImportProject)}>
							<span>Validate & Analyze Project Structure...</span>
						</button>
						<button type="button" class="dropdown-item" onclick={() => handleTodo("Extension Manager")}>
							<span>Extensions Manager [TODO]</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- Help Menu -->
			<div class="menu-item-wrapper">
				<button
					type="button"
					class="menu-bar-btn"
					class:active={activeMenu === "help"}
					onclick={() => toggleMenu("help")}
					aria-expanded={activeMenu === "help"}
					aria-haspopup="true"
				>
					Help
				</button>
				{#if activeMenu === "help"}
					<div class="menu-dropdown" role="menu">
						<button type="button" class="dropdown-item" onclick={() => handleAction(onOpenShortcuts)}>
							<span>Keyboard Shortcuts</span>
							<kbd>?</kbd>
						</button>
						<button type="button" class="dropdown-item" onclick={() => handleTodo("Tutorial Guide")}>
							<span>Tutorial Guide [TODO]</span>
						</button>
						<button type="button" class="dropdown-item" onclick={() => handleTodo("Documentation")}>
							<span>Documentation [TODO]</span>
						</button>
						<div class="menu-divider"></div>
						<button type="button" class="dropdown-item" onclick={() => handleAction(onOpenAbout)}>
							<span>About FictionClosure</span>
						</button>
					</div>
				{/if}
			</div>

			<!-- FictionClosure (Direct About Page trigger) -->
			<button
				type="button"
				class="menu-bar-btn fc-about-btn"
				onclick={onOpenAbout}
				title="Open About FictionClosure Page"
			>
				FictionClosure
			</button>
		</nav>
	</div>

	<!-- Topbar Right Controls -->
	<div class="topbar-right">
		<!-- Tutorial Button (Marked as TODO) -->
		<button
			type="button"
			class="action-pill-btn todo-btn"
			onclick={() => handleTodo("Interactive Writing Tutorial")}
			title="Tutorial: interactive walkthrough for authors [TODO]"
		>
			<span class="btn-icon">💡</span>
			<span>Tutorial</span>
			<span class="todo-pill">TODO</span>
		</button>

		<!-- Document Button (Marked as TODO) -->
		<button
			type="button"
			class="action-pill-btn todo-btn"
			onclick={() => handleTodo("Product Documentation & Guides")}
			title="Documentation: Markdown syntax and writing guidelines [TODO]"
		>
			<span class="btn-icon">📚</span>
			<span>Docs</span>
			<span class="todo-pill">TODO</span>
		</button>

		<!-- Settings Button -->
		<button
			type="button"
			class="icon-action-btn"
			onclick={onOpenSettings}
			title="Preferences & Settings (Ctrl+P)"
			aria-label="Settings"
		>
			⚙️
		</button>
	</div>
</header>

<style>
	.home-topbar {
		height: var(--header-height, 46px);
		background-color: var(--bg-secondary, #161b22);
		border-bottom: 1px solid var(--border-subtle, #30363d);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 14px;
		user-select: none;
		position: relative;
		z-index: 50;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.brand-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 6px;
		transition: background-color 0.15s ease;
	}

	.brand-btn:hover {
		background-color: var(--bg-hover, rgba(255, 255, 255, 0.08));
	}

	.brand-icon {
		font-size: 18px;
	}

	.brand-text {
		font-size: 14px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		letter-spacing: -0.01em;
	}

	.app-menu-bar {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.menu-item-wrapper {
		position: relative;
	}

	.menu-bar-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary, #c9d1d9);
		font-size: 12px;
		padding: 5px 8px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.menu-bar-btn:hover,
	.menu-bar-btn.active {
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
		color: var(--text-primary, #e6edf3);
	}

	.fc-about-btn {
		color: var(--accent-primary, #e69d45);
		font-weight: 600;
	}

	.fc-about-btn:hover {
		color: var(--accent-hover, #f0b060);
	}

	.menu-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		min-width: 220px;
		background: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 6px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		padding: 4px;
		z-index: 100;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 10px;
		background: transparent;
		border: none;
		border-radius: 4px;
		color: var(--text-primary, #e6edf3);
		font-size: 12px;
		cursor: pointer;
		text-align: left;
		width: 100%;
		box-sizing: border-box;
	}

	.dropdown-item:hover:not(.disabled) {
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
	}

	.dropdown-item.disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.dropdown-item kbd {
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 3px;
		padding: 1px 5px;
		font-size: 10px;
		font-family: var(--font-editor, monospace);
		color: var(--text-muted, #8b949e);
	}

	.menu-divider {
		height: 1px;
		background: var(--border-subtle, #30363d);
		margin: 3px 0;
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-pill-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		color: var(--text-secondary, #c9d1d9);
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.action-pill-btn:hover {
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--accent-primary, #e69d45);
		color: var(--text-primary, #e6edf3);
	}

	.btn-icon {
		font-size: 13px;
	}

	.todo-pill {
		font-size: 9px;
		font-weight: 700;
		padding: 1px 4px;
		border-radius: 3px;
		background: rgba(210, 153, 34, 0.2);
		color: var(--warning-color, #d29922);
		border: 1px solid rgba(210, 153, 34, 0.4);
		letter-spacing: 0.05em;
	}

	.icon-action-btn {
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		color: var(--text-secondary, #c9d1d9);
		border-radius: 6px;
		padding: 4px 8px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.icon-action-btn:hover {
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--accent-primary, #e69d45);
		color: var(--text-primary, #e6edf3);
	}
</style>
