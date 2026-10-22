<script lang="ts">
    import type { SaveState, ViewMode, ZenModeType } from "@shared/types";
    import ZenDropdown from "./ZenDropdown.svelte";

    interface Props {
        saveState: SaveState;
        folderPath?: string;
        lastSaved?: string;
        viewMode: ViewMode;
        zenMode: ZenModeType;
        showInspector: boolean;
        onSave: () => void;
        onSetViewMode: (mode: ViewMode) => void;
        onSelectZenMode: (mode: ZenModeType) => void;
        onToggleInspector: () => void;
        onOpenShortcuts: () => void;
    }

    let {
        saveState,
        folderPath,
        lastSaved,
        viewMode,
        zenMode,
        showInspector,
        onSave,
        onSetViewMode,
        onSelectZenMode,
        onToggleInspector,
        onOpenShortcuts,
    }: Props = $props();

    const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modKey = isMac ? "⌘" : "Ctrl";
</script>

<div class="header-right">
    <!-- Save status badge with timestamp & location info -->
    <div
        class="save-status save-status-{saveState}"
        title={folderPath
            ? lastSaved
                ? `Saved to ${folderPath} at ${new Date(lastSaved).toLocaleTimeString()}`
                : `Saved to ${folderPath}`
            : "Unsaved: click Save to choose a project folder"}
    >
        {#if saveState === "saved"}
            <span class="status-dot green"></span>
            <span class="status-text">
                Saved {#if lastSaved}<span class="save-time"
                        >({new Date(lastSaved).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })})</span
                    >{/if}
            </span>
        {:else if saveState === "unsaved"}
            <span class="status-dot amber"></span>
            <span class="status-text">Unsaved changes</span>
        {:else if saveState === "saving"}
            <span class="status-dot spinner"></span>
            <span class="status-text">Saving to disk...</span>
        {:else}
            <span class="status-dot red"></span>
            <span class="status-text">Save Error</span>
        {/if}
    </div>

    <!-- Save Button -->
    <button
        type="button"
        class="save-btn"
        onclick={onSave}
        disabled={saveState === "saving"}
        title={folderPath
            ? `Save project to ${folderPath} (${modKey}+S)`
            : `Choose folder and save project (${modKey}+S)`}
    >
        Save
    </button>

    <div class="divider-vertical"></div>

    <!-- View mode toggle -->
    <div class="view-mode-group" role="group" aria-label="Editor view mode">
        <button
            type="button"
            class="view-btn"
            class:active={viewMode === "editor"}
            onclick={() => onSetViewMode("editor")}
            title="Editor Only ({modKey}+1)"
            aria-pressed={viewMode === "editor"}
        >
            Edit
        </button>
        <button
            type="button"
            class="view-btn"
            class:active={viewMode === "split"}
            onclick={() => onSetViewMode("split")}
            title="Split View ({modKey}+2)"
            aria-pressed={viewMode === "split"}
        >
            Split
        </button>
        <button
            type="button"
            class="view-btn"
            class:active={viewMode === "preview"}
            onclick={() => onSetViewMode("preview")}
            title="Preview Only ({modKey}+3)"
            aria-pressed={viewMode === "preview"}
        >
            Read
        </button>
    </div>

    <div class="divider-vertical"></div>

    <!-- Zen Modes Dropdown -->
    <ZenDropdown {zenMode} {onSelectZenMode} />

    <!-- Toggle Inspector -->
    <button
        type="button"
        class="icon-btn"
        class:active={showInspector}
        onclick={onToggleInspector}
        title={showInspector
            ? `Hide Inspector (${modKey}+J)`
            : `Show Inspector (${modKey}+J)`}
        aria-label="Toggle inspector panel"
    >
        <i class="fa-solid fa-address-card"></i>
    </button>

    <!-- Shortcuts Cheat Sheet Button -->
    <button
        type="button"
        class="icon-btn help-btn"
        onclick={onOpenShortcuts}
        title="Keyboard Shortcuts (?)"
        aria-label="Open keyboard shortcuts"
    >
        <i class="fa-solid fa-keyboard"></i>
    </button>
</div>

<style>
    .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .divider-vertical {
        width: 1px;
        height: 20px;
        background-color: var(--border-subtle);
    }

    .save-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-muted);
    }

    .save-time {
        font-size: 11px;
        opacity: 0.8;
    }

    .status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
    }

    .status-dot.green {
        background-color: var(--success-color);
        box-shadow: 0 0 6px rgba(63, 185, 80, 0.5);
    }

    .status-dot.amber {
        background-color: var(--warning-color);
        box-shadow: 0 0 6px rgba(210, 153, 34, 0.5);
    }

    .status-dot.red {
        background-color: var(--danger-color);
    }

    .status-dot.spinner {
        background: transparent;
        border: 2px solid var(--accent-primary);
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .save-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-primary);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .save-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        border-color: var(--accent-primary);
        color: var(--accent-hover);
    }

    .save-btn:disabled {
        opacity: 0.5;
        cursor: default;
    }

    .view-mode-group {
        display: flex;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 2px;
    }

    .view-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .view-btn:hover {
        color: var(--text-primary);
    }

    .view-btn.active {
        background: var(--bg-hover);
        color: var(--text-primary);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .icon-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        border-radius: 6px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
    }

    .icon-btn:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }

    .icon-btn.active {
        background: var(--accent-subtle);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }
</style>
