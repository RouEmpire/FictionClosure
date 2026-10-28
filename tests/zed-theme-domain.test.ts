import { describe, expect, it, beforeEach } from "bun:test";
import {
    slugifyThemeId,
    normalizeThemeKeyToCssVar,
    convertZedStyleToCssVariables,
    generateThemeCssRule,
    type ZedThemeDefinition,
    type ZedThemeStyle,
} from "../src/shared/domain/theme";
import {
    BUNDLED_THEME_PACKAGES,
    BUNDLED_THEMES,
    findBundledTheme,
    generateAllBundledThemesCss,
    ensureBundledThemesRegisteredInDom,
} from "../src/shared/domain/bundledThemes";

describe("Zed Themes Domain & Bundled Themes Integration", () => {
    describe("Bundled Theme Packages Parsing", () => {
        it("includes all 9 expected Zed theme packages from src/media/theme", () => {
            expect(BUNDLED_THEME_PACKAGES.length).toBe(9);
            const packageNames = BUNDLED_THEME_PACKAGES.map((p) => p.name);
            expect(packageNames).toContain("Catppuccin");
            expect(packageNames).toContain("DarkBlur one");
            expect(packageNames).toContain("Dracula Refined");
            expect(packageNames).toContain("Industrional");
            expect(packageNames).toContain("Monokai Night Fix");
            expect(packageNames).toContain("One Monokai Pro");
            expect(packageNames).toContain("Radiant");
            expect(packageNames).toContain("Vampire");
            expect(packageNames).toContain("Void");
        });

        it("parses all 18 subthemes with valid structure and appearance", () => {
            expect(BUNDLED_THEMES.length).toBe(18);

            for (const themeEntry of BUNDLED_THEMES) {
                expect(themeEntry.id.length).toBeGreaterThan(0);
                expect(themeEntry.name.length).toBeGreaterThan(0);
                expect(themeEntry.packageName.length).toBeGreaterThan(0);
                expect(["dark", "light"]).toContain(themeEntry.appearance);
                expect(typeof themeEntry.theme.style).toBe("object");
            }
        });

        it("includes both dark and light variants among bundled themes", () => {
            const lightThemes = BUNDLED_THEMES.filter((t) => t.appearance === "light");
            const darkThemes = BUNDLED_THEMES.filter((t) => t.appearance === "dark");

            expect(lightThemes.length).toBeGreaterThanOrEqual(2); // e.g. Catppuccin Latte, Monokai Night Soft
            expect(darkThemes.length).toBeGreaterThanOrEqual(10);
        });

        it("locates bundled themes by name or slug ID", () => {
            const mocha = findBundledTheme("Catppuccin Mocha");
            expect(mocha).not.toBeNull();
            expect(mocha?.packageName).toBe("Catppuccin");
            expect(mocha?.appearance).toBe("dark");

            const radiantBySlug = findBundledTheme("radiant");
            expect(radiantBySlug).not.toBeNull();
            expect(radiantBySlug?.name).toBe("Radiant");

            const dracula = findBundledTheme("dracula-refined");
            expect(dracula).not.toBeNull();
            expect(dracula?.packageName).toBe("Dracula Refined");

            expect(findBundledTheme("non-existent-theme-xyz")).toBeNull();
        });
    });

    describe("CSS Variable Key Normalization", () => {
        it("normalizes dot and underscore keys to standard --theme- prefixes", () => {
            expect(normalizeThemeKeyToCssVar("background")).toBe("--theme-background");
            expect(normalizeThemeKeyToCssVar("surface.background")).toBe("--theme-surface-background");
            expect(normalizeThemeKeyToCssVar("elevated_surface.background")).toBe("--theme-elevated-surface-background");
            expect(normalizeThemeKeyToCssVar("editor.active_line.background")).toBe("--theme-editor-active-line-background");
            expect(normalizeThemeKeyToCssVar("status_bar.background")).toBe("--theme-status-bar-background");
            expect(normalizeThemeKeyToCssVar("title_bar.background")).toBe("--theme-title-bar-background");
            expect(normalizeThemeKeyToCssVar("syntax.emphasis.strong")).toBe("--theme-syntax-emphasis-strong");
        });

        it("creates URL- and DOM-safe slug IDs", () => {
            expect(slugifyThemeId("Catppuccin Mocha")).toBe("catppuccin-mocha");
            expect(slugifyThemeId("DarkBlur one")).toBe("darkblur-one");
            expect(slugifyThemeId("Dracula Refined (Dark)")).toBe("dracula-refined-dark");
        });
    });

    describe("convertZedStyleToCssVariables", () => {
        it("extracts core UI surfaces, borders, text, and status bar colors", () => {
            const mockStyle: ZedThemeStyle = {
                background: "#0d1117",
                "surface.background": "#161b22",
                "elevated_surface.background": "#1f242c",
                border: "#2b323c",
                "border.focused": "#58a6ff",
                text: "#f0f3f6",
                "text.muted": "#8b949e",
                "status_bar.background": "#161b22",
                "title_bar.background": "#161b22",
                "editor.background": "#0d1117",
                "editor.foreground": "#f0f3f6",
                "editor.gutter.background": "#0d1117",
                "editor.line_number": "#484f58",
                "editor.active_line_number": "#f0f3f6",
                "editor.active_line.background": "#161b22",
            };

            const vars = convertZedStyleToCssVariables(mockStyle);

            expect(vars["--theme-background"]).toBe("#0d1117");
            expect(vars["--theme-surface-background"]).toBe("#161b22");
            expect(vars["--theme-elevated-surface-background"]).toBe("#1f242c");
            expect(vars["--theme-border"]).toBe("#2b323c");
            expect(vars["--theme-border-focused"]).toBe("#58a6ff");
            expect(vars["--theme-text"]).toBe("#f0f3f6");
            expect(vars["--theme-text-muted"]).toBe("#8b949e");
            expect(vars["--theme-status-bar-background"]).toBe("#161b22");
            expect(vars["--theme-title-bar-background"]).toBe("#161b22");
            expect(vars["--theme-editor-background"]).toBe("#0d1117");
            expect(vars["--theme-editor-foreground"]).toBe("#f0f3f6");
            expect(vars["--theme-editor-gutter-background"]).toBe("#0d1117");
            expect(vars["--theme-editor-line-number"]).toBe("#484f58");
            expect(vars["--theme-editor-active-line-number"]).toBe("#f0f3f6");
            expect(vars["--theme-editor-active-line-background"]).toBe("#161b22");
        });

        it("converts player selection and accents", () => {
            const mockStyle: ZedThemeStyle = {
                players: [{ selection: "rgba(88, 166, 255, 0.3)", cursor: "#58a6ff" }],
                accents: ["#e69d45", "#58a6ff"],
            };

            const vars = convertZedStyleToCssVariables(mockStyle);
            expect(vars["--theme-selection-background"]).toBe("rgba(88, 166, 255, 0.3)");
            expect(vars["--theme-editor-cursor"]).toBe("#58a6ff");
            expect(vars["--theme-accent-1"]).toBe("#e69d45");
            expect(vars["--theme-accent-2"]).toBe("#58a6ff");
        });

        it("converts prose and markdown syntax tokens", () => {
            const mockStyle: ZedThemeStyle = {
                syntax: {
                    title: { color: "#e69d45", font_weight: 700 },
                    emphasis: { color: "#58a6ff", font_style: "italic" },
                    "emphasis.strong": { color: "#ffffff", font_weight: 700 },
                    comment: { color: "#6b7582", font_style: "italic" },
                    string: { color: "#7ee787" },
                    keyword: { color: "#ff7b72" },
                },
            };

            const vars = convertZedStyleToCssVariables(mockStyle);
            expect(vars["--theme-syntax-title"]).toBe("#e69d45");
            expect(vars["--theme-syntax-title-font-weight"]).toBe("700");
            expect(vars["--theme-syntax-emphasis"]).toBe("#58a6ff");
            expect(vars["--theme-syntax-emphasis-font-style"]).toBe("italic");
            expect(vars["--theme-syntax-emphasis-strong"]).toBe("#ffffff");
            expect(vars["--theme-syntax-comment"]).toBe("#6b7582");
            expect(vars["--theme-syntax-string"]).toBe("#7ee787");
            expect(vars["--theme-syntax-keyword"]).toBe("#ff7b72");
        });

        it("supports future feature styles (terminal, minimap, diff conflict)", () => {
            const mockStyle: ZedThemeStyle = {
                "terminal.background": "#1e1e2e",
                "terminal.foreground": "#cdd6f4",
                "minimap.thumb.background": "#585b70",
                conflict: "#f38ba8",
                "drop_target.background": "#45475a",
            };

            const vars = convertZedStyleToCssVariables(mockStyle);
            expect(vars["--theme-terminal-background"]).toBe("#1e1e2e");
            expect(vars["--theme-terminal-foreground"]).toBe("#cdd6f4");
            expect(vars["--theme-minimap-thumb-background"]).toBe("#585b70");
            expect(vars["--theme-conflict"]).toBe("#f38ba8");
            expect(vars["--theme-drop-target-background"]).toBe("#45475a");
        });
    });

    describe("CSS Generation and DOM Injection", () => {
        it("generates a valid CSS rule block for a theme", () => {
            const radiant = findBundledTheme("radiant");
            expect(radiant).not.toBeNull();

            const css = generateThemeCssRule('[data-theme="radiant"]', radiant!.theme);
            expect(css).toContain('[data-theme="radiant"] {');
            expect(css).toContain("--theme-background: #1d2433;");
            expect(css).toContain("--theme-surface-background: #171c28;");
            expect(css).toContain("}");
        });

        it("generates combined CSS for all bundled themes", () => {
            const combinedCss = generateAllBundledThemesCss();
            expect(combinedCss).toContain('[data-theme="catppuccin-latte"]');
            expect(combinedCss).toContain('[data-theme="catppuccin-mocha"]');
            expect(combinedCss).toContain('[data-theme="dracula-refined"]');
            expect(combinedCss).toContain('[data-theme="radiant"]');
            expect(combinedCss).toContain('[data-theme="one-monokai-pro"]');
        });

        it("safely injects stylesheet into document head without duplication", () => {
            const mockElements: Record<string, { id: string; textContent: string }> = {};
            const appendedChildren: unknown[] = [];

            globalThis.document = {
                getElementById: (id: string) => mockElements[id] ?? null,
                createElement: (tagName: string) => {
                    const el = { id: "", textContent: "", tagName };
                    return el as unknown as HTMLElement;
                },
                head: {
                    appendChild: (node: unknown) => {
                        const el = node as { id: string; textContent: string };
                        mockElements[el.id] = el;
                        appendedChildren.push(el);
                        return el;
                    },
                },
            } as unknown as Document;

            ensureBundledThemesRegisteredInDom();
            expect(appendedChildren.length).toBe(1);

            // Calling again should not re-inject
            ensureBundledThemesRegisteredInDom();
            expect(appendedChildren.length).toBe(1);
        });
    });
});
