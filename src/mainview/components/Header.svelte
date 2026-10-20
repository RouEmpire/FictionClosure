<script lang="ts">
    import type {
        FictionDocument,
        SaveState,
        ViewMode,
        ZenModeType,
    } from "../../shared/types";

    interface Props {
        projectName: string;
        folderPath?: string;
        lastSaved?: string;
        activeDoc: FictionDocument | null;
        saveState: SaveState;
        viewMode: ViewMode;
        isSidebarOpen: boolean;
        onToggleSidebar: () => void;
        zenMode: ZenModeType;
        onSelectZenMode: (mode: ZenModeType) => void;
        showInspector: boolean;
        onToggleInspector: () => void;
        onSetViewMode: (mode: ViewMode) => void;
        onSave: () => void;
        onChangeFolder: () => void;
        onOpenCommandPalette: () => void;
        onOpenShortcuts: () => void;
        onCloseProject?: () => void;
    }

    let {
        projectName,
        folderPath,
        lastSaved,
        activeDoc,
        saveState,
        viewMode,
        isSidebarOpen,
        onToggleSidebar,
        zenMode,
        onSelectZenMode,
        showInspector,
        onToggleInspector,
        onSetViewMode,
        onSave,
        onChangeFolder,
        onOpenCommandPalette,
        onOpenShortcuts,
        onCloseProject,
    }: Props = $props();

    let isZenDropdownOpen = $state(false);

    const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modKey = isMac ? "⌘" : "Ctrl";

    function formatFolderName(fullPath?: string): string {
        if (!fullPath) return "Set Save Location...";
        const parts = fullPath.split(/[/\\]/).filter(Boolean);
        return parts[parts.length - 1] || fullPath;
    }
</script>

<svelte:window
    onclick={(e) => {
        if (isZenDropdownOpen) {
            const target = e.target as HTMLElement;
            if (!target.closest(".zen-dropdown-wrapper")) {
                isZenDropdownOpen = false;
            }
        }
    }}
    onkeydown={(e) => {
        if (isZenDropdownOpen && e.key === "Escape") {
            isZenDropdownOpen = false;
        }
    }}
/>

