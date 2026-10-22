<script lang="ts">
	import type { ResolvedShortcutItem } from "./types";
	import ShortcutRow from "./ShortcutRow.svelte";

	interface Props {
		title: string;
		shortcuts: ResolvedShortcutItem[];
	}

	let { title, shortcuts }: Props = $props();
</script>

<div class="shortcut-group">
	<h3 class="group-heading">{title}</h3>
	<div class="shortcuts-grid">
		{#each shortcuts as sc}
			<ShortcutRow desc={sc.desc} keys={sc.keys} />
		{/each}
	</div>
</div>

<style>
	.shortcut-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.group-heading {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-primary);
		margin: 0;
	}

	.shortcuts-grid {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
</style>
