import type {
    TextAutospaceMode,
    TextJustifyMode,
    TextRenderingMode,
} from "@shared/domain/typography";

export type SettingsTabId =
    | "editor"
    | "appearance"
    | "persistence"
    | "keybindings"
    | "vim-mode"
    | "git-integration"
    | "custom-extension"
    | "language";

export interface SettingsTabItem {
    id: SettingsTabId;
    label: string;
    icon: string;
    isTodo?: boolean;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
    { id: "editor", label: "Editor & Typography", icon: "fa-solid fa-pen-nib" },
    { id: "appearance", label: "Themes & Appearance", icon: "fa-solid fa-palette" },
    { id: "persistence", label: "Storage & Auto-Save", icon: "fa-solid fa-floppy-disk" },
    { id: "keybindings", label: "Keybindings", icon: "fa-solid fa-keyboard", isTodo: true },
    { id: "vim-mode", label: "Vim Mode", icon: "fa-brands fa-vim" },
    { id: "git-integration", label: "Git Integration", icon: "fa-brands fa-git-alt", isTodo: true },
    { id: "custom-extension", label: "Extension", icon: "fa-solid fa-oil-well", isTodo: true },
    { id: "language", label: "Language", icon: "fa-solid fa-language", isTodo: true },
];

export interface PlaceholderTabInfo {
    icon: string;
    title: string;
    description: string;
}

export const PLACEHOLDER_TAB_CONTENT: Record<string, PlaceholderTabInfo> = {
    appearance: {
        icon: "fa-solid fa-palette",
        title: "Appearance & Themes (TODO)",
        description:
            "Planned for future update: Zed theme compatibility, customizable light/dark themes, accent colors, and custom editor margins.",
    },
    persistence: {
        icon: "fa-solid fa-floppy-disk",
        title: "Storage & Backups (TODO)",
        description:
            "Planned for future update: Auto-save interval frequency, automatic manuscript snapshots, Git auto-commit hooks, and backup zip archives.",
    },
    keybindings: {
        icon: "fa-solid fa-keyboard",
        title: "Keybindings (TODO)",
        description:
            "Planned for future update: Configurable keyboard shortcuts and keyboard navigation",
    },
    "vim-mode": {
        icon: "fa-solid fa-keyboard",
        title: "Vim (TODO)",
        description:
            "Planned for future update: Configurable Vim mode, Vim navigation and Emacs key bindings.",
    },
    "git-integration": {
        icon: "fa-brands fa-git-alt",
        title: "Git (TODO)",
        description:
            "Planned for future update: Configurable Vim mode, Vim navigation and Emacs key bindings.",
    },
    "custom-extension": {
        icon: "fa-solid fa-oil-well",
        title: "Extensions (TODO)",
        description:
            "Planned for future update: Plugin and extension ecosystem integration.",
    },
    language: {
        icon: "fa-solid fa-language",
        title: "Language & Localization (TODO)",
        description:
            "Planned for future update: Multi-language UI, custom dictionaries, and translation tools.",
    },
};

export const FONT_PRESETS = [
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

export const FONT_WEIGHTS = [
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

export const TEXT_RENDERING_OPTIONS: {
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

export const TEXT_JUSTIFY_OPTIONS: {
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

export const TEXT_AUTOSPACE_OPTIONS: {
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
