<script lang="ts">
	import type { ShortcutsFooterConfig } from "./types";

	interface Props {
		footer?: ShortcutsFooterConfig;
		onClose: () => void;
	}

	let {
		footer = {
			tipPrefix: "Tip: Press ",
			tipKey: "?",
			tipSuffix: " anytime to view this guide",
			buttonText: "Done",
		},
		onClose,
	}: Props = $props();
</script>

<div class="modal-footer">
	<span class="footer-tip">
		{footer.tipPrefix}<kbd>{footer.tipKey}</kbd>{footer.tipSuffix}
	</span>
	<button type="button" class="btn primary" onclick={onClose}>
		{footer.buttonText}
	</button>
</div>

<style>
	.modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 18px;
		border-top: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.footer-tip {
		font-size: 11px;
		color: var(--text-muted);
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

	.btn.primary {
		background: var(--accent-primary);
		color: #000;
		font-weight: 600;
		border: none;
		border-radius: 6px;
		padding: 6px 14px;
		font-size: 12px;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.btn.primary:hover {
		background: var(--accent-hover);
	}
</style>
