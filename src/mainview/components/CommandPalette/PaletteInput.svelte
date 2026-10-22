<script lang="ts">
	interface Props {
		searchQuery: string;
		inputEl?: HTMLInputElement | null;
		onkeydown?: (e: KeyboardEvent) => void;
	}

	let {
		searchQuery = $bindable(""),
		inputEl = $bindable(null),
		onkeydown,
	}: Props = $props();
</script>

<div class="palette-input-box">
	<span class="palette-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
	<input
		bind:this={inputEl}
		type="text"
		placeholder="Type a command or jump to document..."
		bind:value={searchQuery}
		{onkeydown}
		aria-label="Search documents and commands"
	/>
	<kbd class="esc-kbd">Esc</kbd>
</div>

<style>
	.palette-input-box {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-subtle);
		gap: 10px;
		background: var(--bg-tertiary);
	}

	.palette-icon {
		font-size: 16px;
		color: var(--text-muted);
	}

	.palette-input-box input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--text-primary);
		font-size: 15px;
	}

	.palette-input-box input::placeholder {
		color: var(--text-muted);
	}

	.esc-kbd {
		font-size: 11px;
	}
</style>
