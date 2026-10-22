<script lang="ts">
    import {
        computeLineHeight,
        formatFontFeatureSettings,
        formatTextAutospace,
        type TextAutospaceMode,
        type TextJustifyMode,
        type TextRenderingMode,
    } from "@shared/domain/typography";

    interface Props {
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        firstLineIndent: number;
        textRendering: TextRenderingMode;
        textJustify: TextJustifyMode;
        textAutospace: TextAutospaceMode;
        customTextAutospace: string;
        activeFeatures: string[];
        customFontFeaturesText: string;
    }

    let {
        fontFamily,
        fontSize,
        fontWeight,
        firstLineIndent,
        textRendering,
        textJustify,
        textAutospace,
        customTextAutospace,
        activeFeatures,
        customFontFeaturesText,
    }: Props = $props();

    const previewLineHeight = $derived(computeLineHeight(fontSize));
    const previewFontFeatures = $derived(
        formatFontFeatureSettings(activeFeatures, customFontFeaturesText),
    );
    const previewAutospace = $derived(
        formatTextAutospace(textAutospace, customTextAutospace),
    );
</script>

<section class="settings-group-card preview-card">
    <div class="setting-label">Interactive Typography Preview</div>
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
            The tide receded from Ash Harbor, leaving the cold silt bare under the
            twin moons. Elena checked the bronze needle of her magnetic quadrant (0 vs O)
            — 1/2 of the expedition was already lost, yet the signal arrows -> resonated
            != true.
        </div>
        <div class="preview-paragraph">
            第三章 — 港の沈黙 (Chapter 3: Silence in the Port). Elena found 42 relics buried
            in ancient chambers, proving the Cartographers were here before the Great
            Collapse.
        </div>
    </div>
    <div class="preview-metric-pills">
        <span class="metric-pill">Size: {fontSize}px</span>
        <span class="metric-pill">Line Height: {previewLineHeight}px</span>
        <span class="metric-pill">Weight: {fontWeight}</span>
        <span class="metric-pill">Indent: {firstLineIndent.toFixed(1)}%</span>
        <span class="metric-pill">Rendering: {textRendering}</span>
        <span class="metric-pill">Justify: {textJustify}</span>
        <span class="metric-pill">Asian Autospace: {textAutospace}</span>
    </div>
</section>
