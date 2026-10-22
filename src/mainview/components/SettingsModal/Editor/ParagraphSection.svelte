<script lang="ts">
    import type { TextAutospaceMode, TextJustifyMode } from "@shared/domain/typography";
    import { TEXT_JUSTIFY_OPTIONS, TEXT_AUTOSPACE_OPTIONS } from "../settingsConstants";

    interface Props {
        firstLineIndent: number;
        textJustify: TextJustifyMode;
        textAutospace: TextAutospaceMode;
        customTextAutospace: string;
        onChange: () => void;
    }

    let {
        firstLineIndent = $bindable(0.0),
        textJustify = $bindable("auto"),
        textAutospace = $bindable("normal"),
        customTextAutospace = $bindable(""),
        onChange,
    }: Props = $props();
</script>

<section class="settings-group-card">
    <h3 class="group-title">Paragraph Alignment & Spacing</h3>
    <p class="group-desc">
        Adjust book-grade indentation, justification algorithms, and East Asian typography.
    </p>

    <!-- First Line Indent (Slider 0.0% to 10.0%) -->
    <div class="setting-item">
        <div class="label-with-value">
            <label for="first-line-indent-slider" class="setting-label">
                First Line Indent
            </label>
            <div class="value-badge-group">
                <span class="value-badge">{firstLineIndent.toFixed(1)}%</span>
                {#if firstLineIndent > 0}
                    <button
                        type="button"
                        class="btn-text-action"
                        onclick={() => {
                            firstLineIndent = 0.0;
                            onChange();
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
                oninput={onChange}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={firstLineIndent}
                aria-valuetext="{firstLineIndent.toFixed(1)} percent"
            />
            <span class="slider-max">10%</span>
        </div>
        <span class="setting-hint">
            Indents the first line of each paragraph, following traditional fiction and book typesetting standards.
        </span>
    </div>

    <div class="row-1col">
        <!-- Text Justify -->
        <div class="setting-item">
            <label for="text-justify-select" class="setting-label">Text Justify</label>
            <select
                id="text-justify-select"
                class="select-dropdown"
                bind:value={textJustify}
                onchange={onChange}
            >
                {#each TEXT_JUSTIFY_OPTIONS as opt}
                    <option value={opt.value}>{opt.label} — {opt.desc}</option>
                {/each}
            </select>
            <span class="setting-hint">
                Controls how spacing expands across lines when text is justified.
            </span>
        </div>

        <!-- Text Autospace (Asian Autospace) -->
        <div class="setting-item">
            <label for="text-autospace-select" class="setting-label">
                Asian Autospace (text-autospace)
            </label>
            <select
                id="text-autospace-select"
                class="select-dropdown"
                bind:value={textAutospace}
                onchange={onChange}
            >
                {#each TEXT_AUTOSPACE_OPTIONS as opt}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
            <span class="setting-hint">
                {TEXT_AUTOSPACE_OPTIONS.find((o) => o.value === textAutospace)?.desc ||
                    "Controls automated ideographic character spacing"}
            </span>

            {#if textAutospace === "CUSTOM"}
                <div class="custom-autospace-input-box">
                    <input
                        type="text"
                        class="text-input"
                        placeholder="e.g. ideograph-alpha ideograph-numeric"
                        bind:value={customTextAutospace}
                        oninput={onChange}
                    />
                    <span class="field-subnote">
                        Enter custom CSS Text 4 autospace tokens separated by spaces.
                    </span>
                </div>
            {/if}
        </div>
    </div>
</section>
