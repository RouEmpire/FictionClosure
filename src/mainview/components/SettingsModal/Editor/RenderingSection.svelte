<script lang="ts">
    import type { TextRenderingMode } from "@shared/domain/typography";
    import { TEXT_RENDERING_OPTIONS } from "../settingsConstants";

    interface Props {
        textRendering: TextRenderingMode;
        hideMouseOnTyping: boolean;
        onChange: () => void;
    }

    let {
        textRendering = $bindable("auto"),
        hideMouseOnTyping = $bindable(true),
        onChange,
    }: Props = $props();
</script>

<section class="settings-group-card">
    <h3 class="group-title">Rendering & Interaction</h3>
    <p class="group-desc">
        Engine-level glyph rasterization options and cursor visibility preferences.
    </p>

    <div class="setting-item">
        <span class="setting-label">Text Rendering (text-rendering)</span>
        <div class="rendering-options-grid">
            {#each TEXT_RENDERING_OPTIONS as rOpt}
                {@const isSelected = textRendering === rOpt.value}
                <button
                    type="button"
                    class="rendering-card"
                    class:active={isSelected}
                    onclick={() => {
                        textRendering = rOpt.value;
                        onChange();
                    }}
                >
                    <span class="rendering-title">{rOpt.label}</span>
                    <span class="rendering-desc">{rOpt.desc}</span>
                </button>
            {/each}
        </div>
    </div>

    <!-- Hide mouse on typing -->
    <div class="setting-item">
        <div class="toggle-row">
            <div class="toggle-text-block">
                <span class="setting-label">Hide Mouse on Typing</span>
                <span class="setting-hint">
                    Automatically hides the mouse pointer while typing in the editor, and unhides it immediately upon mouse motion.
                </span>
            </div>
            <label class="switch-toggle" for="hide-mouse-toggle">
                <input
                    id="hide-mouse-toggle"
                    type="checkbox"
                    bind:checked={hideMouseOnTyping}
                    onchange={onChange}
                />
                <span class="toggle-slider"></span>
            </label>
        </div>

        <!-- Wayland Notice Card -->
        <div class="wayland-notice-card">
            <span class="notice-icon">
                <i class="fa-brands fa-linux"></i>
            </span>
            <div class="notice-text">
                <strong>Linux / Wayland Notice:</strong>
                <span>
                    On some Wayland compositors (GNOME Mutter, KWin, Sway), mouse pointer hiding during typing may only take visual effect when the mouse moves by 1px due to how compositor cursor frame buffers refresh.
                </span>
            </div>
        </div>
    </div>
</section>
