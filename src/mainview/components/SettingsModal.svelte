<script lang="ts">
    import {
        DEFAULT_TYPOGRAPHY_SETTINGS,
        KNOWN_FONT_FEATURES,
        clampFirstLineIndent,
        clampFontSize,
        clampFontWeight,
        computeLineHeight,
        formatFontFeatureSettings,
        formatTextAutospace,
        type EditorTypographySettings,
        type TextAutospaceMode,
        type TextJustifyMode,
        type TextRenderingMode,
    } from "../../shared/domain/typography";

    interface Props {
        isOpen: boolean;
        typography?: EditorTypographySettings;
        currentFont?: string;
        onClose: () => void;
        onFontChange?: (font: string) => void;
        onUpdateTypography?: (settings: EditorTypographySettings) => void;
    }

    let {
        isOpen,
        typography = DEFAULT_TYPOGRAPHY_SETTINGS,
        currentFont = "",
        onClose,
        onFontChange,
        onUpdateTypography,
    }: Props = $props();

    let activeTab = $state<
        "editor" | "appearance" | "persistence" | "keybindings"
    >("editor");

    // Local editable typography state
    let fontFamily = $state("");
    let fontSize = $state(15);
    let fontWeight = $state(400);
    let hideMouseOnTyping = $state(true);
    let textRendering = $state<TextRenderingMode>("auto");
    let firstLineIndent = $state(0.0);
    let textJustify = $state<TextJustifyMode>("auto");
    let textAutospace = $state<TextAutospaceMode>("normal");
    let customTextAutospace = $state("");
    let activeFeatures = $state<string[]>(["calt", "liga"]);
    let customFontFeaturesText = $state("");
    let newCustomTagInput = $state("");

    // Sync local state whenever modal opens or props update
    $effect(() => {
        if (isOpen) {
            const initial = typography || DEFAULT_TYPOGRAPHY_SETTINGS;
            fontFamily = currentFont || initial.fontFamily || "";
            fontSize = initial.fontSize || 15;
            fontWeight = initial.fontWeight || 400;
            hideMouseOnTyping = initial.hideMouseOnTyping ?? true;
            textRendering = initial.textRendering || "auto";
            firstLineIndent = initial.firstLineIndent ?? 0.0;
            textJustify = initial.textJustify || "auto";
            textAutospace = initial.textAutospace || "normal";
            customTextAutospace = initial.customTextAutospace || "";
            activeFeatures = [...(initial.fontFeatures || ["calt", "liga"])];
            customFontFeaturesText = initial.customFontFeaturesText || "";
            newCustomTagInput = "";
        }
    });

    function emitChange() {
        const updated: EditorTypographySettings = {
            fontFamily: fontFamily.trim(),
            fontSize: clampFontSize(fontSize),
            fontWeight: clampFontWeight(fontWeight),
            hideMouseOnTyping,
            textRendering,
            firstLineIndent: clampFirstLineIndent(firstLineIndent),
            textJustify,
            textAutospace,
            customTextAutospace: customTextAutospace.trim(),
            fontFeatures: [...activeFeatures],
            customFontFeaturesText: customFontFeaturesText.trim(),
        };

        onUpdateTypography?.(updated);
        onFontChange?.(updated.fontFamily);
    }

    const fontPresets = [
        { name: "Default (System Editor)", value: "" },
        { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
        { name: "Fira Code", value: "'Fira Code', monospace" },
        {
            name: "Courier Prime",
            value: "'Courier Prime', 'Courier New', monospace",
        },
        { name: "Merriweather", value: "'Merriweather', Georgia, serif" },
        { name: "Georgia", value: "Georgia, 'Times New Roman', serif" },
        {
            name: "Inter / Clean Sans",
            value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        },
    ];

    const fontWeights = [
        { value: 100, label: "100 - Thin" },
        { value: 200, label: "200 - Extra Light" },
        { value: 300, label: "300 - Light" },
        { value: 400, label: "400 - Regular (Default)" },
        { value: 500, label: "500 - Medium" },
        { value: 600, label: "600 - Semi Bold" },
        { value: 700, label: "700 - Bold" },
        { value: 800, label: "800 - Extra Bold" },
        { value: 900, label: "900 - Black" },
    ];

    const textRenderingOptions: {
        value: TextRenderingMode;
        label: string;
        desc: string;
    }[] = [
        {
            value: "auto",
            label: "Auto",
            desc: "Browser manages speed, kerning, and precision",
        },
        {
            value: "optimizeLegibility",
            label: "Optimize Legibility",
            desc: "Best reading experience with full kerning and ligatures",
        },
        {
            value: "optimizeSpeed",
            label: "Optimize Speed",
            desc: "Fast text drawing, disables ligatures & kerning",
        },
        {
            value: "geometricPrecision",
            label: "Geometric Precision",
            desc: "Precise glyph outlines without font engine hinting",
        },
    ];

    const textJustifyOptions: {
        value: TextJustifyMode;
        label: string;
        desc: string;
    }[] = [
        {
            value: "auto",
            label: "Auto",
            desc: "Browser determines justification algorithm",
        },
        {
            value: "distribute",
            label: "Distribute",
            desc: "Distributes spacing across words and glyphs evenly",
        },
        {
            value: "inter-word",
            label: "Inter-Word",
            desc: "Adjusts spacing between words only",
        },
        {
            value: "inter-character",
            label: "Inter-Character",
            desc: "Adjusts spacing between characters (ideal for CJK scripts)",
        },
    ];

    const textAutospaceOptions: {
        value: TextAutospaceMode;
        label: string;
        desc: string;
    }[] = [
        {
            value: "normal",
            label: "Normal",
            desc: "Standard browser spacing behavior",
        },
        {
            value: "no-autospace",
            label: "No Autospace",
            desc: "Disable all automatic script spacing",
        },
        {
            value: "ideograph-alpha",
            label: "Ideograph-Alpha",
            desc: "Spacing between CJK ideographs and Latin alphabet",
        },
        {
            value: "ideograph-numeric",
            label: "Ideograph-Numeric",
            desc: "Spacing between CJK ideographs and digits",
        },
        {
            value: "punctuation",
            label: "Punctuation",
            desc: "Spacing around ideographs and punctuation marks",
        },
        {
            value: "insert",
            label: "Insert",
            desc: "Inserts spacing as expansion opportunity",
        },
        {
            value: "replace",
            label: "Replace",
            desc: "Replaces glyph whitespace with spacing",
        },
        {
            value: "CUSTOM",
            label: "Custom...",
            desc: "Specify custom space tokens",
        },
    ];

    function applyFontPreset(fontValue: string) {
        fontFamily = fontValue;
        emitChange();
    }

    function handleFontSizeStep(delta: number) {
        fontSize = clampFontSize(fontSize + delta);
        emitChange();
    }

    function toggleFeatureTag(tag: string) {
        if (activeFeatures.includes(tag)) {
            activeFeatures = activeFeatures.filter((t) => t !== tag);
        } else {
            activeFeatures = [...activeFeatures, tag];
        }
        emitChange();
    }

    function addCustomTag() {
        const clean = newCustomTagInput
            .trim()
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 4);
        if (clean.length >= 2 && !activeFeatures.includes(clean)) {
            activeFeatures = [...activeFeatures, clean];
            newCustomTagInput = "";
            emitChange();
        }
    }

    function removeFeatureTag(tag: string) {
        activeFeatures = activeFeatures.filter((t) => t !== tag);
        emitChange();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    }

    // Live preview computed CSS values
    const previewLineHeight = $derived(computeLineHeight(fontSize));
    const previewFontFeatures = $derived(
        formatFontFeatureSettings(activeFeatures, customFontFeaturesText),
    );
    const previewAutospace = $derived(
        formatTextAutospace(textAutospace, customTextAutospace),
    );
