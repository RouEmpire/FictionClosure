<script lang="ts">
	import type { ShortcutsModalProps } from "./types";
	import defaultShortcutsConfig from "./shortcutsData.json";
	import { resolveShortcutGroups } from "./shortcutsHelper";
	import ShortcutsHeader from "./ShortcutsHeader.svelte";
	import ShortcutGroup from "./ShortcutGroup.svelte";
	import ShortcutsFooter from "./ShortcutsFooter.svelte";

	let {
		isOpen,
		onClose,
		config = defaultShortcutsConfig,
	}: ShortcutsModalProps = $props();

	let resolvedGroups = $derived(resolveShortcutGroups(config.groups));

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		role="presentation"
	>
		<div
			class="modal-box"
			role="dialog"
			aria-modal="true"
			aria-labelledby="shortcuts-title"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<ShortcutsHeader
				title={config.header.title}
				icon={config.header.icon}
				{onClose}
			/>

			<div class="modal-body">
				{#each resolvedGroups as group (group.id)}
					<ShortcutGroup title={group.title} shortcuts={group.shortcuts} />
				{/each}
			</div>

			<ShortcutsFooter footer={config.footer} {onClose} />
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(2px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-box {
		width: 100%;
		max-width: 540px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-bold);
		border-radius: 10px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.15s ease-out;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.96);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.modal-body {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
