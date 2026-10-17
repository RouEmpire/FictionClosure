<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import * as echarts from "echarts";
	import type { DashboardStats } from "../services/recentProjects";
	import type { RecentProject } from "../../shared/types";

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
			progressChart = echarts.init(progressChartEl, null, { renderer: "canvas" });
		}
		if (pieChartEl && !pieChart) {
			pieChart = echarts.init(pieChartEl, null, { renderer: "canvas" });
		}
		updateCharts();
	}

	function updateCharts() {
		// 1. Project Word Count vs Target Progress Chart
		if (progressChart) {
			const projectNames = recentProjects.map((p) => p.name || "Untitled");
			const actualWords = recentProjects.map((p) => p.wordCount || 0);
			const targetWords = recentProjects.map((p) => p.targetWordCount || 50000);

			const progressOption: echarts.EChartsOption = {
				backgroundColor: "transparent",
				tooltip: {
					trigger: "axis",
					backgroundColor: "#161b22",
					borderColor: "#30363d",
					textStyle: { color: "#e6edf3", fontSize: 12 },
					axisPointer: { type: "shadow" },
				},
				legend: {
					data: ["Words Written", "Target Goal"],
					textStyle: { color: "#8b949e", fontSize: 11 },
					top: 0,
					right: 10,
				},
				grid: {
					top: 36,
					bottom: 24,
					left: 10,
					right: 15,
					containLabel: true,
				},
				xAxis: {
					type: "category",
					data: projectNames.length > 0 ? projectNames : ["No Projects"],
					axisLine: { lineStyle: { color: "#30363d" } },
					axisLabel: {
						color: "#8b949e",
						fontSize: 11,
						interval: 0,
						formatter: (val: string) => (val.length > 12 ? val.slice(0, 10) + "…" : val),
					},
				},
				yAxis: {
					type: "value",
					axisLine: { lineStyle: { color: "#30363d" } },
					splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.06)" } },
					axisLabel: {
						color: "#8b949e",
						fontSize: 10,
						formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`),
					},
				},
				series: [
					{
						name: "Words Written",
						type: "bar",
						data: actualWords.length > 0 ? actualWords : [0],
						barMaxWidth: 30,
						itemStyle: {
							color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
								{ offset: 0, color: "#e69d45" },
								{ offset: 1, color: "#ba7020" },
							]),
							borderRadius: [4, 4, 0, 0],
						},
					},
					{
						name: "Target Goal",
						type: "bar",
						data: targetWords.length > 0 ? targetWords : [50000],
						barMaxWidth: 30,
						itemStyle: {
							color: "rgba(255, 255, 255, 0.12)",
							borderRadius: [4, 4, 0, 0],
						},
					},
				],
			};

			progressChart.setOption(progressOption);
		}

		// 2. Story World Elements Breakdown Donut Chart
		if (pieChart) {
			const manuscriptCount = stats.totalManuscripts || 0;
			const characterCount = stats.totalCharacters || 0;
			const worldCount = stats.totalWorld || 0;
			const notesCount = Math.max(
				0,
				(stats.totalDocuments || 0) - manuscriptCount - characterCount - worldCount,
			);

			const pieOption: echarts.EChartsOption = {
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item",
					backgroundColor: "#161b22",
					borderColor: "#30363d",
					textStyle: { color: "#e6edf3", fontSize: 12 },
					formatter: "{b}: {c} ({d}%)",
				},
				legend: {
					orient: "vertical",
					right: 5,
					top: "middle",
					textStyle: { color: "#8b949e", fontSize: 11 },
					itemWidth: 10,
					itemHeight: 10,
				},
				series: [
					{
						name: "Content Breakdown",
						type: "pie",
						radius: ["45%", "72%"],
						center: ["35%", "50%"],
						avoidLabelOverlap: false,
						label: { show: false },
						emphasis: {
							label: {
								show: true,
								fontSize: 12,
								fontWeight: "bold",
								color: "#e6edf3",
							},
						},
						data: [
							{ value: manuscriptCount, name: "Chapters", itemStyle: { color: "#58a6ff" } },
							{ value: characterCount, name: "Characters", itemStyle: { color: "#e69d45" } },
							{ value: worldCount, name: "World & Lore", itemStyle: { color: "#3fb950" } },
							{ value: notesCount, name: "Notes", itemStyle: { color: "#bc8cff" } },
						],
					},
				],
			};

			pieChart.setOption(pieOption);
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
		const _p = recentProjects;
		const _s = stats;
		updateCharts();
	});
</script>

<div class="dashboard-container">
	<div class="dashboard-header">
		<h2 class="dashboard-title">Writing Analytics Dashboard</h2>
		<span class="dashboard-subtitle">Aggregate statistics across your fiction projects</span>
	</div>

	<!-- Top Metric KPI Cards -->
	<div class="kpi-grid">
		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-projects">📁</div>
			<div class="kpi-content">
				<span class="kpi-label">Total Projects</span>
				<span class="kpi-value">{stats.totalProjects}</span>
			</div>
		</div>

		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-words">✍️</div>
			<div class="kpi-content">
				<span class="kpi-label">Total Words Written</span>
				<span class="kpi-value">{stats.totalWords.toLocaleString()}</span>
			</div>
		</div>

		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-characters">👤</div>
			<div class="kpi-content">
				<span class="kpi-label">Characters Created</span>
				<span class="kpi-value">{stats.totalCharacters}</span>
			</div>
		</div>

		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-world">🗺️</div>
			<div class="kpi-content">
				<span class="kpi-label">World Lore Entries</span>
				<span class="kpi-value">{stats.totalWorld}</span>
			</div>
		</div>

		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-manuscripts">📖</div>
			<div class="kpi-content">
				<span class="kpi-label">Manuscript Chapters</span>
				<span class="kpi-value">{stats.totalManuscripts}</span>
			</div>
		</div>

		<div class="kpi-card">
			<div class="kpi-icon-wrap icon-docs">📄</div>
			<div class="kpi-content">
				<span class="kpi-label">Total Documents</span>
				<span class="kpi-value">{stats.totalDocuments}</span>
			</div>
		</div>
	</div>

	<!-- Apache ECharts Visualization Section -->
	<div class="charts-grid">
		<div class="chart-card">
			<div class="chart-header">
				<h3 class="chart-title">Word Goals by Project</h3>
				<span class="chart-badge">Apache ECharts</span>
			</div>
			<div class="chart-canvas-wrap" bind:this={progressChartEl}></div>
		</div>

		<div class="chart-card">
			<div class="chart-header">
				<h3 class="chart-title">Content Composition</h3>
				<span class="chart-badge">Apache ECharts</span>
			</div>
			<div class="chart-canvas-wrap" bind:this={pieChartEl}></div>
		</div>
	</div>
</div>

<style>
	.dashboard-container {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.dashboard-header {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.dashboard-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		margin: 0;
	}

	.dashboard-subtitle {
		font-size: 11px;
		color: var(--text-muted, #8b949e);
	}

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: 10px;
	}

	.kpi-card {
		background: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 8px;
		padding: 12px 14px;
		display: flex;
		align-items: center;
		gap: 12px;
		transition: all 0.15s ease;
	}

	.kpi-card:hover {
		border-color: var(--accent-primary, #e69d45);
		background: var(--bg-hover, rgba(255, 255, 255, 0.05));
	}

	.kpi-icon-wrap {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		flex-shrink: 0;
	}

	.icon-projects {
		background: rgba(88, 166, 255, 0.12);
	}

	.icon-words {
		background: rgba(230, 157, 69, 0.15);
	}

	.icon-characters {
		background: rgba(188, 140, 255, 0.15);
	}

	.icon-world {
		background: rgba(63, 185, 80, 0.15);
	}

	.icon-manuscripts {
		background: rgba(56, 189, 248, 0.15);
	}

	.icon-docs {
		background: rgba(255, 255, 255, 0.08);
	}

	.kpi-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}

	.kpi-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted, #8b949e);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.kpi-value {
		font-size: 18px;
		font-weight: 700;
		color: var(--text-primary, #e6edf3);
		font-family: var(--font-editor, monospace);
		line-height: 1.1;
	}

	.charts-grid {
		display: grid;
		grid-template-columns: 3fr 2fr;
		gap: 12px;
	}

	@media (max-width: 900px) {
		.charts-grid {
			grid-template-columns: 1fr;
		}
	}

	.chart-card {
		background: var(--bg-secondary, #161b22);
		border: 1px solid var(--border-subtle, #30363d);
		border-radius: 8px;
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 250px;
	}

	.chart-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.chart-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary, #c9d1d9);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.chart-badge {
		font-size: 9px;
		color: var(--accent-primary, #e69d45);
		background: var(--accent-subtle, rgba(230, 157, 69, 0.1));
		border: 1px solid rgba(230, 157, 69, 0.3);
		padding: 1px 6px;
		border-radius: 10px;
		font-weight: 600;
	}

	.chart-canvas-wrap {
		width: 100%;
		height: 210px;
		min-height: 210px;
	}
</style>
