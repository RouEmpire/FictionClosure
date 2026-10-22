import * as echarts from "echarts";
import type { RecentProject } from "@shared/types";
import type { DashboardStats } from "@services/recentProjects";

export function buildProgressChartOption(recentProjects: RecentProject[]): echarts.EChartsOption {
    const projectNames = recentProjects.map((p) => p.name || "Untitled");
    const actualWords = recentProjects.map((p) => p.wordCount || 0);
    const targetWords = recentProjects.map((p) => p.targetWordCount || 50000);

    return {
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
                formatter: (val: string) =>
                    val.length > 12 ? val.slice(0, 10) + "…" : val,
            },
        },
        yAxis: {
            type: "value",
            axisLine: { lineStyle: { color: "#30363d" } },
            splitLine: {
                lineStyle: { color: "rgba(255, 255, 255, 0.06)" },
            },
            axisLabel: {
                color: "#8b949e",
                fontSize: 10,
                formatter: (v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`,
            },
        },
        series: [
            {
                name: "Words Written",
                type: "bar",
                data: actualWords.length > 0 ? actualWords : [0],
                barMaxWidth: 30,
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(
                        0,
                        0,
                        0,
                        1,
                        [
                            { offset: 0, color: "#e69d45" },
                            { offset: 1, color: "#ba7020" },
                        ],
                    ),
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
}

export function buildPieChartOption(stats: DashboardStats): echarts.EChartsOption {
    const manuscriptCount = stats.totalManuscripts || 0;
    const characterCount = stats.totalCharacters || 0;
    const worldCount = stats.totalWorld || 0;
    const notesCount = Math.max(
        0,
        (stats.totalDocuments || 0) -
            manuscriptCount -
            characterCount -
            worldCount,
    );

    return {
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
                    {
                        value: manuscriptCount,
                        name: "Chapters",
                        itemStyle: { color: "#58a6ff" },
                    },
                    {
                        value: characterCount,
                        name: "Characters",
                        itemStyle: { color: "#e69d45" },
                    },
                    {
                        value: worldCount,
                        name: "World & Lore",
                        itemStyle: { color: "#3fb950" },
                    },
                    {
                        value: notesCount,
                        name: "Notes",
                        itemStyle: { color: "#bc8cff" },
                    },
                ],
            },
        ],
    };
}
