<script lang="ts">
    import type { DashboardStats } from "@services/recentProjects";
    import type { RecentProject } from "@shared/types";
    import DashboardHeader from "./DashboardHeader.svelte";
    import KpiGrid from "./KpiGrid.svelte";
    import ChartsGrid from "./ChartsGrid.svelte";
    import "./dashboard.css";

    interface Props {
        stats: DashboardStats;
        recentProjects: RecentProject[];
    }

    let { stats, recentProjects }: Props = $props();
</script>

<div class="dashboard-container">
    <DashboardHeader />
    <KpiGrid {stats} />
    <ChartsGrid {stats} {recentProjects} />
</div>
