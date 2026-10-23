<script lang="ts">
	import type { FictionDocument, ProjectInfo } from "@shared/types";
	import {
		DEFAULT_COVER_OPTIONS,
		DEFAULT_PDF_EXPORT_OPTIONS,
		MARGIN_PRESETS,
		PAGE_COLOR_PRESETS,
		PAPER_SIZE_OPTIONS,
		TEXT_ALIGN_OPTIONS,
		TEXT_COLOR_PRESETS,
	} from "@services/documentExport/constants";
	import {
		downloadBlob,
		openPdfBlobInNewTab,
	} from "@services/documentExport/exportDownloader";
	import { exportProjectToPdf } from "@services/documentExport/exportService";
	import {
		areStandardFontsAvailable,
		getAvailableFontOptions,
	} from "@services/documentExport/fontManager";
	import { ensureBundledFontsRegisteredInCss } from "@shared/domain/bundledFonts";
	import type {
		CoverOptionConfig,
		CustomFontConfig,
		ExportFormat,
		ExportResult,
		FontFamily,
		PaperSize,
		PdfExportOptions,
		TextAlign,
	} from "@services/documentExport/types";
	import { savePdfToDisk } from "@services/storage";
	import ColorPresetPicker from "./ColorPresetPicker.svelte";
	import CoverOptionsPicker from "./CoverOptionsPicker.svelte";
	import CustomFontPicker from "./CustomFontPicker.svelte";
	import ExportMiniPreview from "./ExportMiniPreview.svelte";
	import FormatSelector from "./FormatSelector.svelte";
	import "./exportTab.css";

	interface Props {
		project: ProjectInfo;
		documents?: FictionDocument[];
		onShowToast?: (msg: string) => void;
	}

	let { project, documents = [], onShowToast }: Props = $props();

	let selectedFormat = $state<ExportFormat>("pdf");
	let paperSize = $state<PaperSize>(DEFAULT_PDF_EXPORT_OPTIONS.paperSize);
	let textColor = $state(DEFAULT_PDF_EXPORT_OPTIONS.textColor);
	let pageColor = $state(DEFAULT_PDF_EXPORT_OPTIONS.pageColor);
	let margin = $state(DEFAULT_PDF_EXPORT_OPTIONS.margin);
	let showPageNumber = $state(DEFAULT_PDF_EXPORT_OPTIONS.showPageNumber);
	let customFont = $state<CustomFontConfig | null>(null);

	ensureBundledFontsRegisteredInCss();

	const standardAvailable = areStandardFontsAvailable();
	const availableFonts = getAvailableFontOptions();

	// Default font: standard fonts if available, or first bundled font, or custom
	let fontFamily = $state<FontFamily>(
		standardAvailable
			? DEFAULT_PDF_EXPORT_OPTIONS.fontFamily
			: availableFonts.length > 0 && availableFonts[0].id !== "custom"
				? availableFonts[0].id
				: "custom",
	);

	let textAlign = $state<TextAlign>(DEFAULT_PDF_EXPORT_OPTIONS.textAlign);
	let coverConfig = $state<CoverOptionConfig>({
		...DEFAULT_COVER_OPTIONS,
		source: project.coverImage ? "project" : "none",
		enabled: !!project.coverImage,
	});

	const activeCoverUrl = $derived(
		coverConfig.source === "custom"
			? coverConfig.customImageDataUrl
			: coverConfig.source === "project"
				? project.coverImage
				: undefined,
	);

	let includeTitlePage = $state(DEFAULT_PDF_EXPORT_OPTIONS.includeTitlePage);
	let includeManuscriptOnly = $state(
		DEFAULT_PDF_EXPORT_OPTIONS.includeManuscriptOnly,
	);

	let isExporting = $state(false);
	let progressText = $state("");
	let lastResult = $state<ExportResult | null>(null);

	async function handleExport(previewOnly: boolean = false) {
		if (isExporting) return;

		if (fontFamily === "custom" && !customFont) {
			const msg =
				"Please select or upload a custom font file (.ttf or .otf) before exporting.";
			if (onShowToast) onShowToast(msg);
			else alert(msg);
			return;
		}

		isExporting = true;
		progressText = "Preparing PDF document...";
		lastResult = null;

		const options: PdfExportOptions = {
			format: "pdf",
			paperSize,
			textColor,
			pageColor,
			margin,
			showPageNumber,
			fontFamily,
			customFont: customFont ?? undefined,
			textAlign,
			includeCover: coverConfig.enabled && coverConfig.source !== "none",
			coverOptions: coverConfig,
			includeTitlePage,
			includeManuscriptOnly,
			saveToDisk: savePdfToDisk,
		};

		try {
			const res = await exportProjectToPdf(
				project,
				documents,
				options,
				(prog) => {
					progressText = prog.message;
				},
			);

			lastResult = res;

			if (res.success && res.blob) {
				if (previewOnly) {
					openPdfBlobInNewTab(res.blob);
					onShowToast?.("Opened PDF preview in new window");
				} else {
					downloadBlob(res.blob, res.fileName || "manuscript.pdf");
					const msg = res.filePath
						? `Exported PDF saved to ${res.filePath}`
						: `Exported PDF "${res.fileName}" downloaded successfully`;
					onShowToast?.(msg);
				}
			} else if (!res.success) {
				alert(`Export failed: ${res.error || "Unknown error"}`);
			}
		} catch (err) {
			console.error("Export error:", err);
			alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
		} finally {
			isExporting = false;
			progressText = "";
		}
	}
