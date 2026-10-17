<script lang="ts">
	interface Props {
		isOpen: boolean;
		onClose: () => void;
	}

	let { isOpen, onClose }: Props = $props();

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
			aria-labelledby="about-title"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<div class="modal-header">
				<div class="header-brand">
					<span class="app-icon">🖋️</span>
					<div>
						<h2 id="about-title" class="app-title">FictionClosure</h2>
						<span class="version-tag">v1.0.0 • Desktop Edition</span>
					</div>
				</div>
				<button type="button" class="close-btn" onclick={onClose} aria-label="Close dialog">✕</button>
			</div>

			<div class="modal-body">
				<p class="hero-desc">
					A desktop-first, Markdown-first fiction-writing workspace designed for correctness, predictable behavior, atomic data safety, and zero vendor lock-in.
				</p>

				<div class="info-section">
					<h3>Architectural Invariants</h3>
					<ul class="features-list">
						<li>
							<strong>Markdown-First Storage:</strong> Manuscripts, character dossiers, worldbuilding codices, and outlines are preserved as plain Markdown files on disk with YAML frontmatter.
						</li>
						<li>
							<strong>Atomic File Safety:</strong> Writes use isolated temporary buffers and atomic replacement to prevent partial writes and file corruption.
						</li>
						<li>
							<strong>Persistent Edit Stacks:</strong> Full undo and redo history is serialized alongside projects, bounded to half of your target word count.
						</li>
						<li>
							<strong>Accurate Soft-Wrap Engine:</strong> Visual line measurements keep gutters, wrap continuation dashes, and paragraphs in 1:1 vertical lockstep.
						</li>
						<li>
							<strong>Focus & Zen Modes:</strong> Distraction-free writing with paragraph focus and Concentrate Zen Mode (CZM).
						</li>
					</ul>
				</div>

				<div class="info-grid">
					<div class="info-card">
						<span class="info-label">Runtime</span>
						<span class="info-val">Bun + Electrobun 2.0</span>
					</div>
					<div class="info-card">
						<span class="info-label">Interface</span>
						<span class="info-val">Svelte 5 + TypeScript</span>
					</div>
					<div class="info-card">
						<span class="info-label">Visualization</span>
						<span class="info-val">Apache ECharts 5.6</span>
					</div>
					<div class="info-card">
						<span class="info-label">License</span>
						<span class="info-val">MIT Open Source</span>
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<span class="footer-note">Crafted for authors who love craft, speed, and privacy.</span>
				<button type="button" class="btn primary" onclick={onClose}>Close</button>
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
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.modal-box {
		background: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 10px;
		width: 100%;
		max-width: 580px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 22px;
		border-bottom: 1px solid var(--border-subtle, #30363d);
	}

	.header-brand {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.app-icon {
		font-size: 32px;
	}

	.app-title {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		margin: 0;
	}

	.version-tag {
		font-size: 11px;
		color: var(--accent-primary, #e69d45);
		font-family: var(--font-editor, monospace);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted, #8b949e);
		font-size: 16px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.close-btn:hover {
		color: var(--text-primary, #e6edf3);
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
	}

	.modal-body {
		padding: 20px 22px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
		font-size: 13px;
		line-height: 1.6;
		color: var(--text-secondary, #c9d1d9);
	}

	.hero-desc {
		font-size: 14px;
		color: var(--text-primary, #e6edf3);
		margin: 0;
	}

	.info-section h3 {
		font-size: 13px;
		color: var(--text-primary, #e6edf3);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 10px 0;
	}

	.features-list {
		margin: 0;
		padding-left: 18px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.features-list strong {
		color: var(--text-primary, #e6edf3);
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
		margin-top: 6px;
	}

	.info-card {
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 6px;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.info-label {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--text-muted, #8b949e);
		letter-spacing: 0.05em;
	}

	.info-val {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-primary, #e6edf3);
		font-family: var(--font-editor, monospace);
	}

	.modal-footer {
		padding: 14px 22px;
		border-top: 1px solid var(--border-subtle, #30363d);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--bg-tertiary, #21262d);
	}

	.footer-note {
		font-size: 11px;
		color: var(--text-muted, #8b949e);
		font-style: italic;
	}

	.btn {
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid var(--border-subtle, #30363d);
		background: var(--bg-hover, rgba(255, 255, 255, 0.08));
		color: var(--text-primary, #e6edf3);
		transition: all 0.15s ease;
	}

	.btn.primary {
		background: var(--accent-primary, #e69d45);
		border-color: var(--accent-primary, #e69d45);
		color: #12151a;
		font-weight: 600;
	}

	.btn.primary:hover {
		background: var(--accent-hover, #f0b060);
	}
</style>
