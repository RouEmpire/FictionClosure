<script lang="ts">
	interface Props {
		loadError?: string | null;
		onCancel?: () => void;
	}

	let { loadError = null, onCancel }: Props = $props();
</script>

<div class="chassis-header">
	<div class="chassis-header-left">
		<div class="status-indicator">
			<span class="pulsing-led" class:error={Boolean(loadError)}></span>
			<span class="system-status-text">
				{loadError ? "DISK_IO_ERROR" : "DISK_IO_ACTIVE"}
			</span>
		</div>
		<span class="chassis-divider">|</span>
		<span class="kernel-id">CORE_MOUNT // TERMINAL_SHELL // v2.4</span>
	</div>
	<div class="chassis-header-right">
		{#if onCancel}
			<button
				type="button"
				class="cancel-btn"
				onclick={onCancel}
				title="Cancel loading and return to Home"
			>
				[ESC / CANCEL]
			</button>
		{/if}
	</div>
</div>

<style>
	.chassis-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid rgba(6, 182, 212, 0.2);
		padding-bottom: 12px;
		font-size: 11px;
		letter-spacing: 0.05em;
	}

	.chassis-header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pulsing-led {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #00ff9d;
		box-shadow: 0 0 8px #00ff9d;
		animation: pulseLed 1.2s infinite ease-in-out;
	}

	.pulsing-led.error {
		background-color: #ef4444;
		box-shadow: 0 0 8px #ef4444;
	}

	@keyframes pulseLed {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.85);
		}
	}

	.system-status-text {
		color: #22d3ee;
		font-weight: 700;
	}

	.chassis-divider {
		color: #334155;
	}

	.kernel-id {
		color: #64748b;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid rgba(148, 163, 184, 0.3);
		color: #94a3b8;
		font-family: inherit;
		font-size: 10px;
		padding: 3px 8px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cancel-btn:hover {
		color: #f1f5f9;
		border-color: #00f0ff;
		box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
	}
</style>
