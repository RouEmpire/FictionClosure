<script lang="ts">
    import { clampFontSize } from "@shared/domain/typography";
    import {
        ensureBundledFontsRegisteredInCss,
        getBundledFonts,
    } from "@shared/domain/bundledFonts";
    import { FONT_PRESETS, FONT_WEIGHTS } from "../settingsConstants";

    interface Props {
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        onChange: () => void;
    }

    let {
        fontFamily = $bindable(""),
        fontSize = $bindable(15),
        fontWeight = $bindable(400),
        onChange,
    }: Props = $props();

    const bundledFonts = getBundledFonts();
    ensureBundledFontsRegisteredInCss();

    function applyFontPreset(fontValue: string) {
        fontFamily = fontValue;
        onChange();
    }

    function handleFontSizeStep(delta: number) {
        fontSize = clampFontSize(fontSize + delta);
        onChange();
    }
</script>

<section class="settings-group-card">
    <h3 class="group-title">Font Family & Sizing</h3>
    <p class="group-desc">
        Configure typeface, dimensions, and weights for the manuscript writing surface.
    </p>

    <!-- Custom font family -->
    <div class="setting-item">
        <label for="custom-font-input" class="setting-label">Font Family</label>
        <div class="input-with-button">
            <input
                id="custom-font-input"
                type="text"
                class="text-input"
                placeholder="e.g. 'Fira Code', 'Courier Prime', Georgia, monospace"
                bind:value={fontFamily}
                oninput={onChange}
            />
            {#if fontFamily}
                <button
                    type="button"
                    class="btn-reset"
                    onclick={() => applyFontPreset("")}
                    title="Reset to default font"
                >
                    Reset
                </button>
            {/if}
        </div>
        <span class="setting-hint">
            Enter any font installed on your system or select from presets below.
        </span>
    </div>

    <!-- Bundled Fonts (Shipped with FictionClosure) -->
    {#if bundledFonts.length > 0}
        <div class="setting-item">
            <div class="setting-label" style="display: flex; align-items: center; justify-content: space-between;">
                <span>Bundled Fonts</span>
                <span class="setting-hint" style="margin: 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-primary);">
                    Shipped with FictionClosure
                </span>
            </div>
            <div class="presets-grid">
                {#each bundledFonts as bf}
                    {@const isActive = fontFamily === bf.fontFamilyCss || fontFamily.includes(bf.name)}
                    <button
                        type="button"
                        class="preset-btn"
                        class:active={isActive}
                        onclick={() => applyFontPreset(bf.fontFamilyCss)}
                        title="Set editor font to {bf.name}"
                    >
                        <span class="preset-name">
                            <i class="fa-solid fa-box-archive" style="font-size: 0.75rem; margin-right: 0.35rem; color: var(--accent-primary);"></i>
                            {bf.name}
                        </span>
                        <span
                            class="preset-sample"
                            style="font-family: '{bf.name}', sans-serif"
                        >
                            The quick brown fox • สวัสดีชาวโลก
                        </span>
                    </button>
                {/each}
            </div>
            <span class="setting-hint">
                High-grade typefaces in <code>src/media/Font</code> configured via <code>config.json</code>.
            </span>
        </div>
    {/if}

    <!-- Font Presets -->
    <div class="setting-item">
        <div class="setting-label">Presets</div>
        <div class="presets-grid">
            {#each FONT_PRESETS as preset}
                {@const isActive = fontFamily === preset.value}
                <button
                    type="button"
                    class="preset-btn"
                    class:active={isActive}
                    onclick={() => applyFontPreset(preset.value)}
                >
                    <span class="preset-name">{preset.name}</span>
                    <span
                        class="preset-sample"
                        style="font-family: {preset.value || 'inherit'}"
                    >
                        The quick brown fox
                    </span>
                </button>
            {/each}
        </div>
    </div>

    <!-- Font Size & Weight Grid -->
    <div class="row-2col">
        <!-- Font Size -->
        <div class="setting-item">
            <label for="font-size-input" class="setting-label">Font Size</label>
            <div class="stepper-input-wrapper">
                <button
                    type="button"
                    class="stepper-btn"
                    onclick={() => handleFontSizeStep(-1)}
                    disabled={fontSize <= 12}
                    title="Decrease font size"
                >
                    -
                </button>
                <input
                    id="font-size-input"
                    type="number"
                    min="12"
                    max="36"
                    class="stepper-field"
                    bind:value={fontSize}
                    oninput={onChange}
                />
                <span class="unit-label">px</span>
                <button
                    type="button"
                    class="stepper-btn"
                    onclick={() => handleFontSizeStep(1)}
                    disabled={fontSize >= 36}
                    title="Increase font size"
                >
                    +
                </button>
            </div>
            <div class="size-quick-chips">
                {#each [13, 14, 15, 16, 18, 20, 24] as size}
                    <button
                        type="button"
                        class="chip-btn"
                        class:active={fontSize === size}
                        onclick={() => {
                            fontSize = size;
                            onChange();
                        }}
                    >
                        {size}
                    </button>
                {/each}
            </div>
        </div>

        <!-- Font Weight -->
        <div class="setting-item">
            <label for="font-weight-select" class="setting-label">Font Weight</label>
            <select
                id="font-weight-select"
                class="select-dropdown"
                bind:value={fontWeight}
                onchange={onChange}
            >
                {#each FONT_WEIGHTS as fw}
                    <option value={fw.value}>{fw.label}</option>
                {/each}
            </select>
            <span class="setting-hint">
                Applies to typography when supported by the active typeface.
            </span>
        </div>
    </div>
</section>
