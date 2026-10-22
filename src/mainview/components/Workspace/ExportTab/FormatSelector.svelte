<script lang="ts">
	import { EXPORT_FORMAT_OPTIONS } from "@services/documentExport/constants";
	import type { ExportFormat } from "@services/documentExport/types";

	interface Props {
		selectedFormat: ExportFormat;
		onSelectFormat: (format: ExportFormat) => void;
	}

	let { selectedFormat, onSelectFormat }: Props = $props();
</script>

<div class="format-selector-section">
	<span class="section-label">Select Output Format</span>
	<div class="formats-row">
		{#each EXPORT_FORMAT_OPTIONS as fmt}
			<button
				type="button"
				class="format-card"
				class:active={selectedFormat === fmt.id}
				class:disabled={fmt.status === "later"}
				onclick={() => {
					if (fmt.status === "ready") onSelectFormat(fmt.id);
				}}
				title={fmt.description}
			>
				<i class="fa-solid {fmt.icon} format-card-icon"></i>
				<span class="format-card-title">{fmt.label}</span>
				<span class="format-status-badge {fmt.status}">
					{fmt.status === "ready" ? "Ready" : "Later"}
				</span>
			</button>
		{/each}
	</div>
</div>
