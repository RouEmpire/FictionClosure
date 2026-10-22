<script lang="ts">
	import type { FictionDocument } from "../../../../shared/types";

	interface Props {
		document: FictionDocument;
		wordCount: number;
		readingTime: number;
	}

	let { document, wordCount, readingTime }: Props = $props();
</script>

<div class="preview-header">
	<div class="preview-meta-row">
		<span class="preview-type-badge type-{document.type}">{document.type}</span>
		<span class="preview-status-badge status-{document.status}">{document.status}</span>
		<span class="dot">•</span>
		<span class="reading-stats">{wordCount.toLocaleString()} words</span>
		<span class="dot">•</span>
		<span class="reading-time">~{readingTime} min read</span>
	</div>

	{#if document.summary}
		<div class="preview-summary">
			<em>{document.summary}</em>
		</div>
	{/if}
</div>

<style>
	.preview-header {
		width: 100%;
		max-width: 720px;
		padding-bottom: 20px;
		margin-bottom: 24px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.preview-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.preview-type-badge,
	.preview-status-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.type-manuscript {
		background: rgba(88, 166, 255, 0.15);
		color: #58a6ff;
	}
	.type-character {
		background: rgba(210, 153, 34, 0.15);
		color: #d29922;
	}
	.type-world {
		background: rgba(63, 185, 80, 0.15);
		color: #3fb950;
	}
	.type-note {
		background: rgba(188, 140, 255, 0.15);
		color: #bc8cff;
	}

	.status-draft {
		background: var(--bg-tertiary);
		color: var(--text-muted);
	}
	.status-in-progress {
		background: rgba(210, 153, 34, 0.2);
		color: #d29922;
	}
	.status-revised {
		background: rgba(88, 166, 255, 0.2);
		color: #58a6ff;
	}
	.status-completed {
		background: rgba(63, 185, 80, 0.2);
		color: #3fb950;
	}

	.dot {
		opacity: 0.4;
	}

	.preview-summary {
		margin-top: 10px;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border-left: 3px solid var(--accent-primary);
		border-radius: 0 4px 4px 0;
		color: var(--text-secondary);
		font-size: 13px;
	}
</style>
