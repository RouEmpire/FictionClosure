<script lang="ts">
	interface Props {
		searchQuery: string;
		onSearchChange: (q: string) => void;
		onNewDoc: () => void;
	}

	let { searchQuery = $bindable(), onSearchChange, onNewDoc }: Props = $props();
</script>

<div class="sidebar-search">
	<div class="search-box">
		<span class="search-glyph">
			<i class="fa-solid fa-magnifying-glass"></i>
		</span>
		<input
			type="text"
			placeholder="Filter documents..."
			bind:value={searchQuery}
			oninput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
			aria-label="Filter documents"
		/>
		{#if searchQuery}
			<button
				type="button"
				class="clear-btn"
				onclick={() => {
					searchQuery = "";
					onSearchChange("");
				}}
				title="Clear filter"
				aria-label="Clear filter"
			>
				<i class="fa-solid fa-xmark"></i>
			</button>
		{/if}
	</div>
	<div class="sidebar-top-actions">
		<button
			type="button"
			class="new-doc-top-btn"
			onclick={onNewDoc}
			title="Create New Document or Folder"
			aria-label="Create New Document or Folder"
		>
			<i class="fa-solid fa-plus"></i>
		</button>
	</div>
</div>

<style>
	.sidebar-search {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.search-box {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-glyph {
		position: absolute;
		left: 8px;
		font-size: 11px;
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-box input {
		width: 100%;
		background-color: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 5px 24px 5px 26px;
		border-radius: 5px;
		font-size: 12px;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.search-box input:focus {
		border-color: var(--accent-primary);
	}

	.clear-btn {
		position: absolute;
		right: 6px;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 11px;
		padding: 2px;
	}

	.clear-btn:hover {
		color: var(--text-primary);
	}

	.sidebar-top-actions {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.new-doc-top-btn {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-subtle);
		border-radius: 5px;
		color: var(--text-secondary);
		cursor: pointer;
		font-size: 11px;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.new-doc-top-btn:hover {
		background: var(--bg-hover);
		color: var(--accent-primary);
		border-color: var(--border-bold);
	}
</style>
