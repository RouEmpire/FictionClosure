<script lang="ts">
	import type { Snippet } from "svelte";
	import type { DocumentType } from "@shared/types";

	interface Props {
		type: DocumentType;
		label: string;
		icon: string;
		count: number;
		isCollapsed: boolean;
		isSelected?: boolean;
		onToggle: () => void;
		onNewDoc: (type: DocumentType) => void;
		onNewFolder: () => void;
		children?: Snippet;
	}

	let {
		type,
		label,
		icon,
		count,
		isCollapsed,
		isSelected = false,
		onToggle,
		onNewDoc,
		onNewFolder,
		children,
	}: Props = $props();
</script>

<div class="tree-section">
	<div class="section-header" class:nav-selected={isSelected}>
		<button
			type="button"
			class="section-toggle"
			onclick={onToggle}
			aria-expanded={!isCollapsed}
			aria-label="Toggle section {label}"
		>
			<span class="arrow" class:collapsed={isCollapsed}>▾</span>
			<span class="section-icon"><i class={icon}></i></span>
			<span class="section-title">{label}</span>
			<span class="count-badge">{count}</span>
		</button>
		<div class="section-btn-group">
			<button
				type="button"
				class="section-add-btn"
				onclick={(e) => {
					e.stopPropagation();
					onNewDoc(type);
				}}
				title="Add document in {label}"
				aria-label="Add document in {label}"
			>
				<i class="fa-solid fa-plus"></i>
			</button>
			<button
				type="button"
				class="section-add-btn"
				onclick={(e) => {
					e.stopPropagation();
					onNewFolder();
				}}
				title="Add folder in {label}"
				aria-label="Add folder in {label}"
			>
				<i class="fa-solid fa-folder-plus"></i>
			</button>
		</div>
	</div>

	{#if !isCollapsed}
		<div class="section-items-container">
			{#if children}
				{@render children()}
			{/if}
			{#if count === 0}
				<div class="empty-section-item">Empty</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.tree-section {
		margin-bottom: 4px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 5px 12px;
		border-radius: 4px;
		margin: 0 4px;
		transition: background-color 0.15s ease;
	}

	.section-header:hover {
		background-color: var(--bg-hover);
	}

	.section-header.nav-selected {
		background-color: var(--bg-hover);
		outline: 1px solid var(--accent-primary);
	}

	.section-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		cursor: pointer;
		flex: 1;
		text-align: left;
		padding: 0;
	}

	.arrow {
		font-size: 10px;
		color: var(--text-muted);
		transition: transform 0.15s ease;
		display: inline-block;
		width: 10px;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.section-icon {
		font-size: 12px;
		color: var(--accent-primary);
		flex-shrink: 0;
	}

	.section-icon i {
		color: var(--accent-primary);
	}

	.section-title {
		flex: 1;
	}

	.count-badge {
		font-size: 10px;
		font-weight: normal;
		color: var(--text-muted);
		background-color: var(--bg-tertiary);
		padding: 1px 6px;
		border-radius: 10px;
	}

	.section-btn-group {
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.section-header:hover .section-btn-group {
		opacity: 1;
	}

	.section-add-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px 5px;
		font-size: 11px;
		border-radius: 3px;
	}

	.section-add-btn:hover {
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
	}

	.section-items-container {
		display: flex;
		flex-direction: column;
	}

	.empty-section-item {
		padding: 4px 0 4px 30px;
		font-size: 11px;
		color: var(--text-muted);
		font-style: italic;
	}
</style>
