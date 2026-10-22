<script lang="ts">
    import { KNOWN_FONT_FEATURES } from "@shared/domain/typography";

    interface Props {
        activeFeatures: string[];
        customFontFeaturesText: string;
        onChange: () => void;
    }

    let {
        activeFeatures = $bindable([]),
        customFontFeaturesText = $bindable(""),
        onChange,
    }: Props = $props();

    let newCustomTagInput = $state("");

    function toggleFeatureTag(tag: string) {
        if (activeFeatures.includes(tag)) {
            activeFeatures = activeFeatures.filter((t) => t !== tag);
        } else {
            activeFeatures = [...activeFeatures, tag];
        }
        onChange();
    }

    function addCustomTag() {
        const clean = newCustomTagInput
            .trim()
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 4);
        if (clean.length >= 2 && !activeFeatures.includes(clean)) {
            activeFeatures = [...activeFeatures, clean];
            newCustomTagInput = "";
            onChange();
        }
    }

    function removeFeatureTag(tag: string) {
        activeFeatures = activeFeatures.filter((t) => t !== tag);
        onChange();
    }
</script>

<section class="settings-group-card">
    <h3 class="group-title">
        OpenType Font Features (font-feature-settings)
    </h3>
    <p class="group-desc">
        Enable or configure custom OpenType typographic feature tags supported by your font.
    </p>

    <!-- Common OpenType Features -->
    <div class="setting-item">
        <div class="setting-label">Common OpenType Features</div>
        <div class="feature-chips-grid">
            {#each KNOWN_FONT_FEATURES as feat}
                {@const isEnabled = activeFeatures.includes(feat.tag)}
                <button
                    type="button"
                    class="feature-toggle-chip"
                    class:active={isEnabled}
                    onclick={() => toggleFeatureTag(feat.tag)}
                    title="{feat.tag} — {feat.description}"
                >
                    <span class="feat-tag">{feat.tag}</span>
                    <span class="feat-name">{feat.label}</span>
                    <span class="feat-indicator">
                        {#if isEnabled}
                            <i class="fa-solid fa-check"></i>
                        {:else}
                            <i class="fa-solid fa-plus"></i>
                        {/if}
                    </span>
                </button>
            {/each}
        </div>
    </div>

    <!-- Custom Features List Manager -->
    <div class="setting-item">
        <div class="setting-label">Custom OpenType Feature Tags</div>
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
                disabled={newCustomTagInput.trim().length < 2}
            >
                + Add Tag
            </button>
        </div>

        <!-- Active Features List with Remove buttons -->
        <div class="active-features-list">
            {#if activeFeatures.length === 0}
                <span class="empty-features-note">
                    No active OpenType tags (standard font rendering).
                </span>
            {:else}
                {#each activeFeatures as tag}
                    <span class="active-tag-pill">
                        <span class="pill-tag-name">"{tag}" 1</span>
                        <button
                            type="button"
                            class="btn-remove-tag"
                            onclick={() => removeFeatureTag(tag)}
                            title="Remove feature {tag}"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </span>
                {/each}
            {/if}
        </div>
    </div>

    <!-- Raw Custom Font Feature String Override -->
    <div class="setting-item">
        <label for="custom-features-raw" class="setting-label">
            Raw Custom font-feature-settings (CSS Syntax)
        </label>
        <input
            id="custom-features-raw"
            type="text"
            class="text-input"
            placeholder="e.g. 'ss01' 1, 'cv01' 2, 'zero' 1"
            bind:value={customFontFeaturesText}
            oninput={onChange}
        />
        <span class="setting-hint">
            Direct raw CSS value passed into font-feature-settings. Leaves standard tag list intact.
        </span>
    </div>
</section>