</script>

{#if isOpen}
    <div
        class="modal-backdrop"
        onclick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        role="presentation"
    >
        <div
            class="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-heading"
            tabindex="-1"
            onkeydown={handleKeyDown}
        >
            <!-- Header -->
            <div class="settings-header">
                <div class="title-row">
                    <span class="settings-icon">⚙️</span>
                    <h2 id="settings-heading" class="settings-title">
                        Preferences & Settings
                    </h2>
                </div>
                <button
                    type="button"
                    class="close-btn"
                    onclick={onClose}
                    aria-label="Close settings">✕</button
                >
            </div>

            <!-- Main Content with Sidebar Tabs -->
            <div class="settings-content">
                <!-- Settings Navigation -->
                <nav class="settings-tabs" aria-label="Settings categories">
                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "editor"}
                        onclick={() => (activeTab = "editor")}
                    >
                        <span>🖋️</span> Editor & Typography
                    </button>

                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "appearance"}
                        onclick={() => (activeTab = "appearance")}
                    >
                        <span>🎨</span> Appearance
                        <span class="badge-todo">TODO</span>
                    </button>

                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "persistence"}
                        onclick={() => (activeTab = "persistence")}
                    >
                        <span>💾</span> Storage & Backups
                        <span class="badge-todo">TODO</span>
                    </button>

                    <button
                        type="button"
                        class="tab-btn"
                        class:active={activeTab === "keybindings"}
                        onclick={() => (activeTab = "keybindings")}
                    >
                        <span>⌨️</span> Keybindings & Vim
                        <span class="badge-todo">TODO</span>
                    </button>
                </nav>

                <!-- Settings Tab Body -->
                <div class="settings-panel">
                    {#if activeTab === "editor"}
                        <div class="typography-scroll-area">
                            <!-- 1. Font Family & Sizing Section -->
                            <section class="settings-group-card">
                                <h3 class="group-title">
                                    Font Family & Sizing
                                </h3>
                                <p class="group-desc">
                                    Configure typeface, dimensions, and weights
                                    for the manuscript writing surface.
                                </p>

                                <!-- Custom font family -->
                                <div class="setting-item">
                                    <label
                                        for="custom-font-input"
                                        class="setting-label">Font Family</label
                                    >
                                    <div class="input-with-button">
                                        <input
                                            id="custom-font-input"
                                            type="text"
                                            class="text-input"
                                            placeholder="e.g. 'Fira Code', 'Courier Prime', Georgia, monospace"
                                            bind:value={fontFamily}
                                            oninput={emitChange}
                                        />
                                        {#if fontFamily}
                                            <button
                                                type="button"
                                                class="btn-reset"
                                                onclick={() =>
                                                    applyFontPreset("")}
                                                title="Reset to default font"
                                            >
                                                Reset
                                            </button>
                                        {/if}
                                    </div>
                                    <span class="setting-hint"
                                        >Enter any font installed on your system
                                        or select from presets below.</span
                                    >
                                </div>

                                <!-- Font Presets -->
                                <div class="setting-item">
                                    <div class="setting-label">Presets</div>
                                    <div class="presets-grid">
                                        {#each fontPresets as preset}
                                            {@const isActive =
                                                fontFamily === preset.value}
                                            <button
                                                type="button"
                                                class="preset-btn"
                                                class:active={isActive}
                                                onclick={() =>
                                                    applyFontPreset(
                                                        preset.value,
                                                    )}
                                            >
                                                <span class="preset-name"
                                                    >{preset.name}</span
                                                >
                                                <span
                                                    class="preset-sample"
                                                    style="font-family: {preset.value ||
                                                        'inherit'}"
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
                                        <label
                                            for="font-size-input"
                                            class="setting-label"
                                            >Font Size</label
                                        >
                                        <div class="stepper-input-wrapper">
                                            <button
                                                type="button"
                                                class="stepper-btn"
                                                onclick={() =>
                                                    handleFontSizeStep(-1)}
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
                                                oninput={emitChange}
                                            />
                                            <span class="unit-label">px</span>
                                            <button
                                                type="button"
                                                class="stepper-btn"
                                                onclick={() =>
                                                    handleFontSizeStep(1)}
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
                                                    class:active={fontSize ===
                                                        size}
                                                    onclick={() => {
                                                        fontSize = size;
                                                        emitChange();
                                                    }}
                                                >
                                                    {size}
                                                </button>
                                            {/each}
                                        </div>
                                    </div>

                                    <!-- Font Weight -->
                                    <div class="setting-item">
                                        <label
                                            for="font-weight-select"
                                            class="setting-label"
                                            >Font Weight</label
                                        >
                                        <select
                                            id="font-weight-select"
                                            class="select-dropdown"
                                            bind:value={fontWeight}
                                            onchange={emitChange}
                                        >
                                            {#each fontWeights as fw}
                                                <option value={fw.value}
                                                    >{fw.label}</option
                                                >
                                            {/each}
                                        </select>
                                        <span class="setting-hint"
                                            >Applies to typography when
                                            supported by the active typeface.</span
                                        >
                                    </div>
                                </div>
                            </section>

                            <!-- 2. Paragraph Formatting & Justification -->
                            <section class="settings-group-card">
                                <h3 class="group-title">
                                    Paragraph Alignment & Spacing
                                </h3>
                                <p class="group-desc">
                                    Adjust book-grade indentation, justification
                                    algorithms, and East Asian typography.
                                </p>

                                <!-- First Line Indent (Slider 0.0% to 10.0%) -->
                                <div class="setting-item">
                                    <div class="label-with-value">
                                        <label
                                            for="first-line-indent-slider"
                                            class="setting-label"
                                            >First Line Indent</label
                                        >
                                        <div class="value-badge-group">
                                            <span class="value-badge"
                                                >{firstLineIndent.toFixed(
                                                    1,
                                                )}%</span
                                            >
                                            {#if firstLineIndent > 0}
                                                <button
                                                    type="button"
                                                    class="btn-text-action"
                                                    onclick={() => {
                                                        firstLineIndent = 0.0;
                                                        emitChange();
                                                    }}
                                                >
                                                    Reset (0%)
                                                </button>
                                            {/if}
                                        </div>
                                    </div>
                                    <div class="slider-wrapper">
                                        <span class="slider-min">0%</span>
                                        <input
                                            id="first-line-indent-slider"
                                            type="range"
                                            class="brand-slider"
                                            min="0"
                                            max="10"
                                            step="0.1"
                                            bind:value={firstLineIndent}
                                            oninput={emitChange}
                                            aria-valuemin={0}
                                            aria-valuemax={10}
                                            aria-valuenow={firstLineIndent}
                                            aria-valuetext="{firstLineIndent.toFixed(
                                                1,
                                            )} percent"
                                        />
                                        <span class="slider-max">10%</span>
                                    </div>
                                    <span class="setting-hint"
                                        >Indents the first line of each
                                        paragraph, following traditional fiction
                                        and book typesetting standards.</span
                                    >
                                </div>

                                <div class="row-1col">
                                    <!-- Text Justify -->
                                    <div class="setting-item">
                                        <label
                                            for="text-justify-select"
                                            class="setting-label"
                                            >Text Justify</label
                                        >
                                        <select
                                            id="text-justify-select"
                                            class="select-dropdown"
                                            bind:value={textJustify}
                                            onchange={emitChange}
                                        >
                                            {#each textJustifyOptions as opt}
                                                <option value={opt.value}
                                                    >{opt.label} — {opt.desc}</option
                                                >
                                            {/each}
                                        </select>
                                        <span class="setting-hint"
                                            >Controls how spacing expands across
                                            lines when text is justified.</span
                                        >
                                    </div>

                                    <!-- Text Autospace (In the UI it is "Asian Autospace") -->
                                    <div class="setting-item">
                                        <label
                                            for="text-autospace-select"
                                            class="setting-label"
                                            >Asian Autospace (text-autospace)</label
                                        >
                                        <select
                                            id="text-autospace-select"
                                            class="select-dropdown"
                                            bind:value={textAutospace}
                                            onchange={emitChange}
                                        >
                                            {#each textAutospaceOptions as opt}
                                                <option value={opt.value}
                                                    >{opt.label}</option
                                                >
                                            {/each}
                                        </select>
                                        <span class="setting-hint">
                                            {textAutospaceOptions.find(
                                                (o) =>
                                                    o.value === textAutospace,
                                            )?.desc ||
                                                "Controls automated ideographic character spacing"}
                                        </span>

                                        {#if textAutospace === "CUSTOM"}
                                            <div
                                                class="custom-autospace-input-box"
                                            >
                                                <input
                                                    type="text"
                                                    class="text-input"
                                                    placeholder="e.g. ideograph-alpha ideograph-numeric"
                                                    bind:value={
                                                        customTextAutospace
                                                    }
                                                    oninput={emitChange}
                                                />
                                                <span class="field-subnote"
                                                    >Enter custom CSS Text 4
                                                    autospace tokens separated
                                                    by spaces.</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </section>

                            <!-- 3. Text Rendering & Mouse Behavior -->
                            <section class="settings-group-card">
                                <h3 class="group-title">
                                    Rendering & Interaction
                                </h3>
                                <p class="group-desc">
                                    Engine-level glyph rasterization options and
                                    cursor visibility preferences.
                                </p>

                                <div class="setting-item">
                                    <label
                                        for="text-rendering-select"
                                        class="setting-label"
                                        >Text Rendering (text-rendering)</label
                                    >
                                    <div class="rendering-options-grid">
                                        {#each textRenderingOptions as rOpt}
                                            {@const isSelected =
                                                textRendering === rOpt.value}
                                            <button
                                                type="button"
                                                class="rendering-card"
                                                class:active={isSelected}
                                                onclick={() => {
                                                    textRendering = rOpt.value;
                                                    emitChange();
                                                }}
                                            >
                                                <span class="rendering-title"
                                                    >{rOpt.label}</span
                                                >
                                                <span class="rendering-desc"
                                                    >{rOpt.desc}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Hide mouse on typing -->
                                <div class="setting-item">
                                    <div class="toggle-row">
                                        <div class="toggle-text-block">
                                            <span class="setting-label"
                                                >Hide Mouse on Typing</span
                                            >
                                            <span class="setting-hint"
                                                >Automatically hides the mouse
                                                pointer while typing in the
                                                editor, and unhides it
                                                immediately upon mouse motion.</span
                                            >
                                        </div>
                                        <label
                                            class="switch-toggle"
                                            for="hide-mouse-toggle"
                                        >
                                            <input
                                                id="hide-mouse-toggle"
                                                type="checkbox"
                                                bind:checked={hideMouseOnTyping}
                                                onchange={emitChange}
                                            />
                                            <span class="toggle-slider"></span>
                                        </label>
                                    </div>

                                    <!-- Wayland Notice Card -->
                                    <div class="wayland-notice-card">
                                        <span class="notice-icon">🐧</span>
                                        <div class="notice-text">
                                            <strong
                                                >Linux / Wayland Notice:</strong
                                            >
                                            <span
                                                >On some Wayland compositors
                                                (GNOME Mutter, KWin, Sway),
                                                mouse pointer hiding during
                                                typing may only take visual
                                                effect when the mouse moves by
                                                1px due to how compositor cursor
                                                frame buffers refresh.</span
                                            >
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <!-- 4. Font Features (a CUSTOM list) -->
                            <section class="settings-group-card">
                                <h3 class="group-title">
                                    OpenType Font Features
                                    (font-feature-settings)
                                </h3>
                                <p class="group-desc">
                                    Enable or configure custom OpenType
                                    typographic feature tags supported by your
                                    font.
                                </p>

                                <!-- Common OpenType Features -->
                                <div class="setting-item">
                                    <div class="setting-label">
                                        Common OpenType Features
                                    </div>
                                    <div class="feature-chips-grid">
                                        {#each KNOWN_FONT_FEATURES as feat}
                                            {@const isEnabled =
                                                activeFeatures.includes(
                                                    feat.tag,
                                                )}
                                            <button
                                                type="button"
                                                class="feature-toggle-chip"
                                                class:active={isEnabled}
                                                onclick={() =>
                                                    toggleFeatureTag(feat.tag)}
                                                title="{feat.tag} — {feat.description}"
                                            >
                                                <span class="feat-tag"
                                                    >{feat.tag}</span
                                                >
                                                <span class="feat-name"
                                                    >{feat.label}</span
                                                >
                                                <span class="feat-indicator"
                                                    >{isEnabled
                                                        ? "✓"
                                                        : "+"}</span
                                                >
                                            </button>
                                        {/each}
                                    </div>
                                </div>

                                <!-- Custom Features List Manager -->
                                <div class="setting-item">
                                    <div class="setting-label">
                                        Custom OpenType Feature Tags
                                    </div>
                                    <div class="add-tag-row">
                                        <input
                                            type="text"
                                            class="text-input custom-tag-input"
                                            placeholder="e.g. cv01, hist, swsh, salt"
                                            maxlength="4"
                                            bind:value={newCustomTagInput}
                                            onkeydown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addCustomTag();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            class="btn-add-tag"
                                            onclick={addCustomTag}
                                            disabled={newCustomTagInput.trim()
                                                .length < 2}
                                        >
                                            + Add Tag
                                        </button>
                                    </div>

                                    <!-- Active Features List with Remove buttons -->
                                    <div class="active-features-list">
                                        {#if activeFeatures.length === 0}
                                            <span class="empty-features-note"
                                                >No active OpenType tags
                                                (standard font rendering).</span
                                            >
                                        {:else}
                                            {#each activeFeatures as tag}
                                                <span class="active-tag-pill">
                                                    <span class="pill-tag-name"
                                                        >"{tag}" 1</span
                                                    >
                                                    <button
                                                        type="button"
                                                        class="btn-remove-tag"
                                                        onclick={() =>
                                                            removeFeatureTag(
                                                                tag,
                                                            )}
                                                        title="Remove feature {tag}"
                                                    >
                                                        ✕
                                                    </button>
                                                </span>
                                            {/each}
                                        {/if}
                                    </div>
                                </div>

                                <!-- Raw Custom Font Feature String Override -->
                                <div class="setting-item">
                                    <label
                                        for="custom-features-raw"
                                        class="setting-label"
                                        >Raw Custom font-feature-settings (CSS
                                        Syntax)</label
                                    >
                                    <input
                                        id="custom-features-raw"
                                        type="text"
                                        class="text-input"
                                        placeholder='e.g. "ss01" 1, "cv01" 2, "zero" 1'
                                        bind:value={customFontFeaturesText}
                                        oninput={emitChange}
                                    />
                                    <span class="setting-hint"
                                        >Direct raw CSS value passed into
                                        font-feature-settings. Leaves standard
                                        tag list intact.</span
                                    >
                                </div>
                            </section>

                            <!-- 5. Live Typography Preview -->
                            <section class="settings-group-card preview-card">
                                <div class="setting-label">
                                    Interactive Typography Preview
                                </div>
                                <div
                                    class="live-typography-preview-box"
                                    style="
										font-family: {fontFamily || 'var(--font-editor)'};
										font-size: {fontSize}px;
										line-height: {previewLineHeight}px;
										font-weight: {fontWeight};
										font-feature-settings: {previewFontFeatures};
										text-rendering: {textRendering};
										text-indent: {firstLineIndent}%;
										text-align: justify;
										text-justify: {textJustify};
										text-autospace: {previewAutospace};
										-webkit-text-autospace: {previewAutospace};
									"
                                >
                                    <div class="preview-paragraph">
                                        The tide receded from Ash Harbor,
                                        leaving the cold silt bare under the
                                        twin moons. Elena checked the bronze
                                        needle of her magnetic quadrant (0 vs O)
                                        — 1/2 of the expedition was already
                                        lost, yet the signal arrows -> resonated
                                        != true.
                                    </div>
                                    <div class="preview-paragraph">
                                        第三章 — 港の沈黙 (Chapter 3: Silence in
                                        the Port). Elena found 42 relics buried
                                        in ancient chambers, proving the
                                        Cartographers were here before the Great
                                        Collapse.
                                    </div>
                                </div>
                                <div class="preview-metric-pills">
                                    <span class="metric-pill"
                                        >Size: {fontSize}px</span
                                    >
                                    <span class="metric-pill"
                                        >Line Height: {previewLineHeight}px</span
                                    >
                                    <span class="metric-pill"
                                        >Weight: {fontWeight}</span
                                    >
                                    <span class="metric-pill"
                                        >Indent: {firstLineIndent.toFixed(
                                            1,
                                        )}%</span
                                    >
                                    <span class="metric-pill"
                                        >Rendering: {textRendering}</span
                                    >
                                    <span class="metric-pill"
                                        >Justify: {textJustify}</span
                                    >
                                    <span class="metric-pill"
                                        >Asian Autospace: {textAutospace}</span
                                    >
                                </div>
                            </section>
                        </div>
                    {:else if activeTab === "appearance"}
                        <div class="placeholder-section">
                            <span class="placeholder-icon">🎨</span>
                            <h4>Appearance & Themes (TODO)</h4>
                            <p>
                                Planned for future update: Zed theme
                                compatibility, customizable light/dark themes,
                                accent colors, and custom editor margins.
                            </p>
                        </div>
                    {:else if activeTab === "persistence"}
                        <div class="placeholder-section">
                            <span class="placeholder-icon">💾</span>
                            <h4>Storage & Backups (TODO)</h4>
                            <p>
                                Planned for future update: Auto-save interval
                                frequency, automatic manuscript snapshots, Git
                                auto-commit hooks, and backup zip archives.
                            </p>
                        </div>
                    {:else}
                        <div class="placeholder-section">
                            <span class="placeholder-icon">⌨️</span>
                            <h4>Keybindings & Vim (TODO)</h4>
                            <p>
                                Planned for future update: Configurable keyboard
                                shortcuts, Vim navigation mode, and Emacs key
                                bindings.
                            </p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Footer -->
            <div class="settings-footer">
                <span class="footer-hint"
                    >Shortcut: Press <kbd>Ctrl+P</kbd> to toggle Settings anytime</span
                >
                <button type="button" class="btn primary" onclick={onClose}
                    >Done</button
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .settings-modal {
        width: 100%;
        max-width: 820px;
        height: 640px;
        max-height: 90vh;
        background: var(--bg-secondary);
        border: 1px solid var(--border-bold);
        border-radius: 12px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.75);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: scaleIn 0.15s ease-out;
    }

    @keyframes scaleIn {
        from {
            transform: scale(0.96);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }

    .settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-subtle);
        background: var(--bg-tertiary);
        flex-shrink: 0;
    }

    .title-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .settings-icon {
        font-size: 16px;
    }

    .settings-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 14px;
        padding: 4px;
        border-radius: 4px;
    }

    .close-btn:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
    }

    .settings-content {
        display: flex;
        flex: 1;
        overflow: hidden;
    }

    .settings-tabs {
        width: 200px;
        background: var(--bg-tertiary);
        border-right: 1px solid var(--border-subtle);
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex-shrink: 0;
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--text-secondary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        text-align: left;
        transition: all 0.12s ease;
    }

    .tab-btn:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }

    .tab-btn.active {
        background: var(--accent-subtle);
        color: var(--accent-primary);
        font-weight: 600;
    }

    .badge-todo {
        margin-left: auto;
        font-size: 9px;
        font-weight: 700;
        color: #e3b341;
        background: rgba(227, 179, 65, 0.12);
        padding: 1px 4px;
        border-radius: 3px;
    }

    .settings-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--bg-primary);
    }

    .typography-scroll-area {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .settings-group-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        padding: 18px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .group-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }

    .group-desc {
        font-size: 12px;
        color: var(--text-muted);
        margin: -8px 0 4px 0;
        line-height: 1.4;
    }

    .setting-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .setting-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
    }

    .setting-hint {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.35;
    }

    .input-with-button {
        display: flex;
        gap: 6px;
    }

    .text-input {
        flex: 1;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 7px 12px;
        font-size: 13px;
        color: var(--text-primary);
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s ease;
    }

    .text-input:focus {
        border-color: var(--accent-primary);
        box-shadow: 0 0 0 1px var(--accent-subtle);
    }

    .btn-reset {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 0 12px;
        font-size: 12px;
        color: var(--text-secondary);
        cursor: pointer;
    }

    .btn-reset:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
    }

    .presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 6px;
    }

    .preset-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 6px 10px;
        cursor: pointer;
        text-align: left;
        transition: all 0.12s ease;
    }

    .preset-btn:hover {
        border-color: var(--border-bold);
        background: var(--bg-hover);
    }

    .preset-btn.active {
        border-color: var(--accent-primary);
        background: var(--accent-subtle);
    }

    .preset-name {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .preset-sample {
        font-size: 11px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
    }

    .row-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
    }

    .row-1col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
    }

    .stepper-input-wrapper {
        display: flex;
        align-items: center;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        width: fit-content;
        overflow: hidden;
    }

    .stepper-btn {
        background: transparent;
        border: none;
        color: var(--text-primary);
        width: 32px;
        height: 32px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .stepper-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        color: var(--accent-primary);
    }

    .stepper-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .stepper-field {
        width: 44px;
        border: none;
        background: transparent;
        color: var(--text-primary);
        text-align: center;
        font-size: 13px;
        font-weight: 600;
        outline: none;
        -moz-appearance: textfield;
    }

    .stepper-field::-webkit-inner-spin-button,
    .stepper-field::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .unit-label {
        font-size: 11px;
        color: var(--text-muted);
        padding-right: 8px;
    }

    .size-quick-chips {
        display: flex;
        gap: 4px;
        margin-top: 4px;
    }

    .chip-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        font-family: var(--font-mono, monospace);
        color: var(--text-muted);
        cursor: pointer;
    }

    .chip-btn:hover {
        color: var(--text-primary);
        border-color: var(--border-bold);
    }

    .chip-btn.active {
        background: var(--accent-subtle);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
        font-weight: bold;
    }

    .select-dropdown {
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 7px 10px;
        color: var(--text-primary);
        font-size: 12px;
        outline: none;
        cursor: pointer;
    }

    .select-dropdown:focus {
        border-color: var(--accent-primary);
    }

    .label-with-value {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .value-badge-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .value-badge {
        font-size: 11px;
        font-weight: 700;
        font-family: var(--font-mono, monospace);
        color: var(--accent-primary);
        background: var(--accent-subtle);
        padding: 1px 6px;
        border-radius: 4px;
    }

    .btn-text-action {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 11px;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
    }

    .btn-text-action:hover {
        color: var(--text-primary);
    }

    /* Brand Slider per Modern Web Guidance */
    .slider-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .slider-min,
    .slider-max {
        font-size: 10px;
        color: var(--text-muted);
        font-family: var(--font-mono, monospace);
        width: 24px;
        text-align: center;
    }

    input[type="range"].brand-slider {
        accent-color: var(--accent-primary, #e69d45);
        appearance: none;
        width: 100%;
        height: 24px;
        background: transparent;
        cursor: pointer;
        margin: 0;
    }

    input[type="range"].brand-slider::-webkit-slider-runnable-track {
        height: 6px;
        border-radius: 999px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
    }

    input[type="range"].brand-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        margin-top: -5px;
        border-radius: 50%;
        background: var(--accent-primary);
        border: 2px solid var(--bg-secondary);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
        transition: transform 0.1s ease;
    }

    input[type="range"].brand-slider::-webkit-slider-thumb:hover {
        transform: scale(1.15);
    }

    input[type="range"].brand-slider::-moz-range-track {
        height: 6px;
        border-radius: 999px;
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
    }

    input[type="range"].brand-slider::-moz-range-progress {
        height: 6px;
        border-radius: 999px;
        background: var(--accent-primary);
    }

    input[type="range"].brand-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--accent-primary);
        border: 2px solid var(--bg-secondary);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    }

    input[type="range"].brand-slider:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 4px;
    }

    .rendering-options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .rendering-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 8px 10px;
        cursor: pointer;
        text-align: left;
        transition: all 0.12s ease;
    }

    .rendering-card:hover {
        border-color: var(--border-bold);
    }

    .rendering-card.active {
        border-color: var(--accent-primary);
        background: var(--accent-subtle);
    }

    .rendering-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .rendering-desc {
        font-size: 10px;
        color: var(--text-muted);
        margin-top: 2px;
        line-height: 1.3;
    }

    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .toggle-text-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .switch-toggle {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
    }

    .switch-toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        transition: 0.2s;
        border-radius: 24px;
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: var(--text-muted);
        transition: 0.2s;
        border-radius: 50%;
    }

    input:checked + .toggle-slider {
        background-color: var(--accent-primary);
        border-color: var(--accent-primary);
    }

    input:checked + .toggle-slider:before {
        transform: translateX(20px);
        background-color: white;
    }

    .wayland-notice-card {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        background: rgba(227, 179, 65, 0.08);
        border: 1px solid rgba(227, 179, 65, 0.25);
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 6px;
    }

    .notice-icon {
        font-size: 15px;
        line-height: 1.2;
    }

    .notice-text {
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.4;
    }

    .notice-text strong {
        color: #e3b341;
        margin-right: 4px;
    }

    .feature-chips-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 6px;
    }

    .feature-toggle-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 6px 8px;
        cursor: pointer;
        text-align: left;
        transition: all 0.12s ease;
    }

    .feature-toggle-chip:hover {
        border-color: var(--border-bold);
    }

    .feature-toggle-chip.active {
        background: var(--accent-subtle);
        border-color: var(--accent-primary);
    }

    .feat-tag {
        font-family: var(--font-mono, monospace);
        font-size: 11px;
        font-weight: 700;
        color: var(--accent-primary);
        background: var(--bg-tertiary);
        padding: 1px 4px;
        border-radius: 3px;
    }

    .feat-name {
        font-size: 11px;
        color: var(--text-primary);
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .feat-indicator {
        font-size: 11px;
        font-weight: bold;
        color: var(--text-muted);
    }

    .feature-toggle-chip.active .feat-indicator {
        color: var(--accent-primary);
    }

    .add-tag-row {
        display: flex;
        gap: 6px;
        max-width: 280px;
    }

    .custom-tag-input {
        font-family: var(--font-mono, monospace);
        text-transform: lowercase;
    }

    .btn-add-tag {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 0 10px;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-primary);
        cursor: pointer;
        white-space: nowrap;
    }

    .btn-add-tag:hover:not(:disabled) {
        background: var(--bg-hover);
        color: var(--accent-primary);
    }

    .btn-add-tag:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .active-features-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 4px;
    }

    .empty-features-note {
        font-size: 11px;
        color: var(--text-muted);
        font-style: italic;
    }

    .active-tag-pill {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 2px 6px;
        font-family: var(--font-mono, monospace);
        font-size: 11px;
        color: var(--text-primary);
    }

    .btn-remove-tag {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 10px;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;
    }

    .btn-remove-tag:hover {
        color: var(--danger-color, #f85149);
    }

    .custom-autospace-input-box {
        margin-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .field-subnote {
        font-size: 10px;
        color: var(--text-muted);
    }

    /* Interactive Live Preview Box */
    .preview-card {
        background: var(--bg-tertiary);
        border-color: var(--border-bold);
    }

    .live-typography-preview-box {
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 6px;
        padding: 16px 20px;
        color: var(--text-primary);
        overflow: hidden;
        max-height: 220px;
        overflow-y: auto;
        transition: all 0.15s ease;
    }

    .preview-paragraph {
        margin-bottom: 12px;
    }

    .preview-paragraph:last-child {
        margin-bottom: 0;
    }

    .preview-metric-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .metric-pill {
        font-size: 10px;
        font-family: var(--font-mono, monospace);
        color: var(--text-muted);
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 2px 6px;
    }

    .placeholder-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 60px 40px;
        height: 100%;
        color: var(--text-muted);
    }

    .placeholder-icon {
        font-size: 36px;
        margin-bottom: 12px;
    }

    .placeholder-section h4 {
        font-size: 15px;
        color: var(--text-primary);
        margin: 0 0 8px 0;
    }

    .placeholder-section p {
        font-size: 12px;
        max-width: 400px;
        line-height: 1.5;
        margin: 0;
    }

    .settings-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        border-top: 1px solid var(--border-subtle);
        background: var(--bg-tertiary);
        flex-shrink: 0;
    }

    .footer-hint {
        font-size: 11px;
        color: var(--text-muted);
    }

    .footer-hint kbd {
        background: var(--bg-primary);
        border: 1px solid var(--border-subtle);
        border-radius: 3px;
        padding: 1px 4px;
        font-size: 10px;
        color: var(--text-secondary);
    }

    .btn.primary {
        background: var(--accent-primary);
        color: white;
        border: none;
        border-radius: 6px;
        padding: 6px 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
    }

    .btn.primary:hover {
        background: var(--accent-hover);
    }
</style>
