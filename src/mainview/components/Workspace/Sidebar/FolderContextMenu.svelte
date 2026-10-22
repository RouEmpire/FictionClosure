<script lang="ts">
	import type { DocumentType, ProjectFolder } from "../../../../shared/types";

	interface Props {
		isOpen: boolean;
		x: number;
		y: number;
		folder: ProjectFolder | null;
		onClose: () => void;
		onNewDoc: (type: DocumentType, parentFolderId?: string) => void;
		onNewFolder?: (parentFolderId?: string) => void;
		onInspectFolder?: (folderId: string) => void;
		onStartRename: (folder: ProjectFolder) => void;
		onDeleteFolder?: (folderId: string) => void;
	}

	let {
		isOpen,
		x,
		y,
		folder,
		onClose,
		onNewDoc,
		onNewFolder,
		onInspectFolder,
		onStartRename,
		onDeleteFolder,
	}: Props = $props();
</script>

<svelte:window
	onclick={(e) => {
		if (isOpen) {
			const target = e.target as HTMLElement;
			if (!target.closest(".doc-context-menu")) {
				onClose();
			}
		}
	}}
	onkeydown={(e) => {
		if (isOpen && e.key === "Escape") {
			onClose();
		}
	}}
/>

{#if isOpen && folder}
	<div
		class="doc-context-menu"
		style="left: {x}px; top: {y}px;"
		role="menu"
		aria-label="Folder options"
		tabindex="-1"
	>
		<div class="context-menu-header">
			<span class="context-doc-name"><i class="fa-solid fa-folder"></i> {folder.name}</span>
		</div>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onNewDoc(folder.type, folder.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-plus"></i></span>
			<span>New Document Here</span>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onNewFolder?.(folder.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-folder-plus"></i></span>
			<span>New Subfolder</span>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onInspectFolder?.(folder.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-circle-info"></i></span>
			<span>Inspect Folder</span>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => onStartRename(folder)}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-pen"></i></span>
			<span>Rename</span>
			<kbd>F2</kbd>
		</button>

		<div class="context-menu-divider"></div>

		<button
			type="button"
			class="context-menu-item danger-item"
			onclick={() => {
				onDeleteFolder?.(folder.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-trash"></i></span>
			<span>Delete Folder</span>
		</button>
	</div>
{/if}

<style>
	@import "./contextMenu.css";
</style>
