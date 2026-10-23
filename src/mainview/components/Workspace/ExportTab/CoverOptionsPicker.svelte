<script lang="ts">
	import {
		COVER_FIT_OPTIONS,
		COVER_POSITION_X_OPTIONS,
		COVER_POSITION_Y_OPTIONS,
	} from "@services/documentExport/constants";
	import type {
		CoverImageFit,
		CoverOptionConfig,
		CoverPositionX,
		CoverPositionY,
	} from "@services/documentExport/types";

	interface Props {
		coverConfig: CoverOptionConfig;
		projectCoverImage?: string;
		onUpdateConfig: (config: CoverOptionConfig) => void;
		onError?: (msg: string) => void;
	}

	let {
		coverConfig,
		projectCoverImage,
		onUpdateConfig,
		onError,
	}: Props = $props();

	let fileInputRef: HTMLInputElement | null = $state(null);

	const activeCoverUrl = $derived(
		coverConfig.source === "custom"
			? coverConfig.customImageDataUrl
			: coverConfig.source === "project"
				? projectCoverImage
				: undefined,
	);

	function handleSourceChange(source: "none" | "project" | "custom") {
		if (source === "none") {
			onUpdateConfig({
				...coverConfig,
				enabled: false,
				source: "none",
			});
		} else if (source === "project") {
			if (!projectCoverImage) {
				onError?.("Project has no cover image set. Please upload a custom image.");
				return;
			}
			onUpdateConfig({
				...coverConfig,
				enabled: true,
				source: "project",
			});
		} else if (source === "custom") {
			onUpdateConfig({
				...coverConfig,
				enabled: true,
				source: "custom",
			});
			if (!coverConfig.customImageDataUrl) {
				fileInputRef?.click();
			}
		}
	}

	function handleFitChange(fit: CoverImageFit) {
		onUpdateConfig({
			...coverConfig,
			fit,
		});
	}

	function handlePositionChange(
		posX: CoverPositionX,
		posY: CoverPositionY,
	) {
		onUpdateConfig({
			...coverConfig,
			positionX: posX,
			positionY: posY,
		});
	}

	function handleCustomImageUpload(files: FileList | null) {
		if (!files || files.length === 0) return;
		const file = files[0];
		if (!file) return;

		if (!file.type.startsWith("image/")) {
			onError?.("Please select a valid image file (.jpg, .png, .webp, etc.).");
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = reader.result as string;
			onUpdateConfig({
				...coverConfig,
				enabled: true,
				source: "custom",
				customImageDataUrl: dataUrl,
			});
		};
		reader.onerror = () => {
			onError?.("Failed to read image file.");
		};
		reader.readAsDataURL(file);
	}
</script>

