<script lang="ts">
	interface Props {
		isOpen: boolean;
		currentFont: string;
		onClose: () => void;
		onFontChange: (font: string) => void;
	}

	let { isOpen, currentFont, onClose, onFontChange }: Props = $props();

	let selectedFontInput = $state("");
	let activeTab = $state<"editor" | "appearance" | "persistence" | "keybindings">("editor");

	$effect(() => {
		if (isOpen) {
			selectedFontInput = currentFont;
		}
	});

	const fontPresets = [
		{ name: "Default (System Editor)", value: "" },
		{ name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
		{ name: "Fira Code", value: "'Fira Code', monospace" },
		{ name: "Courier Prime", value: "'Courier Prime', 'Courier New', monospace" },
		{ name: "Merriweather", value: "'Merriweather', Georgia, serif" },
		{ name: "Georgia", value: "Georgia, 'Times New Roman', serif" },
		{ name: "Inter / Clean Sans", value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
	];

	function applyFont(fontValue: string) {
		selectedFontInput = fontValue;
		onFontChange(fontValue);
	}

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
			class="settings-modal"
			role="dialog"
			aria-modal="true"
			aria-labelledby="settings-heading"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<!-- Header -->
			<div class="settings-header">
				<div class="title-row">
					<span class="settings-icon">⚙️</span>
					<h2 id="settings-heading" class="settings-title">Preferences & Settings</h2>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close settings">✕</button>
			</div>

			<!-- Main Content with Sidebar Tabs -->
			<div class="settings-content">
				<!-- Settings Navigation -->
				<nav class="settings-tabs" aria-label="Settings categories">
					<button
						type="button"
						class="tab-btn"
						class:active={activeTab === "editor"}
						onclick={() => (activeTab = "editor")}
					>
						<span>🖋️</span> Editor & Typography
					</button>

					<button
						type="button"
						class="tab-btn"
						class:active={activeTab === "appearance"}
						onclick={() => (activeTab = "appearance")}
					>
						<span>🎨</span> Appearance <span class="badge-todo">TODO</span>
					</button>

					<button
						type="button"
						class="tab-btn"
						class:active={activeTab === "persistence"}
						onclick={() => (activeTab = "persistence")}
					>
						<span>💾</span> Storage & Backups <span class="badge-todo">TODO</span>
					</button>

					<button
						type="button"
						class="tab-btn"
						class:active={activeTab === "keybindings"}
						onclick={() => (activeTab = "keybindings")}
					>
						<span>⌨️</span> Keybindings & Vim <span class="badge-todo">TODO</span>
					</button>
				</nav>

				<!-- Settings Tab Body -->
				<div class="settings-panel">
					{#if activeTab === "editor"}
						<section class="section">
							<h3 class="section-title">Editor Typography</h3>
							<p class="section-desc">
								Customize the font family used across the writing canvas. This applies simultaneously to the editor text and the line number gutter for synchronized alignment.
							</p>

							<!-- Custom font input -->
							<div class="setting-item">
								<label for="custom-font-input" class="setting-label">Custom Font Family</label>
								<div class="input-with-button">
									<input
										id="custom-font-input"
										type="text"
										class="text-input"
										placeholder="e.g. 'Fira Code', 'Courier Prime', Georgia, monospace"
										bind:value={selectedFontInput}
										oninput={() => onFontChange(selectedFontInput)}
									/>
									{#if selectedFontInput}
										<button
											type="button"
											class="btn-reset"
											onclick={() => applyFont("")}
											title="Reset to default font"
										>
											Reset
										</button>
									{/if}
								</div>
								<span class="setting-hint">Enter any font installed on your system. Changes apply immediately and are remembered automatically.</span>
							</div>

							<!-- Quick Presets -->
							<div class="setting-item">
								<div class="setting-label">Font Presets</div>
								<div class="presets-grid">
									{#each fontPresets as preset}
										{@const isActive = selectedFontInput === preset.value}
										<button
											type="button"
											class="preset-btn"
											class:active={isActive}
											onclick={() => applyFont(preset.value)}
										>
											<span class="preset-name">{preset.name}</span>
											<span class="preset-sample" style="font-family: {preset.value || 'inherit'}">
												The quick brown fox 123
											</span>
										</button>
									{/each}
								</div>
							</div>

							<!-- Live Preview -->
							<div class="setting-item">
								<div class="setting-label">Live Preview</div>
								<div class="preview-box" style="font-family: {selectedFontInput || 'var(--font-editor)'}">
									<div class="preview-line">1  The tide receded from Ash Harbor, leaving the silt bare.</div>
									<div class="preview-line">2  Elena checked the bronze needle of her magnetic quadrant.</div>
									<div class="preview-line">3  "The seabed shivers," Captain Kaelen muttered.</div>
								</div>
							</div>
						</section>
					{:else if activeTab === "appearance"}
						<div class="placeholder-section">
							<span class="placeholder-icon">🎨</span>
							<h4>Appearance & Themes (TODO)</h4>
							<p>Planned for future update: Zed theme compatibility, customizable light/dark themes, accent colors, and custom editor margins.</p>
						</div>
					{:else if activeTab === "persistence"}
						<div class="placeholder-section">
							<span class="placeholder-icon">💾</span>
							<h4>Storage & Backups (TODO)</h4>
							<p>Planned for future update: Auto-save interval frequency, automatic manuscript snapshots, Git auto-commit hooks, and backup zip archives.</p>
						</div>
					{:else}
						<div class="placeholder-section">
							<span class="placeholder-icon">⌨️</span>
							<h4>Keybindings & Vim (TODO)</h4>
							<p>Planned for future update: Configurable keyboard shortcuts, Vim navigation mode, and Emacs key bindings.</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="settings-footer">
				<span class="footer-hint">Shortcut: Press <kbd>Ctrl+P</kbd> to toggle Settings anytime</span>
				<button type="button" class="btn primary" onclick={onClose}>Done</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(3px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.settings-modal {
		width: 100%;
		max-width: 680px;
		height: 520px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-bold);
		border-radius: 12px;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.15s ease-out;
	}

	@keyframes scaleIn {
		from { transform: scale(0.96); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 20px;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.settings-icon {
		font-size: 16px;
	}

	.settings-title {
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

	.settings-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.settings-tabs {
		width: 200px;
		background: var(--bg-tertiary);
		border-right: 1px solid var(--border-subtle);
		padding: 12px 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-shrink: 0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 10px;
		background: transparent;
		border: none;
		border-radius: 6px;
		color: var(--text-secondary);
		font-size: 12px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.tab-btn:hover {
		background: var(--bg-hover);
		color: var(--text-primary);
	}

	.tab-btn.active {
		background: var(--bg-active);
		color: var(--accent-primary);
		font-weight: 600;
	}

	.badge-todo {
		font-size: 9px;
		background: rgba(255, 255, 255, 0.1);
		color: var(--text-muted);
		padding: 1px 4px;
		border-radius: 3px;
		margin-left: auto;
	}

	.settings-panel {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
		background: var(--bg-primary);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.section-desc {
		font-size: 12px;
		color: var(--text-muted);
		line-height: 1.5;
		margin: 0;
	}

	.setting-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.setting-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.input-with-button {
		display: flex;
		gap: 6px;
	}

	.text-input {
		flex: 1;
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 7px 10px;
		border-radius: 6px;
		font-size: 13px;
		outline: none;
	}

	.text-input:focus {
		border-color: var(--accent-primary);
	}

	.btn-reset {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-muted);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 11px;
		cursor: pointer;
	}

	.btn-reset:hover {
		color: var(--text-primary);
		border-color: var(--border-bold);
	}

	.setting-hint {
		font-size: 11px;
		color: var(--text-muted);
	}

	.presets-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 6px;
	}

	.preset-btn {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		padding: 8px 10px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
	}

	.preset-btn:hover {
		background: var(--bg-hover);
		border-color: var(--border-bold);
	}

	.preset-btn.active {
		border-color: var(--accent-primary);
		background: var(--accent-subtle);
	}

	.preset-name {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.preset-sample {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	.preview-box {
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		padding: 12px 14px;
		font-size: 14px;
		line-height: 24px;
		color: var(--text-secondary);
	}

	.placeholder-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		text-align: center;
		padding: 40px;
		color: var(--text-muted);
	}

	.placeholder-icon {
		font-size: 32px;
		margin-bottom: 12px;
	}

	.placeholder-section h4 {
		font-size: 15px;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.placeholder-section p {
		font-size: 12px;
		line-height: 1.5;
		max-width: 320px;
	}

	.settings-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 20px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.footer-hint {
		font-size: 11px;
		color: var(--text-muted);
	}

	.btn.primary {
		background: var(--accent-primary);
		color: #000;
		font-weight: 600;
		border: none;
		border-radius: 6px;
		padding: 6px 16px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}
</style>
