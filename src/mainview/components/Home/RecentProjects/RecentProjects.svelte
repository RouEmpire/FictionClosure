<script lang="ts">
    import type { RecentProject } from "@shared/types";
    import ProjectsFilter from "./ProjectsFilter.svelte";
    import EmptyProjectsCard from "./EmptyProjectsCard.svelte";
    import ProjectCard from "./ProjectCard.svelte";
    import "./recentProjects.css";

    interface Props {
        recentProjects: RecentProject[];
        onOpenProject: (folderPath: string, projectName?: string) => void;
        onDeleteRecentProject: (id: string, name: string) => void;
        onNewProject: () => void;
        onImportProject: () => void;
    }

    let {
        recentProjects,
        onOpenProject,
        onDeleteRecentProject,
        onNewProject,
        onImportProject,
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
</script>

<section class="recent-projects-section" aria-labelledby="recent-heading">
    <ProjectsFilter
        count={recentProjects.length}
        bind:searchQuery
    />

    {#if filteredProjects.length === 0}
        <EmptyProjectsCard
            {searchQuery}
            {onNewProject}
            {onImportProject}
        />
    {:else}
        <div class="projects-list" role="list">
            {#each filteredProjects as project (project.id)}
                <ProjectCard
                    {project}
                    {onOpenProject}
                    {onDeleteRecentProject}
                />
            {/each}
        </div>
    {/if}
</section>
