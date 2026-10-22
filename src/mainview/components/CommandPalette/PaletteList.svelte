<script lang="ts">
	import type { PaletteItem } from "./types";
	import PaletteItemView from "./PaletteItemView.svelte";

	interface Props {
		items: PaletteItem[];
		selectedIndex: number;
		onSelectItem: (item: PaletteItem) => void;
		onHoverItem: (index: number) => void;
	}

	let { items, selectedIndex, onSelectItem, onHoverItem }: Props = $props();
</script>

<div class="palette-list" role="listbox">
	{#if items.length === 0}
		<div class="palette-empty">No matching documents or actions</div>
	{:else}
		{#each items as item, idx (item.id)}
			<PaletteItemView
				{item}
				isSelected={idx === selectedIndex}
				onSelect={() => onSelectItem(item)}
				onHover={() => onHoverItem(idx)}
			/>
		{/each}
	{/if}
</div>

<style>
	.palette-list {
		max-height: 380px;
		overflow-y: auto;
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.palette-empty {
		padding: 24px;
		text-align: center;
		color: var(--text-muted);
		font-style: italic;
		font-size: 13px;
	}
</style>
