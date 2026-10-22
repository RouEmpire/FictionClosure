<script lang="ts">
    import type { RecentProject } from "@shared/types";
    import { calculateDashboardStats } from "@services/recentProjects";
    import Topbar from "./Topbar/Topbar.svelte";
    import Hero from "./Hero/Hero.svelte";
    import RecentProjects from "./RecentProjects/RecentProjects.svelte";
    import Dashboard from "./Dashboard/Dashboard.svelte";
    import "./home.css";

    interface Props {
        recentProjects: RecentProject[];
        onOpenProject: (folderPath: string, projectName?: string) => void;
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

    const stats = $derived(calculateDashboardStats(recentProjects));
</script>

<div class="home-layout">
    <!-- Top Bar -->
    <Topbar
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
            <Hero
                {onNewProject}
                {onImportProject}
            />

            <!-- Main 2-Column Split: Recent Projects (left) & Analytics Dashboard (right) -->
            <div class="home-sections-grid">
                <!-- Left Column: Recent Projects -->
                <RecentProjects
                    {recentProjects}
                    {onOpenProject}
                    {onDeleteRecentProject}
                    {onNewProject}
                    {onImportProject}
                />

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
