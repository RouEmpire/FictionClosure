<script lang="ts">
    import type {
        TextAutospaceMode,
        TextJustifyMode,
        TextRenderingMode,
    } from "@shared/domain/typography";
    import FontFamilySection from "./FontFamilySection.svelte";
    import ParagraphSection from "./ParagraphSection.svelte";
    import RenderingSection from "./RenderingSection.svelte";
    import FontFeaturesSection from "./FontFeaturesSection.svelte";
    import TypographyPreview from "./TypographyPreview.svelte";
    import "./typographyFont.css";
    import "./typographyLayout.css";
    import "./typographyFeatures.css";
    import "./typographyPreview.css";

    interface Props {
        fontFamily: string;
        fontSize: number;
        fontWeight: number;
        hideMouseOnTyping: boolean;
        textRendering: TextRenderingMode;
        firstLineIndent: number;
        textJustify: TextJustifyMode;
        textAutospace: TextAutospaceMode;
        customTextAutospace: string;
        activeFeatures: string[];
        customFontFeaturesText: string;
        onChange: () => void;
    }

    let {
        fontFamily = $bindable(""),
        fontSize = $bindable(15),
        fontWeight = $bindable(400),
        hideMouseOnTyping = $bindable(true),
        textRendering = $bindable("auto"),
        firstLineIndent = $bindable(0.0),
        textJustify = $bindable("auto"),
        textAutospace = $bindable("normal"),
        customTextAutospace = $bindable(""),
        activeFeatures = $bindable([]),
        customFontFeaturesText = $bindable(""),
        onChange,
    }: Props = $props();
</script>

<div class="typography-scroll-area">
    <!-- 1. Font Family & Sizing -->
    <FontFamilySection
        bind:fontFamily
        bind:fontSize
        bind:fontWeight
        {onChange}
    />

    <!-- 2. Paragraph Alignment & Spacing -->
    <ParagraphSection
        bind:firstLineIndent
        bind:textJustify
        bind:textAutospace
        bind:customTextAutospace
        {onChange}
    />

    <!-- 3. Rendering & Interaction -->
    <RenderingSection
        bind:textRendering
        bind:hideMouseOnTyping
        {onChange}
    />

    <!-- 4. OpenType Font Features -->
    <FontFeaturesSection
        bind:activeFeatures
        bind:customFontFeaturesText
        {onChange}
    />

    <!-- 5. Interactive Typography Preview -->
    <TypographyPreview
        {fontFamily}
        {fontSize}
        {fontWeight}
        {firstLineIndent}
        {textRendering}
        {textJustify}
        {textAutospace}
        {customTextAutospace}
        {activeFeatures}
        {customFontFeaturesText}
    />
</div>
