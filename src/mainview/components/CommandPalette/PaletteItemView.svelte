<script lang="ts">
	import type { PaletteItem } from "./types";
	import { getDocIcon, getDocSnippet } from "./paletteHelpers";

	interface Props {
		item: PaletteItem;
		isSelected: boolean;
		onSelect: () => void;
		onHover: () => void;
	}

	let { item, isSelected, onSelect, onHover }: Props = $props();
</script>

<button
	type="button"
	class="palette-item"
	class:selected={isSelected}
	onclick={onSelect}
	onmouseenter={onHover}
	role="option"
	aria-selected={isSelected}
>
	{#if item.type === "document"}
		<span class="item-icon">
			<i class={getDocIcon(item.doc.type)}></i>
		</span>
		<div class="item-details">
			<div class="item-title-row">
				<span class="item-title">{item.doc.title}</span>
				<span class="type-pill pill-{item.doc.type}">{item.doc.type}</span>
			</div>
			<div class="item-snippet">
				{getDocSnippet(item.doc)}
			</div>
		</div>
	{:else}
		<span class="item-icon"><i class={item.icon}></i></span>
		<div class="item-details">
			<div class="item-title-row">
				<span class="item-title">{item.title}</span>
				<span class="action-pill">Action</span>
			</div>
			<div class="item-snippet">{item.subtitle}</div>
		</div>
	{/if}
</button>

<style>
	.palette-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: transparent;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.1s ease;
		color: inherit;
		width: 100%;
	}

	.palette-item.selected {
		background: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.item-icon {
		font-size: 18px;
		flex-shrink: 0;
	}

	.item-details {
		flex: 1;
		overflow: hidden;
	}

	.item-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.item-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.palette-item.selected .item-title {
		color: var(--accent-hover);
	}

	.item-snippet {
		font-size: 11px;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		margin-top: 2px;
	}

	.type-pill,
	.action-pill {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 1px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.pill-manuscript {
		background: rgba(88, 166, 255, 0.15);
		color: #58a6ff;
	}
	.pill-character {
		background: rgba(210, 153, 34, 0.15);
		color: #d29922;
	}
	.pill-world {
		background: rgba(63, 185, 80, 0.15);
		color: #3fb950;
	}
	.pill-note {
		background: rgba(188, 140, 255, 0.15);
		color: #bc8cff;
	}
	.action-pill {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}
</style>
