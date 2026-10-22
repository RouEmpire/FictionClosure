<script lang="ts">
    import {
        DEFAULT_TYPOGRAPHY_SETTINGS,
        clampFirstLineIndent,
        clampFontSize,
        clampFontWeight,
        type EditorTypographySettings,
        type TextAutospaceMode,
        type TextJustifyMode,
        type TextRenderingMode,
    } from "@shared/domain/typography";
    import SettingsHeader from "./SettingsHeader.svelte";
    import SettingsNav from "./SettingsNav.svelte";
    import SettingsFooter from "./SettingsFooter.svelte";
    import PlaceholderTab from "./PlaceholderTab.svelte";
    import EditorTab from "./Editor/EditorTab.svelte";
    import type { SettingsTabId } from "./settingsConstants";
    import "./settingsModal.css";

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

    let activeTab = $state<SettingsTabId>("editor");

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

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    }
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
            <SettingsHeader {onClose} />

            <div class="settings-content">
                <SettingsNav
                    {activeTab}
                    onSelectTab={(tab) => (activeTab = tab)}
                />

                <div class="settings-panel">
                    {#if activeTab === "editor"}
                        <EditorTab
                            bind:fontFamily
                            bind:fontSize
                            bind:fontWeight
                            bind:hideMouseOnTyping
                            bind:textRendering
                            bind:firstLineIndent
                            bind:textJustify
                            bind:textAutospace
                            bind:customTextAutospace
                            bind:activeFeatures
                            bind:customFontFeaturesText
                            onChange={emitChange}
                        />
                    {:else}
                        <PlaceholderTab tab={activeTab} />
                    {/if}
                </div>
            </div>

            <SettingsFooter {onClose} />
        </div>
    </div>
{/if}