<header class="app-header">
    <div class="header-left">
        {#if onCloseProject}
            <button
                type="button"
                class="icon-btn home-btn"
                onclick={onCloseProject}
                title="Close project and return to Home / Projects Overview"
                aria-label="Return to Home"
            >
                ⌂ Home
            </button>
            <div class="divider-vertical"></div>
        {/if}

        <!-- Sidebar Toggle Button -->
        <button
            type="button"
            class="icon-btn sidebar-toggle-btn"
            class:active={isSidebarOpen}
            onclick={onToggleSidebar}
            title={isSidebarOpen
                ? `Hide Sidebar (${modKey}+Alt+B)`
                : `Show Sidebar (${modKey}+Alt+B)`}
            aria-label="Toggle document tree sidebar"
        >
            ◨
        </button>

        <div class="divider-vertical"></div>
        <span class="project-title" title="Project: {projectName}">
            {projectName}
        </span>

        <button
            type="button"
            class="search-trigger-btn"
            onclick={onOpenCommandPalette}
            title="Search documents & commands ({modKey}+K)"
        >
            <span class="search-icon">🔍</span>
            <span class="search-text">Quick Search...</span>
        </button>
    </div>

    <div class="header-center">
        {#if activeDoc}
            <div class="doc-badge doc-badge-{activeDoc.type}">
                {activeDoc.type}
            </div>
            <span class="active-title">{activeDoc.title}</span>
        {:else}
            <span class="no-doc-label">No document selected</span>
        {/if}
    </div>

    <div class="header-right">
        <!-- Subtle status badges for Git and Auto-save -->
        <!-- <div class="tech-tag-group">
			<span class="tech-tag" title="Git repository initialized. Interactive Git UI integration planned (TODO)">
				<span class="tech-dot git-dot"></span>Git: main <span class="todo-pill">TODO</span>
			</span>
			<span class="tech-tag" title="Crash cache active in .fictionclosure/cache/. Background auto-save system planned (TODO)">
				<span class="tech-dot auto-dot"></span>Auto-save <span class="todo-pill">TODO</span>
			</span>
		</div> -->

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
        <div class="zen-dropdown-wrapper">
            <button
                type="button"
                class="icon-btn zen-btn"
                class:active={zenMode !== "none"}
                onclick={(e) => {
                    e.stopPropagation();
                    isZenDropdownOpen = !isZenDropdownOpen;
                }}
                title="Zen writing modes (Click to choose mode)"
                aria-haspopup="true"
                aria-expanded={isZenDropdownOpen}
                aria-label="Zen writing modes"
            >
                🧘 <span class="dropdown-caret">▾</span>
            </button>

            {#if isZenDropdownOpen}
                <div
                    class="zen-dropdown-panel"
                    role="menu"
                    aria-label="Zen mode selection"
                >
                    <div class="dropdown-section-title">ZEN WRITING MODES</div>

                    <button
                        type="button"
                        class="dropdown-row"
                        class:active={zenMode === "zen"}
                        onclick={() => {
                            onSelectZenMode(zenMode === "zen" ? "none" : "zen");
                            isZenDropdownOpen = false;
                        }}
                        role="menuitem"
                    >
                        <span class="row-icon">🧘</span>
                        <div class="row-content">
                            <div class="row-title-line">
                                <span class="row-title">Zen Mode</span>
                                {#if zenMode === "zen"}
                                    <span class="badge-active">Active</span>
                                {/if}
                            </div>
                            <span class="row-desc"
                                >Distraction-free centered editor</span
                            >
                        </div>
                        <kbd class="row-kbd">{modKey}+\</kbd>
                    </button>

                    <button
                        type="button"
                        class="dropdown-row"
                        class:active={zenMode === "focus"}
                        onclick={() => {
                            onSelectZenMode(
                                zenMode === "focus" ? "none" : "focus",
                            );
                            isZenDropdownOpen = false;
                        }}
                        role="menuitem"
                    >
                        <span class="row-icon">🎯</span>
                        <div class="row-content">
                            <div class="row-title-line">
                                <span class="row-title">Focus Zen Mode</span>
                                {#if zenMode === "focus"}
                                    <span class="badge-active">Active</span>
                                {/if}
                            </div>
                            <span class="row-desc"
                                >Highlight active paragraph, 50% dim others</span
                            >
                        </div>
                        <kbd class="row-kbd">{modKey}+Shift+\</kbd>
                    </button>

                    <button
                        type="button"
                        class="dropdown-row"
                        class:active={zenMode === "czm"}
                        onclick={() => {
                            onSelectZenMode(zenMode === "czm" ? "none" : "czm");
                            isZenDropdownOpen = false;
                        }}
                        role="menuitem"
                    >
                        <span class="row-icon">⚡</span>
                        <div class="row-content">
                            <div class="row-title-line">
                                <span class="row-title"
                                    >Concentrate Zen (CZM)</span
                                >
                                {#if zenMode === "czm"}
                                    <span class="badge-active">Active</span>
                                {/if}
                            </div>
                            <span class="row-desc"
                                >Pure textarea only, hides chrome & header</span
                            >
                        </div>
                        <kbd class="row-kbd">{modKey}+Alt+\</kbd>
                    </button>

                    {#if zenMode !== "none"}
                        <div class="dropdown-divider"></div>
                        <button
                            type="button"
                            class="dropdown-row exit-row"
                            onclick={() => {
                                onSelectZenMode("none");
                                isZenDropdownOpen = false;
                            }}
                            role="menuitem"
                        >
                            <span class="row-icon">✕</span>
                            <div class="row-content">
                                <span class="row-title">Exit Zen Mode</span>
                            </div>
                            <kbd class="row-kbd">Esc</kbd>
                        </button>
                    {/if}
                </div>
            {/if}
        </div>

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
            ℹ️
        </button>

        <!-- Shortcuts Cheat Sheet Button -->
        <button
            type="button"
            class="icon-btn help-btn"
            onclick={onOpenShortcuts}
            title="Keyboard Shortcuts (?)"
            aria-label="Open keyboard shortcuts"
        >
            ⌨️
        </button>
    </div>
</header>

<style>
    .app-header {
        height: var(--header-height);
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px;
        user-select: none;
        flex-shrink: 0;
    }

    .header-left,
    .header-center,
    .header-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 700;
        color: var(--accent-primary);
        letter-spacing: -0.01em;
    }

    .brand-icon {
        font-size: 16px;
    }

    .brand-name {
        font-size: 14px;
    }

    .project-title {
        font-weight: 500;
        color: var(--text-secondary);
        max-width: 130px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .folder-badge-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        padding: 3px 8px;
        border-radius: 6px;
        font-size: 11px;
        cursor: pointer;
        max-width: 150px;
        transition: all 0.15s ease;
    }

    .folder-badge-btn:hover {
        background: var(--bg-hover);
        border-color: var(--accent-primary);
        color: var(--accent-hover);
    }

    .folder-badge-btn.no-folder {
        border-style: dashed;
        border-color: var(--warning-color);
        color: var(--warning-color);
        background: rgba(210, 153, 34, 0.1);
    }

    .folder-icon {
        font-size: 12px;
    }

    .folder-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .divider-vertical {
        width: 1px;
        height: 20px;
        background-color: var(--border-subtle);
    }

    .search-trigger-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-muted);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .search-trigger-btn:hover {
        background: var(--bg-hover);
        border-color: var(--border-bold);
        color: var(--text-secondary);
    }

    .search-icon {
        font-size: 11px;
    }

    .header-center {
        flex: 1;
        justify-content: center;
        overflow: hidden;
    }

    .doc-badge {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .doc-badge-manuscript {
        background: rgba(88, 166, 255, 0.15);
        color: #58a6ff;
        border: 1px solid rgba(88, 166, 255, 0.3);
    }

    .doc-badge-character {
        background: rgba(210, 153, 34, 0.15);
        color: #d29922;
        border: 1px solid rgba(210, 153, 34, 0.3);
    }

    .doc-badge-world {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
        border: 1px solid rgba(63, 185, 80, 0.3);
    }

    .doc-badge-plot {
        background: rgba(240, 136, 62, 0.15);
        color: #f0883e;
        border: 1px solid rgba(240, 136, 62, 0.3);
    }

    .doc-badge-note {
        background: rgba(188, 140, 255, 0.15);
        color: #bc8cff;
        border: 1px solid rgba(188, 140, 255, 0.3);
    }

    .tech-tag-group {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .tech-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-family: var(--font-mono, monospace);
        font-size: 10px;
        color: var(--text-muted);
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 4px;
        padding: 2px 5px;
        user-select: none;
    }

    .tech-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
    }

    .tech-dot.git-dot {
        background: #f0883e;
    }

    .tech-dot.auto-dot {
        background: #58a6ff;
    }

    .todo-pill {
        font-size: 8px;
        font-weight: 700;
        color: #e3b341;
        background: rgba(227, 179, 65, 0.12);
        border-radius: 2px;
        padding: 1px 3px;
    }

    .active-title {
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 260px;
    }

    .no-doc-label {
        color: var(--text-muted);
        font-style: italic;
        font-size: 13px;
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

    .zen-btn.active {
        background: rgba(63, 185, 80, 0.15);
        border-color: var(--success-color);
    }

    .zen-dropdown-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .dropdown-caret {
        font-size: 9px;
        margin-left: 2px;
        opacity: 0.7;
    }

    .zen-dropdown-panel {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 320px;
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
        padding: 6px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .dropdown-section-title {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        padding: 6px 10px 4px 10px;
    }

    .dropdown-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
        width: 100%;
        box-sizing: border-box;
    }

    .dropdown-row:hover {
        background-color: var(--bg-hover);
    }

    .dropdown-row.active {
        background-color: var(--bg-active);
        border-color: var(--accent-primary);
    }

    .row-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .row-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
    }

    .row-title-line {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .row-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .badge-active {
        font-size: 10px;
        font-weight: 600;
        color: var(--accent-primary);
        background-color: var(--accent-subtle);
        border: 1px solid rgba(230, 157, 69, 0.3);
        padding: 1px 5px;
        border-radius: 10px;
    }

    .row-desc {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.3;
    }

    .row-kbd {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        font-family: var(--font-editor);
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .dropdown-divider {
        height: 1px;
        background-color: var(--border-subtle);
        margin: 4px 0;
    }

    .exit-row {
        color: var(--warning-color, #e69d45);
    }
</style>
