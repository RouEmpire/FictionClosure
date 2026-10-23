<script lang="ts">
	import type { CrashRecoveryData, FictionDocument } from "@shared/types";

	interface Props {
		isOpen: boolean;
		recoveryData: CrashRecoveryData | null;
		diskDocuments: FictionDocument[];
		onRestore: () => void;
		onDiscard: () => void;
	}

	let {
		isOpen,
		recoveryData,
		diskDocuments,
		onRestore,
		onDiscard,
	}: Props = $props();

	function formatDateTime(isoString: string): string {
		try {
			const d = new Date(isoString);
			return d.toLocaleString(undefined, {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
		} catch {
			return isoString;
		}
	}

	function getDiskWordCount(docId: string): number {
		const found = diskDocuments.find((d) => d.id === docId);
		return found ? found.content.trim().split(/\s+/).filter(Boolean).length : 0;
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (isOpen && e.key === "Escape") {
			onDiscard();
		}
	}}
/>

{#if isOpen && recoveryData}
	<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
		<div class="modal-card">
			<!-- Header -->
			<div class="modal-header">
				<div class="header-icon-badge">
					<span class="warning-icon"><i class="fa-solid fa-bolt"></i></span>
				</div>
				<div class="header-text-group">
					<h2 id="recovery-title" class="modal-title">
						Unsaved Changes Detected
					</h2>
					<p class="modal-subtitle">
						FictionClosure detected writing from an interrupted session ({formatDateTime(recoveryData.cachedAt)}) that was not explicitly saved by user hands.
					</p>
				</div>
			</div>

			<!-- Technical System Badges (TODO markings per requirements) -->
			<div class="system-status-pills">
				<span class="pill pill-autosave" title="Background auto-save daemon is planned for a future update">
					<i class="fa-solid fa-gear"></i> Auto-Save System: <strong class="todo-badge">TODO</strong>
				</span>
				<span class="pill pill-git" title="Git repository initialized on project folder, interactive UI integration is planned">
					<i class="fa-solid fa-box"></i> Git Integration: <span class="active-badge">Active (.git)</span> // UI Interact: <strong class="todo-badge">TODO</strong>
				</span>
			</div>

			<!-- Document Comparison Table -->
			<div class="documents-comparison-box">
				<div class="table-caption">Recoverable Documents ({recoveryData.documents.length})</div>
				<div class="doc-list">
					{#each recoveryData.documents as cachedDoc (cachedDoc.id)}
						{@const diskWords = getDiskWordCount(cachedDoc.id)}
						{@const wordDiff = cachedDoc.wordCount - diskWords}
						<div class="doc-item">
							<div class="doc-item-left">
								<span class="doc-type-badge badge-{cachedDoc.type}">{cachedDoc.type}</span>
								<span class="doc-title">{cachedDoc.title}</span>
							</div>
							<div class="doc-item-right">
								<span class="words-metric">
									<strong class="cached-words">{cachedDoc.wordCount.toLocaleString()}</strong> words (cached)
									<span class="metric-divider">vs</span>
									<span class="disk-words">{diskWords.toLocaleString()}</span> (disk)
								</span>
								{#if wordDiff > 0}
									<span class="diff-tag diff-positive">+{wordDiff.toLocaleString()} words</span>
								{:else if wordDiff < 0}
									<span class="diff-tag diff-negative">{wordDiff.toLocaleString()} words</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Safety advisory -->
			<div class="recovery-advisory">
				<p>
					Restoring will load your cached drafts into the editor so you can review and save them. Discarding will keep the files as they exist on disk and delete the cache.
				</p>
			</div>

			<!-- Actions -->
			<div class="modal-actions">
				<button type="button" class="btn btn-secondary" onclick={onDiscard}>
					Discard Cache & Open Disk Version
				</button>
				<button type="button" class="btn btn-primary" onclick={onRestore}>
					<span class="btn-icon">↺</span>
					<span>Restore Recovered Work</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		z-index: 9998;
	}

	.modal-card {
		background: #0f172a;
		border: 1px solid rgba(245, 158, 11, 0.4);
		box-shadow: 0 0 30px rgba(245, 158, 11, 0.2), 0 20px 40px rgba(0, 0, 0, 0.6);
		border-radius: 12px;
		width: 100%;
		max-width: 600px;
		padding: 24px;
		color: #f1f5f9;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.header-icon-badge {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.warning-icon {
		font-size: 22px;
	}

	.header-text-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.modal-title {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: #fbbf24;
		letter-spacing: -0.01em;
	}

	.modal-subtitle {
		margin: 0;
		font-size: 13px;
		color: #94a3b8;
		line-height: 1.45;
	}

	.system-status-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		font-size: 11px;
	}

	.pill {
		background: #1e293b;
		border: 1px solid #334155;
		padding: 4px 10px;
		border-radius: 999px;
		color: #cbd5e1;
	}

	.todo-badge {
		background: rgba(245, 158, 11, 0.2);
		color: #fbbf24;
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 10px;
		margin-left: 4px;
	}

	.active-badge {
		color: #34d399;
		font-weight: 600;
	}

	.documents-comparison-box {
		background: #020617;
		border: 1px solid #1e293b;
		border-radius: 8px;
		overflow: hidden;
	}

	.table-caption {
		padding: 8px 12px;
		background: #0b1120;
		font-size: 11px;
		font-weight: 600;
		color: #94a3b8;
		border-bottom: 1px solid #1e293b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.doc-list {
		max-height: 200px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.doc-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		border-bottom: 1px solid #0f172a;
		font-size: 13px;
		gap: 12px;
	}

	.doc-item:last-child {
		border-bottom: none;
	}

	.doc-item-left {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.doc-type-badge {
		font-size: 10px;
		text-transform: uppercase;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.badge-manuscript {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
	}

	.badge-character {
		background: rgba(168, 85, 247, 0.15);
		color: #c084fc;
	}

	.badge-world {
		background: rgba(34, 197, 94, 0.15);
		color: #4ade80;
	}

	.badge-plot {
		background: rgba(244, 63, 94, 0.15);
		color: #fb7185;
	}

	.badge-note {
		background: rgba(234, 179, 8, 0.15);
		color: #facc15;
	}

	.doc-title {
		font-weight: 500;
		color: #f8fafc;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.doc-item-right {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		flex-shrink: 0;
	}

	.words-metric {
		color: #94a3b8;
	}

	.cached-words {
		color: #38bdf8;
	}

	.metric-divider {
		color: #475569;
		margin: 0 2px;
	}

	.disk-words {
		color: #cbd5e1;
	}

	.diff-tag {
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 4px;
		font-weight: 600;
	}

	.diff-positive {
		background: rgba(34, 197, 94, 0.2);
		color: #4ade80;
	}

	.diff-negative {
		background: rgba(239, 68, 68, 0.2);
		color: #f87171;
	}

	.recovery-advisory {
		font-size: 12px;
		color: #94a3b8;
		background: rgba(30, 41, 59, 0.5);
		border-left: 3px solid #06b6d4;
		padding: 8px 12px;
		border-radius: 0 6px 6px 0;
	}

	.recovery-advisory p {
		margin: 0;
	}

	.modal-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 4px;
	}

	.btn-icon {
		font-size: 15px;
	}
</style>
