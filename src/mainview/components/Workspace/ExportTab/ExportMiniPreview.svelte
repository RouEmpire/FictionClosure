<script lang="ts">
	import type {
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
	}: Props = $props();

	const fontCss = $derived(
		fontFamily === "custom" && customFont
			? `'${customFont.name}', serif`
			: fontFamily === "Helvetica"
				? "sans-serif"
				: fontFamily === "Courier"
					? "monospace"
					: "serif",
	);

	const aspectRatio = $derived(
		paperSize === "A5" ? "148 / 210" : paperSize === "Letter" ? "8.5 / 11" : "210 / 297",
	);
</script>

<div class="mini-preview-container">
	<div class="mini-preview-header">
		<span>Layout Live Preview</span>
		<div style="display: flex; gap: 4px; align-items: center;">
			{#if fontFamily === "custom"}
				<span class="preview-badge" title="Custom Font">{customFont?.name || "Custom Font"}</span>
			{/if}
			<span class="preview-badge">{paperSize}</span>
		</div>
	</div>

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
