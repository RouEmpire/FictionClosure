/**
 * FictionClosure — Zed Theme Integration & CSS Variable Mapping.
 *
 * Implements the Zed Theme Specification (v0.1.0) and provides converters
 * that bridge Zed color definitions to FictionClosure semantic design tokens.
 */

export type ZedThemeAppearance = "dark" | "light";

export interface ZedSyntaxRule {
    color?: string | null;
    font_style?: "italic" | "normal" | null;
    font_weight?: number | null;
}

export type ZedSyntaxStyle = Record<string, ZedSyntaxRule | string | null>;

export interface ZedPlayerColor {
    selection?: string | null;
    cursor?: string | null;
    highlight?: string | null;
}

export interface ZedThemeStyle {
    [key: string]: unknown;
    syntax?: ZedSyntaxStyle;
    players?: ZedPlayerColor[];
    accents?: string[];
}

export interface ZedThemeDefinition {
    name: string;
    appearance: ZedThemeAppearance;
    style: ZedThemeStyle;
}

export interface ZedThemePackage {
    $schema?: string;
    name: string;
    author?: string;
    themes: ZedThemeDefinition[];
}

export interface BundledThemeEntry {
    id: string;
    name: string;
    packageName: string;
    appearance: ZedThemeAppearance;
    theme: ZedThemeDefinition;
}

/**
 * Creates a clean URL- and CSS-safe slug identifier from a theme name.
 */
export function slugifyThemeId(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes a Zed property key into a standard CSS variable name with `--theme-` prefix.
 * Replaces dots and underscores with single dashes.
 * Example: "surface.background" -> "--theme-surface-background"
 */
export function normalizeThemeKeyToCssVar(key: string): string {
    const sanitized = key
        .trim()
        .toLowerCase()
        .replace(/[._]+/g, "-");
    return `--theme-${sanitized}`;
}

/**
 * Converts a Zed theme `style` object into a flat dictionary of CSS custom property names and values.
 */
export function convertZedStyleToCssVariables(style: ZedThemeStyle): Record<string, string> {
    const vars: Record<string, string> = {};

    for (const [key, val] of Object.entries(style)) {
        if (key === "syntax" || key === "players" || key === "accents" || key === "background.appearance") {
            continue;
        }

        if (typeof val === "string" && val.trim().length > 0) {
            vars[normalizeThemeKeyToCssVar(key)] = val.trim();
        }
    }

    // Players selection and cursor highlight
    if (Array.isArray(style.players) && style.players[0]) {
        const p = style.players[0];
        if (typeof p.selection === "string" && p.selection.trim().length > 0) {
            vars["--theme-selection-background"] = p.selection.trim();
        }
        if (typeof p.cursor === "string" && p.cursor.trim().length > 0) {
            vars["--theme-editor-cursor"] = p.cursor.trim();
        }
    }

    // Accents array fallback
    if (Array.isArray(style.accents)) {
        style.accents.forEach((accent, idx) => {
            if (typeof accent === "string" && accent.trim().length > 0) {
                vars[`--theme-accent-${idx + 1}`] = accent.trim();
            }
        });
    }

    // Markdown & Prose Syntax Highlighting
    if (style.syntax && typeof style.syntax === "object") {
        for (const [syntaxKey, rule] of Object.entries(style.syntax)) {
            const cssPrefix = normalizeThemeKeyToCssVar(`syntax.${syntaxKey}`);

            if (typeof rule === "string" && rule.trim().length > 0) {
                vars[cssPrefix] = rule.trim();
            } else if (rule && typeof rule === "object") {
                if (typeof rule.color === "string" && rule.color.trim().length > 0) {
                    vars[cssPrefix] = rule.color.trim();
                }
                if (typeof rule.font_style === "string" && rule.font_style.trim().length > 0) {
                    vars[`${cssPrefix}-font-style`] = rule.font_style.trim();
                }
                if (typeof rule.font_weight === "number" || typeof rule.font_weight === "string") {
                    vars[`${cssPrefix}-font-weight`] = String(rule.font_weight).trim();
                }
            }
        }
    }

    return vars;
}

/**
 * Generates a valid CSS stylesheet rule string applying the theme under a selector.
 * Example: `generateThemeCssRule('[data-theme="catppuccin-mocha"]', theme)`
 */
export function generateThemeCssRule(selector: string, theme: ZedThemeDefinition): string {
    const cssVars = convertZedStyleToCssVariables(theme.style);
    const declarations = Object.entries(cssVars)
        .map(([prop, value]) => `    ${prop}: ${value};`)
        .join("\n");

    return `${selector} {\n${declarations}\n}`;
}
