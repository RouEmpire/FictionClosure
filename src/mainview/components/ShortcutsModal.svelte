<script lang="ts">
	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

	const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
	const mod = isMac ? "⌘" : "Ctrl";

	const shortcutGroups = [
		{
			title: "General & Navigation",
			shortcuts: [
				{ keys: [`${mod}`, "K"], desc: "Open quick command palette / search documents" },
				{ keys: [`${mod}`, "P"], desc: "Open Preferences & Settings menu" },
				{ keys: ["?"], desc: "Open this keyboard shortcuts cheatsheet" },
				{ keys: ["Esc"], desc: "Close open modal or floating pane" },
			],
		},
		{
			title: "Document & File Management",
			shortcuts: [
				{ keys: [`${mod}`, "S"], desc: "Save project and current document to folder" },
				{ keys: [`${mod}`, "Shift", "S"], desc: "Change project save folder (Save As...)" },
			],
		},
		{
			title: "Workspace & View Panels",
			shortcuts: [
				{ keys: [`${mod}`, "1"], desc: "Switch to Edit view" },
				{ keys: [`${mod}`, "2"], desc: "Switch to Split view" },
				{ keys: [`${mod}`, "3"], desc: "Switch to Read view" },
				{ keys: [`${mod}`, "W"], desc: "Toggle editor word wrap" },
				{ keys: [`${mod}`, "Alt", "B"], desc: "Toggle document tree sidebar" },
				{ keys: [`${mod}`, "J"], desc: "Toggle document inspector drawer" },
				{ keys: [`${mod}`, "\\"], desc: "Toggle Zen Mode (centered canvas)" },
				{ keys: [`${mod}`, "Shift", "\\"], desc: "Toggle Focus Zen Mode (dims non-active paragraphs 50%)" },
				{ keys: [`${mod}`, "Alt", "\\"], desc: "Toggle Concentrate Zen Mode (CZM) (pure textarea only)" },
			],
		},
		{
			title: "Sidebar Tree Navigation",
			shortcuts: [
				{ keys: [`${mod}`, "Tab"], desc: "Focus sidebar tree" },
				{ keys: ["↑ / ↓", "W / S"], desc: "Navigate folders and documents" },
				{ keys: ["← / →", "A / D"], desc: "Collapse / expand selected folder" },
				{ keys: ["Enter / Space"], desc: "Select document or toggle folder" },
				{ keys: [`${mod}`, "N"], desc: "Create new file in selected folder" },
			],
		},
		{
			title: "Text Formatting & Markdown",
			shortcuts: [
				{ keys: [`${mod}`, "B"], desc: "Bold selected text (**)" },
				{ keys: [`${mod}`, "I"], desc: "Italicize selected text (*)" },
				{ keys: [`${mod}`, "L"], desc: "Wrap selected text in Wikilink ([[ ]])" },
				{ keys: [`${mod}`, "Q"], desc: "Toggle blockquote prefix (> )" },
				{ keys: [`${mod}`, "-"], desc: "Toggle bullet list item (- )" },
				{ keys: [`${mod}`, "Alt", "T"], desc: "Insert task checkbox for paragraph (- [ ])" },
				{ keys: [`${mod}`, "T"], desc: "Toggle task checkbox between [ ] and [x]" },
			],
		},
		{
			title: "Editor & Gutter Navigation",
			shortcuts: [
				{ keys: [`${mod}`, "Z"], desc: "Undo edit" },
				{ keys: [`${mod}`, "Alt", "Z"], desc: "Redo edit" },
				{ keys: ["Click"], desc: "Click gutter row to jump cursor to start of line" },
				{ keys: ["Alt", "Click"], desc: "Alt+Click gutter row to jump cursor to end of line" },
				{ keys: ["Tab"], desc: "Indent by 2 spaces (keeps focus in editor)" },
				{ keys: ["[[", "]]"], desc: "Wikilink reference to another character, lore, or chapter" },
			],
		},
	];

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
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
			aria-labelledby="shortcuts-title"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<div class="modal-header">
				<div class="header-title-box">
					<span class="header-icon"><i class="fa-solid fa-keyboard"></i></span>
					<h2 id="shortcuts-title" class="modal-heading">Keyboard Shortcuts</h2>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
			</div>

			<div class="modal-body">
				{#each shortcutGroups as group}
					<div class="shortcut-group">
						<h3 class="group-heading">{group.title}</h3>
						<div class="shortcuts-grid">
							{#each group.shortcuts as sc}
								<div class="shortcut-row">
									<span class="shortcut-desc">{sc.desc}</span>
									<div class="shortcut-keys">
										{#each sc.keys as k}
											<kbd>{k}</kbd>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-footer">
				<span class="footer-tip">Tip: Press <kbd>?</kbd> anytime to view this guide</span>
				<button type="button" class="btn primary" onclick={onClose}>Done</button>
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
		max-width: 540px;
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

	.header-title-box {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-icon {
		font-size: 16px;
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
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-height: 60vh;
		overflow-y: auto;
	}

	.shortcut-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-heading {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-primary);
		margin: 0;
	}

	.shortcuts-grid {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.shortcut-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 4px 6px;
		border-radius: 4px;
		background: var(--bg-tertiary);
	}

	.shortcut-desc {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	kbd {
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
		font-family: var(--font-editor);
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
	}

	.modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 18px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.footer-tip {
		font-size: 11px;
		color: var(--text-muted);
	}

	.btn.primary {
		background: var(--accent-primary);
		color: #000;
		font-weight: 600;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}
</style>
