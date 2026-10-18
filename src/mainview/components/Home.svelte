<script lang="ts">
    import type { RecentProject } from "../../shared/types";
    import { calculateDashboardStats } from "../services/recentProjects";
    import HomeTopbar from "./HomeTopbar.svelte";
    import Dashboard from "./Dashboard.svelte";

    interface Props {
        recentProjects: RecentProject[];
        onOpenProject: (folderPath: string) => void;
        onDeleteRecentProject: (id: string, name: string) => void;
        onImportProject: () => void;
        onNewProject: () => void;
        onOpenSettings: () => void;
        onOpenShortcuts: () => void;
        onOpenAbout: () => void;
        onShowToast: (msg: string) => void;
    }

    let {
        recentProjects,
        onOpenProject,
        onDeleteRecentProject,
        onImportProject,
        onNewProject,
        onOpenSettings,
        onOpenShortcuts,
        onOpenAbout,
        onShowToast,
    }: Props = $props();

    let searchQuery = $state("");

    const filteredProjects = $derived.by(() => {
        if (!searchQuery.trim()) return recentProjects;
        const q = searchQuery.toLowerCase().trim();
        return recentProjects.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.folderPath.toLowerCase().includes(q) ||
                (p.genre && p.genre.toLowerCase().includes(q)),
        );
    });

    const stats = $derived(calculateDashboardStats(recentProjects));

    function formatLastOpened(isoDate: string): string {
        try {
            const d = new Date(isoDate);
            return d.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return isoDate;
        }
    }
</script>

