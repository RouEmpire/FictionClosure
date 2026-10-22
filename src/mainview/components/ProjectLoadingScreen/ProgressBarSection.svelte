<script lang="ts">
	interface Props {
		progress: number;
		loadError?: string | null;
	}

	let { progress, loadError = null }: Props = $props();
</script>

<div class="progress-section">
	<div class="progress-meta">
		<span class="progress-task-label">
			{#if loadError}
				<span class="error-text">MOUNT_ABORTED</span>
			{:else if progress >= 100}
				<span class="ready-text">WORKSPACE_READY</span>
			{:else}
				INITIALIZING_MANUSCRIPT_PIPELINE
			{/if}
		</span>
		<span class="progress-pct-readout">
			[ {Math.min(100, Math.round(progress))}% ]
		</span>
	</div>

	<!-- Visual Segmented Bar -->
	<div class="progress-track" class:error={Boolean(loadError)}>
		<div
			class="progress-fill"
			class:error={Boolean(loadError)}
			style="width: {Math.min(100, progress)}%;"
		>
			<div class="progress-shimmer"></div>
		</div>
	</div>
</div>

<style>
	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 11px;
	}

	.progress-task-label {
		color: #67e8f9;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.progress-task-label .ready-text {
		color: #00ff9d;
		text-shadow: 0 0 8px rgba(0, 255, 157, 0.5);
	}

	.progress-task-label .error-text {
		color: #f87171;
	}

	.progress-pct-readout {
		color: #00ff9d;
		font-weight: 700;
		text-shadow: 0 0 6px rgba(0, 255, 157, 0.4);
	}

	.progress-track {
		height: 10px;
		background: #030712;
		border: 1px solid rgba(6, 182, 212, 0.3);
		border-radius: 999px;
		overflow: hidden;
		position: relative;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
	}

	.progress-track.error {
		border-color: rgba(239, 68, 68, 0.4);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #06b6d4 0%, #10b981 60%, #00ff9d 100%);
		border-radius: 999px;
		transition: width 0.16s ease-out;
		position: relative;
		overflow: hidden;
		box-shadow: 0 0 12px rgba(0, 255, 157, 0.6);
	}

	.progress-fill.error {
		background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
		box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
	}

	.progress-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		animation: shimmer 1.2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}
</style>
