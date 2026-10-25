<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import * as echarts from "echarts";
    import type { DashboardStats } from "@services/recentProjects";
    import type { RecentProject } from "@shared/types";
    import {
        buildProgressChartOption,
        buildPieChartOption,
    } from "./dashboardCharts";

    interface Props {
        stats: DashboardStats;
        recentProjects: RecentProject[];
    }

    let { stats, recentProjects }: Props = $props();

    let progressChartEl: HTMLDivElement | null = $state(null);
    let pieChartEl: HTMLDivElement | null = $state(null);

    let progressChart: echarts.ECharts | null = null;
    let pieChart: echarts.ECharts | null = null;
    let resizeObserver: ResizeObserver | null = null;

    function initCharts() {
        if (progressChartEl && !progressChart) {
            progressChart = echarts.init(progressChartEl, null, {
                renderer: "canvas",
            });
        }
        if (pieChartEl && !pieChart) {
            pieChart = echarts.init(pieChartEl, null, { renderer: "canvas" });
        }
        updateCharts();
    }

    function updateCharts() {
        if (progressChart) {
            progressChart.setOption(buildProgressChartOption(recentProjects));
        }
        if (pieChart) {
            pieChart.setOption(buildPieChartOption(stats));
        }
    }

    onMount(() => {
        initCharts();

        resizeObserver = new ResizeObserver(() => {
            progressChart?.resize();
            pieChart?.resize();
        });

        if (progressChartEl) resizeObserver.observe(progressChartEl);
        if (pieChartEl) resizeObserver.observe(pieChartEl);

        const handleWindowResize = () => {
            progressChart?.resize();
            pieChart?.resize();
        };
        window.addEventListener("resize", handleWindowResize);

        return () => {
            window.removeEventListener("resize", handleWindowResize);
        };
    });

    onDestroy(() => {
        resizeObserver?.disconnect();
        progressChart?.dispose();
        pieChart?.dispose();
        progressChart = null;
        pieChart = null;
    });

    $effect(() => {
        void recentProjects;
        void stats;
        updateCharts();
    });
</script>

<div class="charts-grid">
    <div class="chart-card">
        <div class="chart-header">
            <h3 class="chart-title">Word Goals by Project</h3>
        </div>
        <div class="chart-canvas-wrap" bind:this={progressChartEl}></div>
    </div>

    <div class="chart-card">
        <div class="chart-header">
            <h3 class="chart-title">Content Composition</h3>
        </div>
        <div class="chart-canvas-wrap" bind:this={pieChartEl}></div>
    </div>
</div>
