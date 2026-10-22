<script lang="ts">
    import type { RecentProject } from "@shared/types";
    import {
        canRenderBrowserPreview,
        getCoverFormatLabel,
    } from "@shared/domain/coverSupport";
    import "./projectCard.css";

    interface Props {
        project: RecentProject;
        onOpenProject: (folderPath: string, projectName?: string) => void;
        onDeleteRecentProject: (id: string, name: string) => void;
    }

    let { project, onOpenProject, onDeleteRecentProject }: Props = $props();

    const target = $derived(project.targetWordCount || 50000);
    const progressPct = $derived(
        target > 0
            ? Math.min(100, Math.round((project.wordCount / target) * 100))
            : 0,
    );

    const isCoverRenderable = $derived(
        project.coverImage ? canRenderBrowserPreview(project.coverImage) : false,
    );
    const coverBadgeLabel = $derived(
        project.coverImage ? getCoverFormatLabel(project.coverImage) : "",
    );

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

<div class="project-card" role="listitem">
    <button
        type="button"
        class="project-card-clickable"
        onclick={() => onOpenProject(project.folderPath, project.name)}
        title="Open {project.name}"
    >
        {#if project.coverImage}
            <div class="card-cover-wrapper">
                {#if isCoverRenderable}
                    <img
                        src={project.coverImage}
                        alt="Cover for {project.name}"
                        class="card-cover-img"
                    />
                {:else}
                    <div class="card-cover-fallback">
                        <i class="fa-solid fa-file-image fallback-icon"></i>
                        <span class="fallback-format">{coverBadgeLabel}</span>
                    </div>
                {/if}
            </div>
        {/if}

        <div class="card-info-col">
            <div class="card-header-row">
                <div class="project-title-group">
                    <span class="project-name">{project.name}</span>
                    {#if project.genre}
                        <span class="genre-tag">{project.genre}</span>
                    {/if}
                </div>
                <span class="last-opened">
                    Opened {formatLastOpened(project.lastOpened)}
                </span>
            </div>

            <span class="project-path" title={project.folderPath}>
                <i class="fa-solid fa-folder"></i>
                {project.folderPath}
            </span>

            <!-- Word Count Goal Progress -->
            <div class="word-progress-block">
                <div class="word-progress-labels">
                    <span class="progress-pct">{progressPct}% of goal</span>
                    <span class="word-nums">
                        {project.wordCount.toLocaleString()} / {target.toLocaleString()} words
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
                <span class="badge badge-ch">
                    {project.manuscriptCount || 0} chapters
                </span>
                <span class="badge badge-char">
                    {project.characterCount || 0} characters
                </span>
                <span class="badge badge-world">
                    {project.worldCount || 0} world items
                </span>
                {#if project.notesCount}
                    <span class="badge badge-notes">
                        {project.notesCount} notes
                    </span>
                {/if}
            </div>
        </div>
    </button>

    <!-- Card Action Buttons -->
    <div class="card-side-actions">
        <button
            type="button"
            class="card-open-btn"
            onclick={() => onOpenProject(project.folderPath, project.name)}
            title="Open project in workspace"
        >
            Open
        </button>
        <button
            type="button"
            class="card-delete-btn"
            onclick={() => onDeleteRecentProject(project.id, project.name)}
            title="Remove from recent projects list"
            aria-label="Remove from recent list"
        >
            <i class="fa-solid fa-trash-can"></i>
        </button>
    </div>
</div>
