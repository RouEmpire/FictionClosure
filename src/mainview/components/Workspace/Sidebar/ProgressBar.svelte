<script lang="ts">
	interface Props {
		totalWordCount: number;
		targetWordCount: number;
	}

	let { totalWordCount, targetWordCount }: Props = $props();

	const progressPercent = $derived(
		targetWordCount > 0
			? Math.min(100, Math.round((totalWordCount / targetWordCount) * 100))
			: 0,
	);
</script>

<div class="sidebar-footer">
	<div class="progress-box">
		<div class="progress-label-row">
			<span>Manuscript Goal</span>
			<span class="progress-nums">
				{totalWordCount.toLocaleString()} / {targetWordCount.toLocaleString()} ({progressPercent}%)
			</span>
		</div>
		<div
			class="progress-bar-track"
			role="progressbar"
			aria-valuenow={progressPercent}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<div class="progress-bar-fill" style="width: {progressPercent}%"></div>
		</div>
	</div>
</div>

<style>
	.sidebar-footer {
		padding: 12px;
		border-top: 1px solid var(--border-subtle);
		background-color: var(--bg-secondary);
	}

	.progress-box {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.progress-label-row {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: var(--text-secondary);
	}

	.progress-nums {
		font-family: var(--font-editor, monospace);
		color: var(--text-muted);
	}

	.progress-bar-track {
		height: 6px;
		background-color: var(--bg-tertiary);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-primary), var(--accent-hover));
		border-radius: 3px;
		transition: width 0.3s ease;
	}
</style>
