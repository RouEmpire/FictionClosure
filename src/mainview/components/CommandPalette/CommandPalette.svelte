<script lang="ts">
	import type { CommandPaletteProps, PaletteItem } from "./types";
	import { buildStaticActions, filterPaletteItems } from "./paletteHelpers";
	import PaletteInput from "./PaletteInput.svelte";
	import PaletteList from "./PaletteList.svelte";
	import PaletteFooter from "./PaletteFooter.svelte";

	let {
		isOpen,
		documents,
		onClose,
		onSelectDoc,
		onNewDoc,
		onSetViewMode,
		onSave,
		onChangeFolder,
		onOpenSettings,
	}: CommandPaletteProps = $props();

	let searchQuery = $state("");
	let selectedIndex = $state(0);
	let inputEl: HTMLInputElement | null = $state(null);

	// Focus input when opened
	$effect(() => {
		if (isOpen) {
			searchQuery = "";
			selectedIndex = 0;
			setTimeout(() => {
				inputEl?.focus();
			}, 50);
		}
	});

	const staticActions = $derived(
		buildStaticActions({
			onNewDoc,
			onSave,
			onSetViewMode,
			onChangeFolder,
			onOpenSettings,
		}),
	);

	const filteredItems = $derived(
		filterPaletteItems(searchQuery, documents, staticActions),
	);

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex = (selectedIndex + 1) % filteredItems.length;
			}
			return;
		}

		if (e.key === "ArrowUp") {
			e.preventDefault();
			if (filteredItems.length > 0) {
				selectedIndex =
					(selectedIndex - 1 + filteredItems.length) % filteredItems.length;
			}
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			const selected = filteredItems[selectedIndex];
			if (selected) {
				selectItem(selected);
			}
		}
	}

	function selectItem(item: PaletteItem) {
		if (item.type === "document") {
			onSelectDoc(item.doc.id);
		} else {
			item.execute();
		}
		onClose();
	}
</script>

{#if isOpen}
	<div
		class="palette-overlay"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		role="presentation"
	>
		<div
			class="palette-modal"
			role="dialog"
			aria-modal="true"
			aria-label="Command Palette"
		>
			<PaletteInput
				bind:searchQuery
				bind:inputEl
				onkeydown={handleKeyDown}
			/>

			<PaletteList
				items={filteredItems}
				{selectedIndex}
				onSelectItem={selectItem}
				onHoverItem={(idx) => (selectedIndex = idx)}
			/>

			<PaletteFooter />
		</div>
	</div>
{/if}

<style>
	.palette-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(2px);
		z-index: 999;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 10vh;
	}

	.palette-modal {
		width: 100%;
		max-width: 600px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-bold);
		border-radius: 10px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: scaleIn 0.15s ease-out;
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.97);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
