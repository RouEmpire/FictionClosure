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
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.status-glyph.status-valid {
		background: rgba(63, 185, 80, 0.15);
		color: var(--success-color);
	}

	.status-glyph.status-warning {
		background: rgba(210, 153, 34, 0.15);
		color: var(--warning-color);
	}

	.status-glyph.status-invalid {
		background: var(--danger-subtle);
		color: var(--danger-color);
	}

	.modal-heading {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.folder-path-label {
		font-size: 11px;
		color: var(--text-muted);
		font-family: var(--font-editor);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		max-width: 450px;
	}

	.status-banner {
		padding: 12px 14px;
		border-radius: var(--radius-md);
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
		background: var(--danger-subtle);
		border-color: rgba(248, 81, 73, 0.3);
		color: var(--danger-hover);
	}

	.banner-badge {
		font-size: 10px;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
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
		color: var(--text-muted);
		margin: 0;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.meta-item {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 8px 12px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-key {
		font-size: 10px;
		color: var(--text-muted);
	}

	.meta-val {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.meta-val.highlight {
		color: var(--accent-primary);
		font-weight: 600;
	}

	.content-stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.stat-card {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
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
		color: var(--text-primary);
		font-family: var(--font-editor);
	}

	.stat-title {
		font-size: 10px;
		color: var(--text-muted);
	}

	.total-words-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-md);
		padding: 8px 12px;
		font-size: 12px;
	}

	.total-words-num {
		color: var(--accent-primary);
		font-family: var(--font-editor);
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
		color: var(--text-muted);
	}

	.check-item.passed {
		color: var(--text-secondary);
	}

	.check-item code {
		background: var(--bg-tertiary);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		font-size: 11px;
	}

	.check-icon {
		font-weight: 700;
		width: 16px;
		text-align: center;
	}

	.check-item.passed .check-icon {
		color: var(--success-color);
	}

	.alert-box {
		padding: 10px 14px;
		border-radius: var(--radius-md);
		font-size: 12px;
	}

	.alert-box ul {
		margin: 4px 0 0 0;
		padding-left: 18px;
	}

	.alert-box.error {
		background: var(--danger-subtle);
		border: 1px solid rgba(248, 81, 73, 0.3);
		color: var(--danger-hover);
	}

	.alert-box.warning {
		background: rgba(210, 153, 34, 0.1);
		border: 1px solid rgba(210, 153, 34, 0.3);
		color: var(--warning-color);
	}
</style>
