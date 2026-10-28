<script lang="ts">
    import {
        parseCustomThemeJson,
        type CustomThemeEntry,
    } from "@shared/domain/customThemes";

    interface Props {
        onInstalled: (themes: CustomThemeEntry[], packageName: string) => void;
    }

    let { onInstalled }: Props = $props();

    let fileInputEl = $state<HTMLInputElement | null>(null);
    let isDragActive = $state(false);
    let feedbackStatus = $state<{ type: "success" | "error"; message: string } | null>(null);

    function handleFile(file: File) {
        if (!file.name.toLowerCase().endsWith(".json")) {
            feedbackStatus = {
                type: "error",
                message: "Please select a valid JSON theme file (.json).",
            };
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            if (typeof content !== "string") {
                feedbackStatus = {
                    type: "error",
                    message: "Failed to read the selected file.",
                };
                return;
            }

            const parsed = parseCustomThemeJson(content);
            if (!parsed.success) {
                feedbackStatus = {
                    type: "error",
                    message: parsed.error,
                };
                return;
            }

            feedbackStatus = {
                type: "success",
                message: `Successfully installed ${parsed.themes.length} theme(s) from "${parsed.packageName}"!`,
            };

            onInstalled(parsed.themes, parsed.packageName);
        };

        reader.onerror = () => {
            feedbackStatus = {
                type: "error",
                message: "Error reading file from disk.",
            };
        };

        reader.readAsText(file);
    }

    function handleFileInputChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
            handleFile(file);
            target.value = "";
        }
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragActive = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragActive = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragActive = false;
        const file = e.dataTransfer?.files?.[0];
        if (file) {
            handleFile(file);
        }
    }

    function openFilePicker() {
        fileInputEl?.click();
    }
</script>

<div class="theme-dropzone-container" role="region" aria-label="Theme Installation">
    <!-- Community Source Callout Banner -->
    <div class="zen-community-banner">
        <div class="zen-banner-left">
            <i class="fa-solid fa-cloud-arrow-down zen-banner-icon"></i>
            <div class="zen-banner-content">
                <h4 class="zen-banner-title">Need More Themes?</h4>
                <p class="zen-banner-desc">
                    Download hundreds of community-crafted themes from
                    <strong>zen-themes.com</strong> or any Zed theme JSON repository.
                </p>
            </div>
        </div>
        <a
            href="https://zen-themes.com"
            target="_blank"
            rel="noopener noreferrer"
            class="zen-link-btn"
            title="Browse themes on zen-themes.com in your browser"
        >
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            zen-themes.com
        </a>
    </div>

    <!-- Hidden native file input -->
    <input
        type="file"
        accept=".json,application/json"
        class="hidden"
        style="display: none;"
        bind:this={fileInputEl}
        onchange={handleFileInputChange}
    />

    <!-- Drag & Drop Area -->
    <div
        class="theme-dropzone"
        class:drag-active={isDragActive}
        onclick={openFilePicker}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openFilePicker();
            }
        }}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        role="button"
        tabindex="0"
        aria-label="Upload custom theme JSON file"
    >
        <i class="fa-solid fa-file-arrow-up dropzone-icon"></i>
        <p class="dropzone-text">Drop your Zed / Zen theme <code>.json</code> file here</p>
        <p class="dropzone-subtext">or click anywhere to browse from your computer</p>
    </div>

    <!-- Status Feedback Message -->
    {#if feedbackStatus}
        <div
            class="dropzone-status"
            class:success={feedbackStatus.type === "success"}
            class:error={feedbackStatus.type === "error"}
            role="status"
        >
            <i
                class={feedbackStatus.type === "success"
                    ? "fa-solid fa-circle-check"
                    : "fa-solid fa-triangle-exclamation"}
            ></i>
            <span>{feedbackStatus.message}</span>
        </div>
    {/if}
</div>
