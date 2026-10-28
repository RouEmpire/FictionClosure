<script lang="ts">
    import {
        extractThemePalette,
        type AnyThemeEntry,
    } from "@shared/domain/customThemes";

    interface Props {
        theme: AnyThemeEntry;
        isActive: boolean;
        onApply: (id: string) => void;
        onDelete?: (id: string) => void;
    }

    let { theme, isActive, onApply, onDelete }: Props = $props();

    const palette = $derived(extractThemePalette(theme.theme));
    const isDark = $derived(theme.appearance !== "light");
</script>

<div
    class="theme-card"
    class:active={isActive}
    role="article"
    aria-label={`${theme.name} Theme`}
>
    <!-- Card Top Header -->
    <div class="card-top">
        <div class="card-info">
            <h4 class="card-title" title={theme.name}>{theme.name}</h4>
            <span class="card-package" title={theme.packageName}>
                {theme.packageName}
            </span>
        </div>

        <div class="card-badges">
            <span class="badge-mode" title={`Appearance: ${theme.appearance}`}>
                <i class={isDark ? "fa-solid fa-moon" : "fa-solid fa-sun"}></i>
                {isDark ? "Dark" : "Light"}
            </span>
            {#if theme.isCustom}
                <span class="badge-custom" title="User-installed theme">Custom</span>
            {/if}
        </div>
    </div>

    <!-- 5-Color Swatch Palette Preview -->
    <div class="card-swatches" aria-label="Color palette preview">
        <span
            class="swatch-chip"
            style:background-color={palette.background}
            title={`Background: ${palette.background}`}
        ></span>
        <span
            class="swatch-chip"
            style:background-color={palette.surface}
            title={`Surface: ${palette.surface}`}
        ></span>
        <span
            class="swatch-chip"
            style:background-color={palette.border}
            title={`Border: ${palette.border}`}
        ></span>
        <span
            class="swatch-chip"
            style:background-color={palette.accent}
            title={`Accent: ${palette.accent}`}
        ></span>
        <span
            class="swatch-chip"
            style:background-color={palette.text}
            title={`Text: ${palette.text}`}
        ></span>
    </div>

    <!-- Card Action Buttons -->
    <div class="card-actions">
        <button
            type="button"
            class="btn-apply-theme"
            class:active={isActive}
            onclick={() => onApply(theme.id)}
            aria-pressed={isActive}
        >
            {#if isActive}
                <i class="fa-solid fa-check"></i> Active
            {:else}
                Apply Theme
            {/if}
        </button>

        {#if theme.isCustom && onDelete}
            <button
                type="button"
                class="btn-delete-theme"
                onclick={() => onDelete(theme.id)}
                title="Uninstall custom theme"
                aria-label={`Delete ${theme.name} theme`}
            >
                <i class="fa-solid fa-trash"></i>
            </button>
        {/if}
    </div>
</div>
