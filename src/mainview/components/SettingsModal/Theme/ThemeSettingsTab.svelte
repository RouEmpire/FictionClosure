<script lang="ts">
    import {
        loadCustomThemes,
        saveCustomThemes,
        loadActiveThemeId,
        saveActiveThemeId,
        applyActiveTheme,
        getAllThemes,
        DEFAULT_THEME_ID,
        type CustomThemeEntry,
        type AnyThemeEntry,
    } from "@shared/domain/customThemes";
    import ThemeInstallDropzone from "./ThemeInstallDropzone.svelte";
    import ThemeCard from "./ThemeCard.svelte";
    import "./themeTab.css";

    interface Props {
        onThemeChanged?: (themeId: string) => void;
    }

    let { onThemeChanged }: Props = $props();

    type FilterMode = "all" | "dark" | "light" | "builtin" | "custom";

    let customThemes = $state<CustomThemeEntry[]>(loadCustomThemes());
    let activeThemeId = $state<string>(loadActiveThemeId());
    let filterMode = $state<FilterMode>("all");
    let searchQuery = $state<string>("");

    const allThemes = $derived<AnyThemeEntry[]>(getAllThemes(customThemes));

    const activeThemeEntry = $derived(
        allThemes.find((t) => t.id === activeThemeId) ?? null,
    );

    const filteredThemes = $derived(
        allThemes.filter((t) => {
            if (filterMode === "dark" && t.appearance !== "dark") return false;
            if (filterMode === "light" && t.appearance !== "light") return false;
            if (filterMode === "builtin" && t.isCustom) return false;
            if (filterMode === "custom" && !t.isCustom) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                return (
                    t.name.toLowerCase().includes(q) ||
                    t.packageName.toLowerCase().includes(q)
                );
            }
            return true;
        }),
    );

    const darkCount = $derived(allThemes.filter((t) => t.appearance === "dark").length);
    const lightCount = $derived(allThemes.filter((t) => t.appearance === "light").length);
    const customCount = $derived(customThemes.length);
    const builtinCount = $derived(allThemes.length - customThemes.length);

    function handleApplyTheme(id: string) {
        activeThemeId = id;
        saveActiveThemeId(id);
        applyActiveTheme(id, customThemes);
        onThemeChanged?.(id);
    }

    function handleResetToDefault() {
        handleApplyTheme(DEFAULT_THEME_ID);
    }

    function handleInstallThemes(newThemes: CustomThemeEntry[], _pkgName: string) {
        const existingIds = new Set(customThemes.map((t) => t.id));
        const toAdd = newThemes.filter((t) => !existingIds.has(t.id));
        const updated = [...customThemes, ...toAdd];

        customThemes = updated;
        saveCustomThemes(updated);

        // Auto-apply first newly installed theme
        if (toAdd.length > 0) {
            handleApplyTheme(toAdd[0].id);
        }
    }

    function handleDeleteTheme(id: string) {
        const updated = customThemes.filter((t) => t.id !== id);
        customThemes = updated;
        saveCustomThemes(updated);

        if (activeThemeId === id) {
            handleResetToDefault();
        }
    }
</script>

<div class="theme-settings-tab" role="region" aria-label="Theme Settings">
    <!-- Active Theme Hero Card -->
    <div class="theme-hero-card" class:has-active={activeThemeId !== DEFAULT_THEME_ID}>
        <div class="hero-left">
            <div class="hero-icon-box">
                <i class="fa-solid fa-palette"></i>
            </div>
            <div class="hero-text">
                <h3 class="hero-title">
                    Active Theme:
                    {activeThemeEntry ? activeThemeEntry.name : "Default FictionClosure"}
                </h3>
                <p class="hero-desc">
                    {#if activeThemeEntry}
                        From {activeThemeEntry.packageName} ({activeThemeEntry.appearance})
                    {:else}
                        Original deep-slate workspace color scheme
                    {/if}
                </p>
            </div>
        </div>

        {#if activeThemeId !== DEFAULT_THEME_ID}
            <button
                type="button"
                class="hero-reset-btn"
                onclick={handleResetToDefault}
                title="Reset back to default FictionClosure theme"
            >
                <i class="fa-solid fa-rotate-left"></i>
                Reset to Default
            </button>
        {/if}
    </div>

    <!-- Theme Installation & zen-themes.com Guidance -->
    <ThemeInstallDropzone onInstalled={handleInstallThemes} />

    <!-- Controls Bar: Filter Chips & Search -->
    <div class="theme-controls-bar">
        <div class="theme-filter-chips" role="radiogroup" aria-label="Filter themes">
            <button
                type="button"
                class="filter-chip"
                class:active={filterMode === "all"}
                onclick={() => (filterMode = "all")}
            >
                All ({allThemes.length})
            </button>
            <button
                type="button"
                class="filter-chip"
                class:active={filterMode === "dark"}
                onclick={() => (filterMode = "dark")}
            >
                Dark ({darkCount})
            </button>
            <button
                type="button"
                class="filter-chip"
                class:active={filterMode === "light"}
                onclick={() => (filterMode = "light")}
            >
                Light ({lightCount})
            </button>
            <button
                type="button"
                class="filter-chip"
                class:active={filterMode === "builtin"}
                onclick={() => (filterMode = "builtin")}
            >
                Built-in ({builtinCount})
            </button>
            <button
                type="button"
                class="filter-chip"
                class:active={filterMode === "custom"}
                onclick={() => (filterMode = "custom")}
            >
                Custom ({customCount})
            </button>
        </div>

        <div class="theme-search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input
                type="text"
                class="theme-search-input"
                placeholder="Search themes..."
                bind:value={searchQuery}
            />
        </div>
    </div>

    <!-- Theme Cards Gallery Grid -->
    <div class="theme-grid">
        {#each filteredThemes as theme (theme.id)}
            <ThemeCard
                {theme}
                isActive={activeThemeId === theme.id}
                onApply={handleApplyTheme}
                onDelete={handleDeleteTheme}
            />
        {/each}

        {#if filteredThemes.length === 0}
            <div class="empty-themes-state">
                <p>No themes matched your search or filter.</p>
            </div>
        {/if}
    </div>
</div>