<div class="cover-options-container">
	<input
		type="file"
		accept="image/*,.jxl,.avif"
		class="sr-only-input"
		bind:this={fileInputRef}
		onchange={(e) => handleCustomImageUpload(e.currentTarget.files)}
		aria-label="Upload custom cover image"
	/>

	<!-- Cover Source Selector -->
	<div class="cover-source-row">
		<button
			type="button"
			class="group-btn"
			class:selected={coverConfig.source === "none"}
			onclick={() => handleSourceChange("none")}
			title="Do not include a cover page"
		>
			<i class="fa-solid fa-ban"></i> None
		</button>

		<button
			type="button"
			class="group-btn"
			class:selected={coverConfig.source === "project"}
			disabled={!projectCoverImage}
			onclick={() => handleSourceChange("project")}
			title={projectCoverImage ? "Use current project cover image" : "Project has no cover image set"}
		>
			<i class="fa-solid fa-book-bookmark"></i> Project Cover
		</button>

		<button
			type="button"
			class="group-btn"
			class:selected={coverConfig.source === "custom"}
			onclick={() => handleSourceChange("custom")}
			title="Upload an image specifically for this export"
		>
			<i class="fa-solid fa-cloud-arrow-up"></i> Custom Image
		</button>
	</div>

	<!-- Cover Settings (Rendered if cover is enabled) -->
	{#if coverConfig.source !== "none" && coverConfig.enabled}
		<div class="cover-active-card">
			<!-- Mini Thumbnail & Source Action Strip -->
			<div class="cover-preview-strip">
				{#if activeCoverUrl}
					<img
						src={activeCoverUrl}
						alt="Cover Preview"
						class="cover-mini-thumb"
					/>
				{:else}
					<div class="cover-mini-thumb cover-empty-thumb">
						<i class="fa-solid fa-image"></i>
					</div>
				{/if}

				<div class="cover-thumb-info">
					<span class="cover-thumb-title">
						{coverConfig.source === "project" ? "Project Cover Selected" : "Custom Export Cover"}
					</span>
					<span class="cover-thumb-desc">
						Takes page 1 exclusively without any other text or elements
					</span>
				</div>

				{#if coverConfig.source === "custom"}
					<button
						type="button"
						class="browse-font-btn browse-font-btn-sm"
						onclick={() => fileInputRef?.click()}
					>
						<i class="fa-solid fa-folder-open"></i> {coverConfig.customImageDataUrl ? "Change" : "Browse"}
					</button>
				{/if}
			</div>

			<!-- Image Fit Options -->
			<div class="cover-sub-section">
				<div class="sub-section-title">
					<span>Image Fit</span>
					<span class="sub-section-badge">{coverConfig.fit.toUpperCase()}</span>
				</div>
				<div class="button-group-row">
					{#each COVER_FIT_OPTIONS as fitOpt}
						<button
							type="button"
							class="group-btn"
							class:selected={coverConfig.fit === fitOpt.id}
							onclick={() => handleFitChange(fitOpt.id)}
							title={fitOpt.description}
						>
							<i class="fa-solid {fitOpt.icon}"></i>
							{fitOpt.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Image Position Options (3x3 grid & directional buttons) -->
			<div class="cover-sub-section">
				<div class="sub-section-title">
					<span>Image Position</span>
					<span class="sub-section-badge">{coverConfig.positionX} / {coverConfig.positionY}</span>
				</div>

				<div class="position-composite-row">
					<!-- 3x3 interactive alignment pad -->
					<div class="position-3x3-grid" title="Click to choose 2D alignment">
						{#each ["top", "middle", "bottom"] as const as y}
							{#each ["left", "center", "right"] as const as x}
								<button
									type="button"
									class="grid-cell-btn"
									class:active={coverConfig.positionX === x && coverConfig.positionY === y}
									onclick={() => handlePositionChange(x, y)}
									title="{x} {y}"
									aria-label="{x} {y} position"
								>
									<i class="fa-solid fa-circle grid-dot-icon"></i>
								</button>
							{/each}
						{/each}
					</div>

					<!-- Segmented directional buttons -->
					<div class="position-selectors-col">
						<div class="position-subgroup">
							<span class="position-subgroup-label">Horizontal</span>
							<div class="button-group-row flex-1">
								{#each COVER_POSITION_X_OPTIONS as posX}
									<button
										type="button"
										class="group-btn"
										class:selected={coverConfig.positionX === posX.id}
										onclick={() => handlePositionChange(posX.id, coverConfig.positionY)}
										title={posX.label}
									>
										{posX.label}
									</button>
								{/each}
							</div>
						</div>

						<div class="position-subgroup">
							<span class="position-subgroup-label">Vertical</span>
							<div class="button-group-row flex-1">
								{#each COVER_POSITION_Y_OPTIONS as posY}
									<button
										type="button"
										class="group-btn"
										class:selected={coverConfig.positionY === posY.id}
										onclick={() => handlePositionChange(coverConfig.positionX, posY.id)}
										title={posY.label}
									>
										{posY.label}
									</button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
