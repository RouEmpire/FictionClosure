<script lang="ts">
    interface Props {
        projectName: string;
        isSidebarOpen: boolean;
        onCloseProject?: () => void;
        onToggleSidebar: () => void;
        onOpenCommandPalette: () => void;
    }

    let {
        projectName,
        isSidebarOpen,
        onCloseProject,
        onToggleSidebar,
        onOpenCommandPalette,
    }: Props = $props();

    const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modKey = isMac ? "⌘" : "Ctrl";
</script>

<div class="header-left">
    {#if onCloseProject}
        <button
            type="button"
            class="icon-btn home-btn"
            onclick={onCloseProject}
            title="Close project and return to Home / Projects Overview"
            aria-label="Return to Home"
        >
            <i class="fa-solid fa-house"></i> Home
        </button>
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
        <i class="fa-solid fa-sitemap"></i>
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
        <span class="search-icon">
            <i class="fa-solid fa-magnifying-glass"></i>
        </span>
        <span class="search-text">Quick Search...</span>
    </button>
</div>

<style>
    .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
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

    .home-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;
        font-size: 12px;
    }

    .divider-vertical {
        width: 1px;
        height: 20px;
        background-color: var(--border-subtle);
    }

    .project-title {
        font-weight: 500;
        color: var(--text-secondary);
        max-width: 130px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
</style>
