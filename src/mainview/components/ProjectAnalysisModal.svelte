<script lang="ts">
	import type { ProjectAnalysisResult } from "@shared/types";

	interface Props {
		analysis: ProjectAnalysisResult | null;
		isOpen: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	}

	let { analysis, isOpen, onConfirm, onCancel }: Props = $props();

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onCancel();
		}
	}
</script>

{#if isOpen && analysis}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) onCancel();
		}}
		role="presentation"
	>
		<div
			class="modal-box"
			role="dialog"
			aria-modal="true"
			aria-labelledby="analysis-title"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<div class="modal-header">
				<div class="title-row">
					<span class="status-glyph status-{analysis.status}">
						{#if analysis.status === "valid"}
							<i class="fa-solid fa-check"></i>
						{:else if analysis.status === "warning"}
							<i class="fa-solid fa-triangle-exclamation"></i>
						{:else}
							<i class="fa-solid fa-xmark"></i>
						{/if}
					</span>
					<div>
						<h2 id="analysis-title" class="modal-heading">Project Structure Analysis</h2>
						<span class="folder-path-label" title={analysis.folderPath}>{analysis.folderPath}</span>
					</div>
				</div>
				<button type="button" class="close-btn" onclick={onCancel} aria-label="Close dialog"><i class="fa-solid fa-xmark"></i></button>
			</div>

			<div class="modal-body">
				<!-- Overall Status Card -->
				<div class="status-banner banner-{analysis.status}">
					<div class="banner-badge">
						{analysis.status.toUpperCase()}
					</div>
					<div class="banner-message">
						{#if analysis.status === "valid"}
							Valid FictionClosure project structure detected. All manifests and chapters parsed cleanly.
						{:else if analysis.status === "warning"}
							Project structure parsed with warnings. Missing items will be assigned defaults.
						{:else}
							Invalid project structure. Required project manifest or documents could not be found.
						{/if}
					</div>
				</div>

				<!-- Project Metadata Breakdown -->
				{#if analysis.manifestFound}
					<div class="meta-section">
						<h3 class="section-heading">Project Details</h3>
						<div class="meta-grid">
							<div class="meta-item">
								<span class="meta-key">Project Title</span>
								<span class="meta-val highlight">{analysis.projectName || "Untitled"}</span>
							</div>
							<div class="meta-item">
								<span class="meta-key">Author</span>
								<span class="meta-val">{analysis.author || "Unknown"}</span>
							</div>
							<div class="meta-item">
								<span class="meta-key">Genre</span>
								<span class="meta-val">{analysis.genre || "Fiction"}</span>
							</div>
							<div class="meta-item">
								<span class="meta-key">Target Words</span>
								<span class="meta-val">{analysis.targetWordCount?.toLocaleString() || "50,000"}</span>
							</div>
						</div>
					</div>
				{/if}

				<!-- Document & Content Stats -->
				<div class="meta-section">
					<h3 class="section-heading">Discovered Content</h3>
					<div class="content-stats-grid">
						<div class="stat-card">
							<span class="stat-icon"><i class="fa-solid fa-book-open"></i></span>
							<span class="stat-num">{analysis.manuscriptCount}</span>
							<span class="stat-title">Chapters</span>
						</div>
						<div class="stat-card">
							<span class="stat-icon"><i class="fa-solid fa-user"></i></span>
							<span class="stat-num">{analysis.characterCount}</span>
							<span class="stat-title">Characters</span>
						</div>
						<div class="stat-card">
							<span class="stat-icon"><i class="fa-solid fa-map"></i></span>
							<span class="stat-num">{analysis.worldCount}</span>
							<span class="stat-title">World & Lore</span>
						</div>
						<div class="stat-card">
							<span class="stat-icon"><i class="fa-solid fa-file-lines"></i></span>
							<span class="stat-num">{analysis.notesCount}</span>
							<span class="stat-title">Notes</span>
						</div>
					</div>

					<div class="total-words-row">
						<span>Total Words in Manuscript & Dossiers:</span>
						<strong class="total-words-num">{analysis.totalWordCount.toLocaleString()} words</strong>
					</div>
				</div>

				<!-- Integrity & Infrastructure Checklist -->
				<div class="meta-section">
					<h3 class="section-heading">Structure Integrity</h3>
					<ul class="integrity-list">
						<li class="check-item" class:passed={analysis.manifestFound}>
							<span class="check-icon">{#if analysis.manifestFound}<i class="fa-solid fa-check"></i>{:else}<i class="fa-solid fa-xmark"></i>{/if}</span>
							<span>Canonical Manifest (<code>project.json</code>)</span>
						</li>
						<li class="check-item" class:passed={analysis.documentsFound > 0}>
							<span class="check-icon">{#if analysis.documentsFound > 0}<i class="fa-solid fa-check"></i>{:else}<i class="fa-solid fa-triangle-exclamation"></i>{/if}</span>
							<span>Markdown Documents ({analysis.documentsFound} found)</span>
						</li>
						<li class="check-item" class:passed={analysis.hasStacks}>
							<span class="check-icon">{#if analysis.hasStacks}<i class="fa-solid fa-check"></i>{:else}<i class="fa-solid fa-circle-info"></i>{/if}</span>
							<span>Edit History Stacks (<code>stacks.json</code> {analysis.hasStacks ? "present" : "will be created"})</span>
						</li>
						<li class="check-item" class:passed={analysis.hasGitignore}>
							<span class="check-icon">{#if analysis.hasGitignore}<i class="fa-solid fa-check"></i>{:else}<i class="fa-solid fa-circle-info"></i>{/if}</span>
							<span>Git Integration (<code>.gitignore</code> {analysis.hasGitignore ? "present" : "will be configured"})</span>
						</li>
					</ul>
				</div>

				<!-- Issues & Warnings list -->
				{#if analysis.issues.length > 0}
					<div class="alert-box error">
						<strong>Critical Errors:</strong>
						<ul>
							{#each analysis.issues as issue}
								<li>{issue}</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if analysis.warnings.length > 0}
					<div class="alert-box warning">
						<strong>Notices & Warnings:</strong>
						<ul>
							{#each analysis.warnings as warn}
								<li>{warn}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button type="button" class="btn" onclick={onCancel}>Cancel</button>
				<button
					type="button"
					class="btn primary"
					disabled={!analysis.isValid}
					onclick={onConfirm}
				>
					Open in Workspace
				</button>
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
		max-width: 620px;
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
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-subtle, #30363d);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 12px;
		overflow: hidden;
	}

	.status-glyph {
		font-size: 20px;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.status-glyph.status-valid {
		background: rgba(63, 185, 80, 0.15);
		color: var(--success-color, #3fb950);
	}

	.status-glyph.status-warning {
		background: rgba(210, 153, 34, 0.15);
		color: var(--warning-color, #d29922);
	}

	.status-glyph.status-invalid {
		background: rgba(248, 81, 73, 0.15);
		color: var(--danger-color, #f85149);
	}

	.modal-heading {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		margin: 0;
	}

	.folder-path-label {
		font-size: 11px;
		color: var(--text-muted, #8b949e);
		font-family: var(--font-editor, monospace);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		max-width: 450px;
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
		padding: 20px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
		font-size: 13px;
		color: var(--text-secondary, #c9d1d9);
	}

	.status-banner {
		padding: 12px 14px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 12px;
		border: 1px solid transparent;
	}

	.banner-valid {
		background: rgba(63, 185, 80, 0.1);
		border-color: rgba(63, 185, 80, 0.3);
		color: #7ee787;
	}

	.banner-warning {
		background: rgba(210, 153, 34, 0.1);
		border-color: rgba(210, 153, 34, 0.3);
		color: #e3b341;
	}

	.banner-invalid {
		background: rgba(248, 81, 73, 0.1);
		border-color: rgba(248, 81, 73, 0.3);
		color: #ff7b72;
	}

	.banner-badge {
		font-size: 10px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.3);
		letter-spacing: 0.05em;
	}

	.banner-message {
		font-size: 12px;
		line-height: 1.4;
	}

	.meta-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-heading {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted, #8b949e);
		margin: 0;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.meta-item {
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 6px;
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-key {
		font-size: 10px;
		color: var(--text-muted, #8b949e);
	}

	.meta-val {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary, #e6edf3);
	}

	.meta-val.highlight {
		color: var(--accent-primary, #e69d45);
		font-weight: 600;
	}

	.content-stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.stat-card {
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 6px;
		padding: 10px 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 2px;
	}

	.stat-icon {
		font-size: 18px;
	}

	.stat-num {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		font-family: var(--font-editor, monospace);
	}

	.stat-title {
		font-size: 10px;
		color: var(--text-muted, #8b949e);
	}

	.total-words-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-tertiary, #21262d);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 12px;
	}

	.total-words-num {
		color: var(--accent-primary, #e69d45);
		font-family: var(--font-editor, monospace);
	}

	.integrity-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.check-item {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		color: var(--text-muted, #8b949e);
	}

	.check-item.passed {
		color: var(--text-secondary, #c9d1d9);
	}

	.check-item code {
		background: var(--bg-tertiary, #21262d);
		padding: 1px 4px;
		border-radius: 3px;
		font-size: 11px;
	}

	.check-icon {
		font-weight: 700;
		width: 16px;
		text-align: center;
	}

	.check-item.passed .check-icon {
		color: var(--success-color, #3fb950);
	}

	.alert-box {
		padding: 10px 14px;
		border-radius: 6px;
		font-size: 12px;
	}

	.alert-box ul {
		margin: 4px 0 0 0;
		padding-left: 18px;
	}

	.alert-box.error {
		background: rgba(248, 81, 73, 0.1);
		border: 1px solid rgba(248, 81, 73, 0.3);
		color: #ff7b72;
	}

	.alert-box.warning {
		background: rgba(210, 153, 34, 0.1);
		border: 1px solid rgba(210, 153, 34, 0.3);
		color: #e3b341;
	}

	.modal-footer {
		padding: 14px 20px;
		border-top: 1px solid var(--border-subtle, #30363d);
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		background: var(--bg-tertiary, #21262d);
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

	.btn.primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
