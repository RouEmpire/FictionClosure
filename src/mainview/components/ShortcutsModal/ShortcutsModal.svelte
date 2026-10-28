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
		keybindings,
	}: ShortcutsModalProps = $props();

	let resolvedGroups = $derived(
		resolveShortcutGroups(config.groups, undefined, keybindings),
	);

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
	.modal-body {
		padding: 16px 18px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