<div class="home-layout">
    <!-- Top Bar -->
    <HomeTopbar
        {onNewProject}
        {onImportProject}
        {onOpenSettings}
        {onOpenShortcuts}
        {onOpenAbout}
        {onShowToast}
    />

    <!-- Scrollable Home Content -->
    <div class="home-scroll-surface">
        <div class="home-container">
            <!-- Welcome Hero Section -->
            <section class="welcome-hero" aria-labelledby="welcome-heading">
                <div class="hero-left">
                    <h1 id="welcome-heading" class="hero-title">
                        Welcome to <span class="brand-gradient"
                            >FictionClosure</span
                        >
                    </h1>
                    <p class="hero-subtitle">
                        A Markdown-first fiction writing workspace built for
                        speed, safety, creative flow, git integration, modern
                        UI, keyboard-focus and customization.
                    </p>
                </div>
                <div class="hero-actions">
                    <button
                        type="button"
                        class="btn primary-action"
                        onclick={onNewProject}
                    >
                        <span class="btn-icon">＋</span>
                        <span>New Project</span>
                    </button>
                    <button
                        type="button"
                        class="btn secondary-action"
                        onclick={onImportProject}
                    >
                        <span class="btn-icon">📁</span>
                        <span>Import / Open Folder</span>
                    </button>
                </div>
            </section>

            <!-- Main 2-Column Split: Recent Projects (left) & Analytics Dashboard (right) -->
            <div class="home-sections-grid">
                <!-- Left Column: Recent Projects -->
                <section
                    class="recent-projects-section"
                    aria-labelledby="recent-heading"
                >
                    <div class="section-title-bar">
                        <div class="title-with-count">
                            <h2 id="recent-heading" class="section-heading">
                                Recent Projects
                            </h2>
                            <span class="count-badge"
                                >{recentProjects.length}</span
                            >
                        </div>

                        <!-- Filter Search Box -->
                        <div class="filter-box">
                            <span class="filter-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Filter projects..."
                                bind:value={searchQuery}
                                aria-label="Filter recent projects"
                            />
                            {#if searchQuery}
                                <button
                                    type="button"
                                    class="clear-filter-btn"
                                    onclick={() => (searchQuery = "")}
                                    title="Clear filter"
                                >
                                    ✕
                                </button>
                            {/if}
                        </div>
                    </div>

                    {#if filteredProjects.length === 0}
                        <div class="empty-projects-card">
                            <span class="empty-icon">📂</span>
                            <h3>No Projects Found</h3>
                            <p>
                                {searchQuery
                                    ? `No projects match "${searchQuery}".`
                                    : "Create a new project or import an existing folder to begin writing."}
                            </p>
                            <div class="empty-actions">
                                <button
                                    type="button"
                                    class="btn primary-action"
                                    onclick={onNewProject}
                                >
                                    Create Project
                                </button>
                                <button
                                    type="button"
                                    class="btn secondary-action"
                                    onclick={onImportProject}
                                >
                                    Import Project Folder
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="projects-list" role="list">
                            {#each filteredProjects as project (project.id)}
                                {@const target =
                                    project.targetWordCount || 50000}
                                {@const progressPct =
                                    target > 0
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  (project.wordCount / target) *
                                                      100,
                                              ),
                                          )
                                        : 0}
                                <div class="project-card" role="listitem">
                                    <button
                                        type="button"
                                        class="project-card-clickable"
                                        onclick={() =>
                                            onOpenProject(project.folderPath)}
                                        title="Open {project.name}"
                                    >
                                        <div class="card-header-row">
                                            <div class="project-title-group">
                                                <span class="project-name"
                                                    >{project.name}</span
                                                >
                                                {#if project.genre}
                                                    <span class="genre-tag"
                                                        >{project.genre}</span
                                                    >
                                                {/if}
                                            </div>
                                            <span class="last-opened"
                                                >Opened {formatLastOpened(
                                                    project.lastOpened,
                                                )}</span
                                            >
                                        </div>

                                        <span
                                            class="project-path"
                                            title={project.folderPath}
                                        >
                                            📁 {project.folderPath}
                                        </span>

                                        <!-- Word Count Goal Progress -->
                                        <div class="word-progress-block">
                                            <div class="word-progress-labels">
                                                <span class="progress-pct"
                                                    >{progressPct}% of goal</span
                                                >
                                                <span class="word-nums">
                                                    {project.wordCount.toLocaleString()}
                                                    / {target.toLocaleString()} words
                                                </span>
                                            </div>
                                            <div class="progress-bar-track">
                                                <div
                                                    class="progress-bar-fill"
                                                    style="width: {progressPct}%;"
                                                ></div>
                                            </div>
                                        </div>

                                        <!-- Document Breakdown Badges -->
                                        <div class="breakdown-badges">
                                            <span class="badge badge-ch"
                                                >{project.manuscriptCount || 0} chapters</span
                                            >
                                            <span class="badge badge-char"
                                                >{project.characterCount || 0} characters</span
                                            >
                                            <span class="badge badge-world"
                                                >{project.worldCount || 0} world items</span
                                            >
                                            {#if project.notesCount}
                                                <span class="badge badge-notes"
                                                    >{project.notesCount} notes</span
                                                >
                                            {/if}
                                        </div>
                                    </button>

                                    <!-- Card Action Buttons -->
                                    <div class="card-side-actions">
                                        <button
                                            type="button"
                                            class="card-open-btn"
                                            onclick={() =>
                                                onOpenProject(
                                                    project.folderPath,
                                                )}
                                            title="Open project in workspace"
                                        >
                                            Open
                                        </button>
                                        <button
                                            type="button"
                                            class="card-delete-btn"
                                            onclick={() =>
                                                onDeleteRecentProject(
                                                    project.id,
                                                    project.name,
                                                )}
                                            title="Remove from recent projects list"
                                            aria-label="Remove from recent list"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </section>

                <!-- Right Column: Analytics Dashboard with Apache ECharts -->
                <section
                    class="dashboard-section"
                    aria-label="Writing Analytics Dashboard"
                >
                    <Dashboard {stats} {recentProjects} />
                </section>
            </div>
        </div>
    </div>
</div>

<style>
    .home-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        background-color: var(--bg-primary, #0d1117);
        overflow: hidden;
        position: relative;
    }

    .home-scroll-surface {
        flex: 1;
        overflow-y: auto;
        display: flex;
        justify-content: center;
        padding: 24px 20px 40px 20px;
    }

    .home-container {
        width: 100%;
        max-width: 1280px;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    /* Hero Section */
    .welcome-hero {
        background: linear-gradient(
            135deg,
            rgba(230, 157, 69, 0.08) 0%,
            rgba(88, 166, 255, 0.04) 100%
        );
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 12px;
        padding: 24px 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
    }

    @media (max-width: 800px) {
        .welcome-hero {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    .hero-left {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .hero-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--text-primary, #e6edf3);
        margin: 0;
        letter-spacing: -0.02em;
    }

    .brand-gradient {
        background: linear-gradient(120deg, #e69d45 0%, #f0b060 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
        font-size: 13px;
        color: var(--text-secondary, #c9d1d9);
        margin: 0;
        max-width: 580px;
        line-height: 1.5;
    }

    .hero-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        border: 1px solid transparent;
    }

    .primary-action {
        background: var(--accent-primary, #e69d45);
        color: #12151a;
    }

    .primary-action:hover {
        background: var(--accent-hover, #f0b060);
        box-shadow: 0 4px 12px rgba(230, 157, 69, 0.3);
    }

    .secondary-action {
        background: var(--bg-tertiary, #21262d);
        border-color: var(--border-subtle, #30363d);
        color: var(--text-primary, #e6edf3);
    }

    .secondary-action:hover {
        background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        border-color: var(--accent-primary, #e69d45);
    }

    .btn-icon {
        font-size: 14px;
    }

    /* Main 2-Column Split */
    .home-sections-grid {
        display: grid;
        grid-template-columns: 5fr 4fr;
        gap: 20px;
        align-items: start;
    }

    @media (max-width: 1080px) {
        .home-sections-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Recent Projects Section */
    .recent-projects-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .section-title-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .title-with-count {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .section-heading {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary, #e6edf3);
        margin: 0;
    }

    .count-badge {
        font-size: 11px;
        background: var(--bg-tertiary, #21262d);
        color: var(--text-muted, #8b949e);
        padding: 1px 7px;
        border-radius: 12px;
        font-weight: 600;
    }

    .filter-box {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 6px;
        padding: 4px 8px;
        width: 180px;
    }

    .filter-box:focus-within {
        border-color: var(--accent-primary, #e69d45);
    }

    .filter-icon {
        font-size: 11px;
        color: var(--text-muted, #8b949e);
    }

    .filter-box input {
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-primary, #e6edf3);
        font-size: 11px;
        width: 100%;
    }

    .clear-filter-btn {
        background: transparent;
        border: none;
        color: var(--text-muted, #8b949e);
        font-size: 10px;
        cursor: pointer;
        padding: 0 2px;
    }

    .clear-filter-btn:hover {
        color: var(--text-primary, #e6edf3);
    }

    .empty-projects-card {
        background: var(--bg-secondary, #161b22);
        border: 1px dashed var(--border-subtle, #30363d);
        border-radius: 8px;
        padding: 36px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
    }

    .empty-icon {
        font-size: 32px;
        margin-bottom: 4px;
    }

    .empty-projects-card h3 {
        font-size: 15px;
        color: var(--text-primary, #e6edf3);
        margin: 0;
    }

    .empty-projects-card p {
        font-size: 12px;
        color: var(--text-muted, #8b949e);
        margin: 0 0 10px 0;
        max-width: 320px;
    }

    .empty-actions {
        display: flex;
        gap: 10px;
    }

    /* Projects List */
    .projects-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .project-card {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-subtle, #30363d);
        border-radius: 8px;
        display: flex;
        align-items: stretch;
        overflow: hidden;
        transition: all 0.15s ease;
    }

    .project-card:hover {
        border-color: var(--accent-primary, #e69d45);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
    }

    .project-card-clickable {
        flex: 1;
        background: transparent;
        border: none;
        padding: 14px 16px;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow: hidden;
    }

    .card-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .project-title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
    }

    .project-name {
        font-size: 14px;
        font-weight: 700;
        color: var(--text-primary, #e6edf3);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .genre-tag {
        font-size: 10px;
        color: var(--accent-primary, #e69d45);
        background: var(--accent-subtle, rgba(230, 157, 69, 0.1));
        border: 1px solid rgba(230, 157, 69, 0.3);
        padding: 1px 6px;
        border-radius: 10px;
        flex-shrink: 0;
    }

    .last-opened {
        font-size: 10px;
        color: var(--text-muted, #8b949e);
        flex-shrink: 0;
    }

    .project-path {
        font-size: 11px;
        color: var(--text-muted, #8b949e);
        font-family: var(--font-editor, monospace);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .word-progress-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 2px;
    }

    .word-progress-labels {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
    }

    .progress-pct {
        color: var(--accent-primary, #e69d45);
        font-weight: 600;
    }

    .word-nums {
        color: var(--text-muted, #8b949e);
        font-family: var(--font-editor, monospace);
    }

    .progress-bar-track {
        width: 100%;
        height: 4px;
        background: var(--bg-tertiary, #21262d);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #e69d45 0%, #f0b060 100%);
        border-radius: 2px;
    }

    .breakdown-badges {
        display: flex;
        gap: 6px;
        margin-top: 2px;
        flex-wrap: wrap;
    }

    .badge {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        background: var(--bg-tertiary, #21262d);
        color: var(--text-muted, #8b949e);
    }

    .badge-ch {
        color: #58a6ff;
    }

    .badge-char {
        color: #e69d45;
    }

    .badge-world {
        color: #3fb950;
    }

    .badge-notes {
        color: #bc8cff;
    }

    .card-side-actions {
        display: flex;
        flex-direction: column;
        border-left: 1px solid var(--border-subtle, #30363d);
        background: var(--bg-tertiary, #21262d);
        width: 60px;
        flex-shrink: 0;
    }

    .card-open-btn {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--accent-primary, #e69d45);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s ease;
    }

    .card-open-btn:hover {
        background: var(--bg-hover, rgba(255, 255, 255, 0.08));
        color: var(--accent-hover, #f0b060);
    }

    .card-delete-btn {
        height: 32px;
        background: transparent;
        border: none;
        border-top: 1px solid var(--border-subtle, #30363d);
        cursor: pointer;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: all 0.15s ease;
    }

    .card-delete-btn:hover {
        opacity: 1;
        background: rgba(248, 81, 73, 0.2);
    }

    /* Dashboard Column */
    .dashboard-section {
        display: flex;
        flex-direction: column;
    }
</style>
