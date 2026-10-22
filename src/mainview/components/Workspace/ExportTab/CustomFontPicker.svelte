<script lang="ts">
	import {
		parseCustomFontFile,
		sanitizeFontFamilyName,
	} from "@services/documentExport/fontManager";
	import type { CustomFontConfig } from "@services/documentExport/types";

	interface Props {
		customFont: CustomFontConfig | null;
		onSelectCustomFont: (font: CustomFontConfig | null) => void;
		onError?: (message: string) => void;
	}

	let { customFont, onSelectCustomFont, onError }: Props = $props();

	let fileInputRef: HTMLInputElement | null = $state(null);
	let isDragging = $state(false);
	let isLoading = $state(false);

	async function handleFiles(files: FileList | null) {
		if (!files || files.length === 0) return;
		const file = files[0];
		if (!file) return;

		isLoading = true;
		try {
			const fontConfig = await parseCustomFontFile(file);
			onSelectCustomFont(fontConfig);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			onError?.(msg);
		} finally {
			isLoading = false;
			if (fileInputRef) fileInputRef.value = "";
		}
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			handleFiles(e.dataTransfer.files);
		}
	}

	function handleFontNameChange(newName: string) {
		if (!customFont) return;
		const cleaned = sanitizeFontFamilyName(newName);
		onSelectCustomFont({
			...customFont,
			name: cleaned,
		});
	}
</script>

<div class="custom-font-picker-container">
	<input
		type="file"
		accept=".ttf,.otf,.woff"
		class="sr-only-input"
		bind:this={fileInputRef}
		onchange={(e) => handleFiles(e.currentTarget.files)}
		aria-label="Upload custom font file"
	/>

	{#if !customFont}
		<!-- Upload / Dropzone state -->
		<div
			class="font-dropzone"
			class:dragging={isDragging}
			ondragover={(e) => {
				e.preventDefault();
				isDragging = true;
			}}
			ondragleave={() => (isDragging = false)}
			ondrop={handleDrop}
			role="button"
			tabindex="0"
			onclick={() => fileInputRef?.click()}
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					fileInputRef?.click();
				}
			}}
			aria-label="Click to browse or drop font file"
		>
			<div class="dropzone-icon">
				{#if isLoading}
					<i class="fa-solid fa-spinner fa-spin"></i>
				{:else}
					<i class="fa-solid fa-cloud-arrow-up"></i>
				{/if}
			</div>
			<div class="dropzone-text">
				<span class="dropzone-title">
					{isLoading ? "Reading font file..." : "Select or Drop Custom Font"}
				</span>
				<span class="dropzone-hint">
					Supports TrueType (.ttf) and OpenType (.otf) files up to 25 MB
				</span>
			</div>
			<button
				type="button"
				class="browse-font-btn"
				onclick={(e) => {
					e.stopPropagation();
					fileInputRef?.click();
				}}
				disabled={isLoading}
			>
				<i class="fa-solid fa-folder-open"></i> Browse File
			</button>
		</div>
	{:else}
		<!-- Loaded font state -->
		<div class="custom-font-card">
			<div class="card-header-row">
				<div class="font-meta-group">
					<span class="font-icon-badge">
						<i class="fa-solid fa-font"></i>
					</span>
					<div class="font-info-col">
						<div class="font-name-edit-row">
							<label for="custom-font-name-input" class="visually-hidden">Custom font name</label>
							<input
								id="custom-font-name-input"
								type="text"
								class="custom-font-name-input"
								value={customFont.name}
								oninput={(e) => handleFontNameChange(e.currentTarget.value)}
								title="Click to customize font identifier name"
							/>
							<span class="font-ext-badge">{customFont.format.toUpperCase()}</span>
						</div>
						<span class="font-filesize-hint">
							{customFont.fileName} • {(customFont.sizeBytes / 1024).toFixed(1)} KB
						</span>
					</div>
				</div>

				<div class="font-card-actions">
					<button
						type="button"
						class="change-font-btn"
						onclick={() => fileInputRef?.click()}
						title="Replace with another font file"
					>
						<i class="fa-solid fa-arrow-rotate-right"></i> Change
					</button>
					<button
						type="button"
						class="remove-font-btn"
						onclick={() => onSelectCustomFont(null)}
						title="Remove custom font"
						aria-label="Remove custom font"
					>
						<i class="fa-solid fa-trash-can"></i>
					</button>
				</div>
			</div>

			<!-- Live sample preview rendered using this exact font -->
			<div
				class="font-sample-preview"
				style="font-family: '{customFont.name}', serif;"
			>
				The quick brown fox jumps over the lazy dog. 0123456789
			</div>
		</div>
	{/if}
</div>
