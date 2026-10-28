<script lang="ts">
    import type { VimIndentStyle, VimSettings } from "@shared/domain/vim";
    import "./vimModeTab.css";

    interface Props {
        settings: VimSettings;
        onChange: () => void;
    }

    let { settings = $bindable(), onChange }: Props = $props();

    function handleToggleEnabled() {
        settings.enabled = !settings.enabled;
        onChange();
    }

    function handleSelectIndentStyle(style: VimIndentStyle) {
        settings.indentStyle = style;
        onChange();
    }

    function handleSelectIndentWidth(width: number) {
        settings.indentWidth = width;
        onChange();
    }
</script>

<div class="vim-settings-tab" role="region" aria-label="Vim Settings">
    <!-- Header Hero Banner -->
    <div class="vim-hero-card" class:active={settings.enabled}>
        <div class="hero-left">
            <div class="hero-icon-box">
                <i class="fa-brands fa-vim"></i>
            </div>
            <div class="hero-text">
                <h3 class="hero-title">Vim Modal Editing</h3>
                <p class="hero-desc">
                    Keyboard-centric modal text editing powered by <code class="pkg-tag">@vimee/core</code> &amp;
                    <code class="pkg-tag">@vimee/plugin-textarea</code>.
                </p>
            </div>
        </div>
        <div class="hero-toggle-area">
            <button
                type="button"
                class="btn-vim-toggle"
                class:active={settings.enabled}
                onclick={handleToggleEnabled}
                aria-pressed={settings.enabled}
                aria-label="Toggle Vim Mode"
            >
                <span class="toggle-slider"></span>
            </button>
            <span class="toggle-label" class:text-green={settings.enabled}>
                {settings.enabled ? "Enabled" : "Disabled"}
            </span>
        </div>
    </div>

    {#if settings.enabled}
        <!-- Indent Style & Formatting -->
        <div class="setting-group-card">
            <div class="group-header">
                <div class="group-title-row">
                    <i class="fa-solid fa-indent group-icon"></i>
                    <span class="group-title">Indentation &amp; Tabs</span>
                </div>
                <span class="group-desc">
                    Configure indent character and width for vim operator shifts (<code>&gt;</code> and <code>&lt;</code>) and newlines.
                </span>
            </div>

            <div class="setting-row">
                <div class="row-label-col">
                    <span class="row-label">Indent Style</span>
                    <span class="row-hint">Use soft spaces or native tab characters</span>
                </div>
                <div class="segmented-control" role="radiogroup" aria-label="Indent Style">
                    <button
                        type="button"
                        class="segment-btn"
                        class:selected={settings.indentStyle === "space"}
                        onclick={() => handleSelectIndentStyle("space")}
                        role="radio"
                        aria-checked={settings.indentStyle === "space"}
                    >
                        <i class="fa-solid fa-ellipsis"></i>
                        <span>Spaces</span>
                    </button>
                    <button
                        type="button"
                        class="segment-btn"
                        class:selected={settings.indentStyle === "tab"}
                        onclick={() => handleSelectIndentStyle("tab")}
                        role="radio"
                        aria-checked={settings.indentStyle === "tab"}
                    >
                        <i class="fa-solid fa-arrow-right-to-bracket"></i>
                        <span>Tabs</span>
                    </button>
                </div>
            </div>

            {#if settings.indentStyle === "space"}
                <div class="setting-row">
                    <div class="row-label-col">
                        <span class="row-label">Indent Width</span>
                        <span class="row-hint">Number of spaces per indentation level</span>
                    </div>
                    <div class="button-pills" role="radiogroup" aria-label="Indent Width">
                        {#each [2, 4, 8] as width}
                            <button
                                type="button"
                                class="pill-btn"
                                class:selected={settings.indentWidth === width}
                                onclick={() => handleSelectIndentWidth(width)}
                                role="radio"
                                aria-checked={settings.indentWidth === width}
                            >
                                {width} Spaces
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>

        <!-- Integrated Commands Feature Info -->
        <div class="setting-group-card">
            <div class="group-header">
                <div class="group-title-row">
                    <i class="fa-solid fa-circle-check group-icon text-accent"></i>
                    <span class="group-title">FictionClosure Integrations</span>
                </div>
                <span class="group-desc">
                    Vim keybinding integrations with the desktop workspace.
                </span>
            </div>

            <div class="feature-bullets">
                <div class="feature-item">
                    <div class="feature-badge">
                        <code>:w</code>
                    </div>
                    <div class="feature-text">
                        <strong>Project Save:</strong> Executing <code>:w</code> or <code>:wq</code> in Command mode automatically triggers workspace document saving to disk.
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-badge">
                        <code>y</code> / <code>yy</code>
                    </div>
                    <div class="feature-text">
                        <strong>System Clipboard Yank:</strong> Yanking text in Normal or Visual mode automatically synchronizes the copied manuscript text into your operating system clipboard.
                    </div>
                </div>

                <div class="feature-item">
                    <div class="feature-badge">
                        <code>Esc</code>
                    </div>
                    <div class="feature-text">
                        <strong>Modal Switching:</strong> Pressing <code>Esc</code> transitions from Insert/Visual mode back to Normal mode without accidentally exiting Zen or split views.
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Reference Guide for Writers -->
        <div class="quick-reference-card">
            <span class="ref-title">Common Writing Motions</span>
            <div class="ref-grid">
                <div class="ref-col">
                    <span class="ref-col-head">Navigation</span>
                    <div class="ref-item"><code>h j k l</code> <span>Left, down, up, right</span></div>
                    <div class="ref-item"><code>w / b</code> <span>Jump forward / back word</span></div>
                    <div class="ref-item"><code>0 / $</code> <span>Jump to start / end of line</span></div>
                    <div class="ref-item"><code>gg / G</code> <span>Jump to manuscript top / bottom</span></div>
                </div>
                <div class="ref-col">
                    <span class="ref-col-head">Editing &amp; Revisions</span>
                    <div class="ref-item"><code>i / a</code> <span>Insert before / append after</span></div>
                    <div class="ref-item"><code>o / O</code> <span>Open new line below / above</span></div>
                    <div class="ref-item"><code>dd / yy</code> <span>Delete / yank whole line</span></div>
                    <div class="ref-item"><code>u / Ctrl+R</code> <span>Undo / redo manuscript change</span></div>
                </div>
            </div>
        </div>
    {:else}
        <div class="disabled-placeholder-card">
            <i class="fa-solid fa-keyboard placeholder-icon"></i>
            <span class="placeholder-title">Vim Mode is Currently Disabled</span>
            <span class="placeholder-desc">
                Enable the toggle above to write novels using traditional Vi/Vim normal, insert, visual, and command-line modes.
            </span>
        </div>
    {/if}
</div>
