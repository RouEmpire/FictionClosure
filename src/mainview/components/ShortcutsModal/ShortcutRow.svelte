<script lang="ts">
	interface Props {
		desc: string;
		keys: string[];
	}

	let { desc, keys }: Props = $props();
</script>

<div class="shortcut-row">
	<span class="shortcut-desc">{desc}</span>
	<div class="shortcut-keys">
		{#each keys as k}
			<kbd>{k}</kbd>
		{/each}
	</div>
</div>

<style>
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
</style>
