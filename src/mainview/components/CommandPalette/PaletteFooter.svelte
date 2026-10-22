<div class="palette-footer">
	<span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
	<span><kbd>↵</kbd> to select</span>
	<span><kbd>Esc</kbd> to dismiss</span>
</div>

<style>
	.palette-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-secondary);
		font-size: 11px;
		color: var(--text-muted);
	}

	.palette-footer span {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	kbd {
		background: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		padding: 2px 5px;
		border-radius: 3px;
		font-size: 10px;
		box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
	}
</style>