</script>

<div class="export-tab-container">
	<!-- Format Selector Bar (PDF active, EPUB/DOCX/MD/HTML marked LATER) -->
	<FormatSelector
		{selectedFormat}
		onSelectFormat={(f) => (selectedFormat = f)}
	/>

	<!-- Main Export Options Grid -->
	<div class="export-workspace-grid">
		<!-- Left: Form Controls -->
		<div class="export-options-col">
			<!-- Paper Size -->
			<div class="option-field">
				<label class="option-label" for="export-paper-size">
					<span>Paper Size</span>
					<span class="option-hint">Physical sheet format</span>
				</label>
				<select id="export-paper-size" class="option-select" bind:value={paperSize}>
					{#each PAPER_SIZE_OPTIONS as p}
						<option value={p.id}>{p.label} — {p.description}</option>
					{/each}
				</select>
			</div>

			<!-- Page Color -->
			<ColorPresetPicker
				id="export-page-color"
				label="Page Background Color"
				hint="Canvas fill color"
				bind:value={pageColor}
				presets={PAGE_COLOR_PRESETS}
				onChange={(val) => (pageColor = val)}
			/>

			<!-- Text Color -->
			<ColorPresetPicker
				id="export-text-color"
				label="Text Color"
				hint="Typography ink tone"
				bind:value={textColor}
				presets={TEXT_COLOR_PRESETS}
				onChange={(val) => (textColor = val)}
			/>

			<!-- Page Margin -->
			<div class="option-field">
				<label class="option-label" for="export-page-margin">
					<span>Page Margin: <strong>{margin} pt</strong></span>
					<div class="margin-presets-row">
						{#each MARGIN_PRESETS as mp}
							<button
								type="button"
								class="margin-chip"
								class:selected={margin === mp.pt}
								onclick={() => (margin = mp.pt)}
							>
								{mp.label}
							</button>
						{/each}
					</div>
				</label>
				<input id="export-page-margin" type="range" min="24" max="96" step="2" bind:value={margin} />
			</div>

			<!-- Font Family -->
			<div class="option-field">
				<span class="option-label">Font Family</span>
				{#if !standardAvailable}
					<div class="standard-font-warning-banner">
						<i class="fa-solid fa-triangle-exclamation"></i>
						<span>Standard fonts are not available on this system. You can export using Bundled Fonts or upload a custom font (.ttf, .otf).</span>
					</div>
				{/if}
				<div class="button-group-row" style="flex-wrap: wrap;">
					{#each availableFonts as f}
						<button
							type="button"
							class="group-btn"
							class:selected={fontFamily === f.id}
							onclick={() => (fontFamily = f.id)}
							title={f.description}
						>
							{#if f.id === "custom"}
								<i class="fa-solid fa-font"></i>
							{:else if f.category === "bundled"}
								<i class="fa-solid fa-box-archive" style="font-size: 0.75rem;"></i>
							{/if}
							{f.label}
						</button>
					{/each}
				</div>

				{#if fontFamily === "custom"}
					<CustomFontPicker
						{customFont}
						onSelectCustomFont={(f) => (customFont = f)}
						onError={(msg) => onShowToast ? onShowToast(msg) : alert(msg)}
					/>
				{/if}
			</div>

			<!-- Content Align -->
			<div class="option-field">
				<span class="option-label">Content Align</span>
				<div class="button-group-row">
					{#each TEXT_ALIGN_OPTIONS as a}
						<button
							type="button"
							class="group-btn"
							class:selected={textAlign === a.id}
							onclick={() => (textAlign = a.id)}
							title={a.label}
						>
							<i class="fa-solid {a.icon}"></i>
							{a.label.split(" ")[0]}
						</button>
					{/each}
				</div>
			</div>

			<!-- Cover Options -->
			<div class="option-field">
				<label class="option-label" for="export-cover-section">
					<span>Book Cover Page</span>
					<span class="option-hint">Exclusive first page (no text or numbers)</span>
				</label>
				<CoverOptionsPicker
					{coverConfig}
					projectCoverImage={project.coverImage}
					onUpdateConfig={(cfg) => (coverConfig = cfg)}
					onError={(msg) => onShowToast ? onShowToast(msg) : alert(msg)}
				/>
			</div>

			<!-- Checkboxes -->
			<div class="option-field">
				<label class="checkbox-field">
					<input type="checkbox" bind:checked={showPageNumber} />
					<span>Show top page numbers (<code style="color: var(--accent-primary);">&lt;page&gt;/&lt;total&gt;</code>)</span>
				</label>
				<label class="checkbox-field">
					<input type="checkbox" bind:checked={includeTitlePage} />
					<span>Include introductory title page</span>
				</label>
				<label class="checkbox-field">
					<input type="checkbox" bind:checked={includeManuscriptOnly} />
					<span>Manuscript documents only (exclude character sheets & world notes)</span>
				</label>
			</div>
		</div>

		<!-- Right: Visual Live Mini Preview -->
		<div class="export-preview-col">
			<ExportMiniPreview
				projectName={project.name}
				{paperSize}
				{pageColor}
				{textColor}
				{fontFamily}
				{customFont}
				{textAlign}
				{showPageNumber}
				{coverConfig}
				{activeCoverUrl}
			/>
		</div>
	</div>

	<!-- Action Buttons & Status -->
	<div class="export-action-section">
		{#if isExporting}
			<div class="export-progress-banner">
				<i class="fa-solid fa-spinner fa-spin"></i>
				<span>{progressText}</span>
			</div>
		{/if}

		{#if lastResult && lastResult.success}
			<div class="export-result-banner">
				<div class="result-text">
					<span class="result-title">
						<i class="fa-solid fa-circle-check"></i> PDF Generated Successfully!
					</span>
					<span class="result-detail">
						Size: {((lastResult.bytes || 0) / 1024).toFixed(1)} KB
						{#if lastResult.filePath}
							— Saved to <code>{lastResult.filePath}</code>
						{/if}
					</span>
				</div>
				<div class="result-actions">
					{#if lastResult.blob}
						<button
							type="button"
							class="download-link-btn"
							onclick={() => downloadBlob(lastResult!.blob!, lastResult!.fileName || "export.pdf")}
						>
							<i class="fa-solid fa-download"></i> Download
						</button>
						<button
							type="button"
							class="export-secondary-btn"
							onclick={() => openPdfBlobInNewTab(lastResult!.blob!)}
						>
							<i class="fa-solid fa-eye"></i> View
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<div class="action-buttons-bar">
			<button
				type="button"
				class="export-primary-btn"
				onclick={() => handleExport(false)}
				disabled={isExporting || (fontFamily === "custom" && !customFont)}
			>
				<i class="fa-solid fa-file-pdf"></i>
				{isExporting ? "Compiling PDF..." : "Export to PDF"}
			</button>
			<button
				type="button"
				class="export-secondary-btn"
				onclick={() => handleExport(true)}
				disabled={isExporting || (fontFamily === "custom" && !customFont)}
				title="Generate and preview PDF in new tab"
			>
				<i class="fa-solid fa-arrow-up-right-from-square"></i> Preview in Browser
			</button>
		</div>
	</div>
</div>
