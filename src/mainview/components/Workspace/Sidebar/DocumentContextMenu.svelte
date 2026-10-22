<script lang="ts">
	import type { FictionDocument, ProjectFolder } from "@shared/types";
	import { markdownToPlainText } from "@shared/domain/markdown";
	import {
		getDocumentRelativePath,
		getDocumentSystemPath,
		copyToClipboard,
	} from "@shared/domain/documentPaths";

	interface Props {
		isOpen: boolean;
		x: number;
		y: number;
		doc: FictionDocument | null;
		folders: ProjectFolder[];
		folderPath?: string;
		onClose: () => void;
		onSelectDoc: (id: string) => void;
		onStartRename: (doc: FictionDocument) => void;
		onDuplicateDoc?: (id: string) => void;
		onOpenInspector?: (id: string) => void;
		onDeleteDoc: (id: string) => void;
		onShowToast?: (msg: string) => void;
	}

	let {
		isOpen,
		x,
		y,
		doc,
		folders,
		folderPath,
		onClose,
		onSelectDoc,
		onStartRename,
		onDuplicateDoc,
		onOpenInspector,
		onDeleteDoc,
		onShowToast,
	}: Props = $props();

	let activeSubmenu = $state<"copy" | "path" | null>(null);

	const isNearRightEdge = $derived.by(() => {
		if (typeof window === "undefined") return false;
		return x + 220 + 200 > window.innerWidth;
	});

	async function handleCopyContent(format: "markdown" | "plaintext") {
		if (!doc) return;
		const text = format === "markdown" ? doc.content : markdownToPlainText(doc.content);
		const success = await copyToClipboard(text);
		if (success) {
			onShowToast?.(`Copied ${format === "markdown" ? "Markdown" : "Plaintext"} to clipboard`);
		}
		onClose();
	}

	async function handleCopyPath(type: "relative" | "system") {
		if (!doc) return;
		const pathStr =
			type === "relative"
				? getDocumentRelativePath(doc, folders)
				: getDocumentSystemPath(doc, folders, folderPath);
		const success = await copyToClipboard(pathStr);
		if (success) {
			onShowToast?.(`Copied ${type === "relative" ? "relative" : "system"} path to clipboard`);
		}
		onClose();
	}
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

{#if isOpen && doc}
	<div
		class="doc-context-menu"
		style="left: {x}px; top: {y}px;"
		role="menu"
		aria-label="Document options"
		tabindex="-1"
	>
		<div class="context-menu-header">
			<span class="context-doc-name">{doc.title}</span>
		</div>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onSelectDoc(doc.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-file-pen"></i></span>
			<span>Open</span>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => onStartRename(doc)}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-pen"></i></span>
			<span>Rename</span>
			<kbd>F2</kbd>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onDuplicateDoc?.(doc.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-clone"></i></span>
			<span>Duplicate</span>
		</button>

		<button
			type="button"
			class="context-menu-item"
			onclick={() => {
				onOpenInspector?.(doc.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-circle-info"></i></span>
			<span>Inspect Metadata</span>
		</button>

		<div class="context-menu-divider"></div>

		<!-- Copy Content Submenu -->
		<div
			class="submenu-wrapper"
			onmouseenter={() => (activeSubmenu = "copy")}
			onmouseleave={() => (activeSubmenu = null)}
			role="none"
		>
			<button
				type="button"
				class="context-menu-item has-submenu"
				class:submenu-open={activeSubmenu === "copy"}
				role="menuitem"
				aria-haspopup="true"
				aria-expanded={activeSubmenu === "copy"}
			>
				<span class="item-icon"><i class="fa-solid fa-copy"></i></span>
				<span>Copy Content</span>
				<span class="submenu-arrow">▶</span>
			</button>

			{#if activeSubmenu === "copy"}
				<div class="context-submenu" class:open-left={isNearRightEdge} role="menu">
					<button
						type="button"
						class="context-menu-item"
						onclick={() => handleCopyContent("markdown")}
						role="menuitem"
					>
						<span class="item-icon"><i class="fa-brands fa-markdown"></i></span>
						<span>Copy as Markdown</span>
					</button>
					<button
						type="button"
						class="context-menu-item"
						onclick={() => handleCopyContent("plaintext")}
						role="menuitem"
					>
						<span class="item-icon"><i class="fa-solid fa-align-left"></i></span>
						<span>Copy Plaintext</span>
					</button>
				</div>
			{/if}
		</div>

		<!-- Copy Path Submenu -->
		<div
			class="submenu-wrapper"
			onmouseenter={() => (activeSubmenu = "path")}
			onmouseleave={() => (activeSubmenu = null)}
			role="none"
		>
			<button
				type="button"
				class="context-menu-item has-submenu"
				class:submenu-open={activeSubmenu === "path"}
				role="menuitem"
				aria-haspopup="true"
				aria-expanded={activeSubmenu === "path"}
			>
				<span class="item-icon"><i class="fa-solid fa-location-dot"></i></span>
				<span>Copy Path</span>
				<span class="submenu-arrow">▶</span>
			</button>

			{#if activeSubmenu === "path"}
				<div class="context-submenu" class:open-left={isNearRightEdge} role="menu">
					<button
						type="button"
						class="context-menu-item"
						onclick={() => handleCopyPath("relative")}
						role="menuitem"
					>
						<span class="item-icon"><i class="fa-solid fa-folder-tree"></i></span>
						<span>Relative Project Path</span>
					</button>
					<button
						type="button"
						class="context-menu-item"
						onclick={() => handleCopyPath("system")}
						role="menuitem"
					>
						<span class="item-icon"><i class="fa-solid fa-hard-drive"></i></span>
						<span>System Absolute Path</span>
					</button>
				</div>
			{/if}
		</div>

		<div class="context-menu-divider"></div>

		<button
			type="button"
			class="context-menu-item danger-item"
			onclick={() => {
				onDeleteDoc(doc.id);
				onClose();
			}}
			role="menuitem"
		>
			<span class="item-icon"><i class="fa-solid fa-trash"></i></span>
			<span>Delete</span>
		</button>
	</div>
{/if}

<style>
	@import "./contextMenu.css";
</style>
