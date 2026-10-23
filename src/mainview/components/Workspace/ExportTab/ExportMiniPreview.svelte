<script lang="ts">
	import { getCssObjectPosition } from "@services/documentExport/coverLayout";
	import { findBundledFont } from "@shared/domain/bundledFonts";
	import type {
		CoverOptionConfig,
		CustomFontConfig,
		FontFamily,
		PaperSize,
		TextAlign,
	} from "@services/documentExport/types";

	interface Props {
		projectName: string;
		paperSize: PaperSize;
		pageColor: string;
		textColor: string;
		fontFamily: FontFamily;
		customFont?: CustomFontConfig | null;
		textAlign: TextAlign;
		showPageNumber: boolean;
		coverConfig?: CoverOptionConfig;
		activeCoverUrl?: string;
	}

	let {
		projectName,
		paperSize,
		pageColor,
		textColor,
		fontFamily,
		customFont = null,
		textAlign,
		showPageNumber,
		coverConfig,
		activeCoverUrl,
	}: Props = $props();

	let previewMode = $state<"content" | "cover">("content");

	const hasCover = $derived(
		coverConfig?.enabled &&
		coverConfig.source !== "none" &&
		!!activeCoverUrl,
	);

	const bundledFont = $derived(findBundledFont(fontFamily));

	const fontCss = $derived(
		fontFamily === "custom" && customFont
			? `'${customFont.name}', serif`
			: bundledFont
				? `'${bundledFont.name}', sans-serif`
				: fontFamily === "Helvetica"
					? "sans-serif"
					: fontFamily === "Courier"
						? "monospace"
						: "serif",
	);

	const aspectRatio = $derived(
		paperSize === "A5" ? "148 / 210" : paperSize === "Letter" ? "8.5 / 11" : "210 / 297",
	);

	const coverObjPosition = $derived(
		coverConfig
			? getCssObjectPosition(coverConfig.positionX, coverConfig.positionY)
			: "center center",
	);
</script>

<div class="mini-preview-container">
	<div class="mini-preview-header">
		<span>Layout Live Preview</span>
		<div style="display: flex; gap: 4px; align-items: center;">
			{#if fontFamily === "custom"}
				<span class="preview-badge" title="Custom Font">{customFont?.name || "Custom Font"}</span>
			{:else if bundledFont}
				<span class="preview-badge" title="Bundled Font">{bundledFont.name}</span>
			{/if}
			<span class="preview-badge">{paperSize}</span>
		</div>
	</div>

	{#if hasCover}
		<div class="preview-pills-row">
			<button
				type="button"
				class="preview-pill-btn"
				class:active={previewMode === "cover"}
				onclick={() => (previewMode = "cover")}
			>
				Page 1: Cover
			</button>
			<button
				type="button"
				class="preview-pill-btn"
				class:active={previewMode === "content"}
				onclick={() => (previewMode = "content")}
			>
				Manuscript
			</button>
		</div>
	{/if}

	{#if previewMode === "cover" && hasCover}
		<!-- Pure Cover Page Mini Preview (Zero text, pure image layout) -->
		<div
			class="mini-paper"
			style="background-color: {pageColor}; aspect-ratio: {aspectRatio}; padding: 0; overflow: hidden; position: relative;"
		>
			<img
				src={activeCoverUrl}
				alt="Cover preview"
				style="width: 100%; height: 100%; object-fit: {coverConfig?.fit === 'none' ? 'none' : coverConfig?.fit}; object-position: {coverObjPosition}; display: block;"
			/>
		</div>
	{:else}
		<!-- Manuscript Prose Page Preview -->
		<div
			class="mini-paper"
			style="background-color: {pageColor}; color: {textColor}; font-family: {fontCss}; aspect-ratio: {aspectRatio};"
		>
			<!-- Top Page Number -->
			{#if showPageNumber}
				<div class="mini-page-number" style="color: {textColor}; opacity: 0.65;">
					1/1
				</div>
			{/if}

			<!-- Mini Chapter Title -->
			<div class="mini-chapter-title" style="color: {textColor}; text-align: center;">
				{projectName || "Chapter 1"}
			</div>

			<!-- Mini Simulated Prose Lines -->
			<div class="mini-prose-block" style="text-align: {textAlign};">
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 94%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 100%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 98%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 62%;"></div>

				<div class="mini-paragraph-gap"></div>

				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 96%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 100%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 88%;"></div>
				<div class="mini-line" style="background-color: {textColor}; opacity: 0.85; width: 45%;"></div>
			</div>
		</div>
	{/if}
</div>

<style>
	.mini-preview-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		background: var(--bg-tertiary, #1f242c);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 8px;
		padding: 14px;
	}

	.mini-preview-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-secondary, #9da7b3);
	}

	.preview-badge {
		font-size: 9px;
		font-family: var(--font-editor, monospace);
		background: var(--bg-secondary, #161b22);
		padding: 1px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-subtle, #30363d);
		color: var(--accent-primary, #e69d45);
	}

	.preview-pills-row {
		display: flex;
		gap: 4px;
		background: var(--bg-secondary, #161b22);
		padding: 2px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle, #30363d);
		width: 100%;
	}

	.preview-pill-btn {
		flex: 1;
		background: transparent;
		border: none;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 500;
		color: var(--text-muted, #7d8590);
		padding: 2px 6px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.preview-pill-btn:hover {
		color: var(--text-primary, #e6edf3);
	}

	.preview-pill-btn.active {
		background: var(--accent-subtle, rgba(230, 157, 69, 0.15));
		color: var(--accent-primary, #e69d45);
		font-weight: 600;
	}

	.mini-paper {
		width: 150px;
		max-width: 100%;
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.15);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}

	.mini-page-number {
		font-size: 7px;
		text-align: center;
		font-weight: 500;
	}

	.mini-chapter-title {
		font-size: 8px;
		font-weight: 700;
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mini-prose-block {
		display: flex;
		flex-direction: column;
		gap: 3px;
		margin-top: 4px;
	}

	.mini-line {
		height: 2.5px;
		border-radius: 1px;
	}

	.mini-paragraph-gap {
		height: 4px;
	}
</style>
