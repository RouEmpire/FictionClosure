<script lang="ts">
	interface Props {
		title: string;
		icon?: string;
		onClose: () => void;
	}

	let { title, icon = "fa-solid fa-keyboard", onClose }: Props = $props();
</script>

<div class="modal-header">
	<div class="header-title-box">
		<span class="header-icon"><i class={icon}></i></span>
		<h2 id="shortcuts-title" class="modal-heading">{title}</h2>
	</div>
	<button
		type="button"
		class="close-btn"
		onclick={onClose}
		aria-label="Close dialog"
	>
		<i class="fa-solid fa-xmark"></i>
	</button>
</div>

<style>
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 18px;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg-tertiary);
	}

	.header-title-box {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.header-icon {
		font-size: 16px;
	}

	.modal-heading {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: 14px;
	}

	.close-btn:hover {
		color: var(--text-primary);
	}
</style>
