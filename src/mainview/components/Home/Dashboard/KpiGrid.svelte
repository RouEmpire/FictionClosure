<script lang="ts">
    import type { DashboardStats } from "@services/recentProjects";

    interface Props {
        stats: DashboardStats;
    }

    let { stats }: Props = $props();
</script>

<div class="kpi-grid">
    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-projects">
            <i class="fa-solid fa-folder"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">Total Projects</span>
            <span class="kpi-value">{stats.totalProjects}</span>
        </div>
    </div>

    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-words">
            <i class="fa-solid fa-pen-nib"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">Total Words Written</span>
            <span class="kpi-value">
                {stats.totalWords.toLocaleString()}
            </span>
        </div>
    </div>

    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-characters">
            <i class="fa-solid fa-user"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">Characters Created</span>
            <span class="kpi-value">{stats.totalCharacters}</span>
        </div>
    </div>

    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-world">
            <i class="fa-solid fa-map"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">World Lore Entries</span>
            <span class="kpi-value">{stats.totalWorld}</span>
        </div>
    </div>

    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-manuscripts">
            <i class="fa-solid fa-book-open"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">Manuscript Chapters</span>
            <span class="kpi-value">{stats.totalManuscripts}</span>
        </div>
    </div>

    <div class="kpi-card">
        <div class="kpi-icon-wrap icon-docs">
            <i class="fa-solid fa-file-lines"></i>
        </div>
        <div class="kpi-content">
            <span class="kpi-label">Total Documents</span>
            <span class="kpi-value">{stats.totalDocuments}</span>
        </div>
    </div>
</div>
