<script lang="ts">
	import type { FictionDocument, ProjectInfo } from "@shared/types";
	import {
		DEFAULT_PDF_EXPORT_OPTIONS,
		FONT_FAMILY_OPTIONS,
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
	import type {
		ExportFormat,
		ExportResult,
		FontFamily,
		PaperSize,
		PdfExportOptions,
		TextAlign,
	} from "@services/documentExport/types";
	import { savePdfToDisk } from "@services/storage";
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
	let fontFamily = $state<FontFamily>(DEFAULT_PDF_EXPORT_OPTIONS.fontFamily);
	let textAlign = $state<TextAlign>(DEFAULT_PDF_EXPORT_OPTIONS.textAlign);
	let includeCover = $state(DEFAULT_PDF_EXPORT_OPTIONS.includeCover);
	let includeTitlePage = $state(DEFAULT_PDF_EXPORT_OPTIONS.includeTitlePage);
	let includeManuscriptOnly = $state(
		DEFAULT_PDF_EXPORT_OPTIONS.includeManuscriptOnly,
	);

	let isExporting = $state(false);
	let progressText = $state("");
	let lastResult = $state<ExportResult | null>(null);

	async function handleExport(previewOnly: boolean = false) {
		if (isExporting) return;
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
			textAlign,
			includeCover,
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
			<div class="option-field">
				<label class="option-label" for="export-page-color">
					<span>Page Background Color</span>
					<span class="option-hint">Canvas fill color</span>
				</label>
				<div class="color-picker-row">
					<input type="color" id="export-page-color" class="color-input-native" bind:value={pageColor} />
					<input type="text" class="option-input color-hex-input" bind:value={pageColor} />
					<div class="color-chips-row">
						{#each PAGE_COLOR_PRESETS as c}
							<button
								type="button"
								class="color-chip"
								class:selected={pageColor.toUpperCase() === c.hex.toUpperCase()}
								style="background-color: {c.hex};"
								onclick={() => (pageColor = c.hex)}
								title={c.label}
								aria-label={c.label}
							></button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Text Color -->
			<div class="option-field">
				<label class="option-label" for="export-text-color">
					<span>Text Color</span>
					<span class="option-hint">Typography ink tone</span>
				</label>
				<div class="color-picker-row">
					<input type="color" id="export-text-color" class="color-input-native" bind:value={textColor} />
					<input type="text" class="option-input color-hex-input" bind:value={textColor} />
					<div class="color-chips-row">
						{#each TEXT_COLOR_PRESETS as c}
							<button
								type="button"
								class="color-chip"
								class:selected={textColor.toUpperCase() === c.hex.toUpperCase()}
								style="background-color: {c.hex};"
								onclick={() => (textColor = c.hex)}
								title={c.label}
								aria-label={c.label}
							></button>
						{/each}
					</div>
				</div>
			</div>

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
				<div class="button-group-row">
					{#each FONT_FAMILY_OPTIONS as f}
						<button
							type="button"
							class="group-btn"
							class:selected={fontFamily === f.id}
							onclick={() => (fontFamily = f.id)}
							title={f.description}
						>
							{f.label}
						</button>
					{/each}
				</div>
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
				{#if project.coverImage}
					<label class="checkbox-field">
						<input type="checkbox" bind:checked={includeCover} />
						<span>Include book cover page</span>
					</label>
				{/if}
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
				{textAlign}
				{showPageNumber}
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
				disabled={isExporting}
			>
				<i class="fa-solid fa-file-pdf"></i>
				{isExporting ? "Compiling PDF..." : "Export to PDF"}
			</button>
			<button
				type="button"
				class="export-secondary-btn"
				onclick={() => handleExport(true)}
				disabled={isExporting}
				title="Generate and preview PDF in new tab"
			>
				<i class="fa-solid fa-arrow-up-right-from-square"></i> Preview in Browser
			</button>
		</div>
	</div>
</div>
