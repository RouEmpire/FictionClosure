import { describe, expect, it, beforeEach } from "bun:test";
import {
    parseCustomThemeJson,
    extractThemePalette,
    loadCustomThemes,
    saveCustomThemes,
    loadActiveThemeId,
    saveActiveThemeId,
    applyActiveTheme,
    getAllThemes,
    DEFAULT_THEME_ID,
    LOCAL_STORAGE_CUSTOM_THEMES_KEY,
    LOCAL_STORAGE_ACTIVE_THEME_KEY,
    ACTIVE_THEME_STYLE_ID,
    type CustomThemeEntry,
} from "../src/shared/domain/customThemes";
import type { ZedThemeDefinition } from "../src/shared/domain/theme";

describe("Custom Themes Subsystem", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        mockStorage = {};
        globalThis.localStorage = {
            getItem: (key: string) => mockStorage[key] ?? null,
            setItem: (key: string, value: string) => {
                mockStorage[key] = value;
            },
            removeItem: (key: string) => {
                delete mockStorage[key];
            },
            clear: () => {
                mockStorage = {};
            },
            key: () => null,
            length: 0,
        };
    });

    describe("Theme Palette Extraction", () => {
        it("extracts 5-color swatch palette from dark theme", () => {
            const theme: ZedThemeDefinition = {
                name: "Cyber Novelist",
                appearance: "dark",
                style: {
                    background: "#0a0c10",
                    "surface.background": "#141720",
                    border: "#282e40",
                    accents: ["#00ffcc"],
                    text: "#e6edf3",
                },
            };

            const palette = extractThemePalette(theme);
            expect(palette.background).toBe("#0a0c10");
            expect(palette.surface).toBe("#141720");
            expect(palette.border).toBe("#282e40");
            expect(palette.accent).toBe("#00ffcc");
            expect(palette.text).toBe("#e6edf3");
        });

        it("falls back gracefully when optional colors are missing", () => {
            const theme: ZedThemeDefinition = {
                name: "Minimalist",
                appearance: "light",
                style: {},
            };

            const palette = extractThemePalette(theme);
            expect(palette.background).toBe("#ffffff");
            expect(palette.surface).toBe("#ffffff");
            expect(palette.border).toBe("#d0d7de");
            expect(palette.text).toBe("#1f2328");
        });
    });

    describe("parseCustomThemeJson", () => {
        it("parses multi-theme package JSON file from zen-themes.com", () => {
            const raw = JSON.stringify({
                $schema: "https://zed.dev/schema/themes/v0.1.0.json",
                name: "Nord Pro",
                author: "Community Author",
                themes: [
                    {
                        name: "Nord Dark",
                        appearance: "dark",
                        style: {
                            background: "#2e3440",
                            "surface.background": "#3b4252",
                            text: "#eceff4",
                        },
                    },
                    {
                        name: "Nord Light",
                        appearance: "light",
                        style: {
                            background: "#eceff4",
                            "surface.background": "#e5e9f0",
                            text: "#2e3440",
                        },
                    },
                ],
            });

            const res = parseCustomThemeJson(raw);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.packageName).toBe("Nord Pro");
                expect(res.themes.length).toBe(2);
                expect(res.themes[0].name).toBe("Nord Dark");
                expect(res.themes[0].appearance).toBe("dark");
                expect(res.themes[0].id).toContain("custom-nord-dark");
                expect(res.themes[1].name).toBe("Nord Light");
                expect(res.themes[1].appearance).toBe("light");
                expect(res.themes[1].isCustom).toBe(true);
            }
        });

        it("parses single theme definition JSON file", () => {
            const raw = JSON.stringify({
                name: "Gruvbox Material",
                appearance: "dark",
                style: {
                    background: "#282828",
                    text: "#ebdbb2",
                },
            });

            const res = parseCustomThemeJson(raw);
            expect(res.success).toBe(true);
            if (res.success) {
                expect(res.themes.length).toBe(1);
                expect(res.themes[0].name).toBe("Gruvbox Material");
                expect(res.themes[0].id).toBe("custom-gruvbox-material");
                expect(res.themes[0].appearance).toBe("dark");
            }
        });

        it("fails cleanly on malformed JSON", () => {
            const res = parseCustomThemeJson("{ broken json !!!");
            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.error).toContain("Malformed JSON");
            }
        });

        it("fails cleanly when themes or style are missing", () => {
            const res = parseCustomThemeJson(JSON.stringify({ name: "Empty Theme", foo: "bar" }));
            expect(res.success).toBe(false);
            if (!res.success) {
                expect(res.error).toContain("No valid theme definitions found");
            }
        });
    });

    describe("Persistence", () => {
        it("saves and loads custom installed themes", () => {
            const custom: CustomThemeEntry[] = [
                {
                    id: "custom-test-theme",
                    name: "Test Theme",
                    packageName: "Test Pkg",
                    appearance: "dark",
                    theme: {
                        name: "Test Theme",
                        appearance: "dark",
                        style: { background: "#000000" },
                    },
                    isCustom: true,
                    installedAt: new Date().toISOString(),
                },
            ];

            saveCustomThemes(custom);
            const loaded = loadCustomThemes();
            expect(loaded.length).toBe(1);
            expect(loaded[0].name).toBe("Test Theme");
        });

        it("saves and loads active theme ID", () => {
            expect(loadActiveThemeId()).toBe(DEFAULT_THEME_ID);
            saveActiveThemeId("catppuccin-mocha");
            expect(loadActiveThemeId()).toBe("catppuccin-mocha");
        });

        it("falls back safely on corrupt localStorage", () => {
            mockStorage[LOCAL_STORAGE_CUSTOM_THEMES_KEY] = "corrupt";
            mockStorage[LOCAL_STORAGE_ACTIVE_THEME_KEY] = "";
            expect(loadCustomThemes()).toEqual([]);
            expect(loadActiveThemeId()).toBe(DEFAULT_THEME_ID);
        });

        it("combines built-in and custom themes in getAllThemes", () => {
            const all = getAllThemes([]);
            expect(all.length).toBe(18); // 18 bundled subthemes
        });
    });

    describe("applyActiveTheme DOM Application", () => {
        let mockRoot: { attributes: Record<string, string>; setAttribute: (k: string, v: string) => void; removeAttribute: (k: string) => void };
        let mockStyleEl: { id: string; textContent: string; remove: () => void } | null = null;
        let headChildren: unknown[] = [];

        beforeEach(() => {
            mockRoot = {
                attributes: {},
                setAttribute: (k: string, v: string) => {
                    mockRoot.attributes[k] = v;
                },
                removeAttribute: (k: string) => {
                    delete mockRoot.attributes[k];
                },
            };

            mockStyleEl = null;
            headChildren = [];

            globalThis.document = {
                documentElement: mockRoot as unknown as HTMLElement,
                getElementById: (id: string) => {
                    if (id === ACTIVE_THEME_STYLE_ID) return mockStyleEl as unknown as HTMLElement;
                    return null;
                },
                createElement: (tagName: string) => {
                    const el = {
                        id: "",
                        textContent: "",
                        tagName,
                        remove: () => {
                            if (el === mockStyleEl) mockStyleEl = null;
                        },
                    };
                    return el as unknown as HTMLElement;
                },
                head: {
                    appendChild: (node: unknown) => {
                        const el = node as { id: string; textContent: string; remove: () => void };
                        mockStyleEl = el;
                        headChildren.push(el);
                        return el;
                    },
                },
            } as unknown as Document;
        });

        it("removes data-theme on default theme selection", () => {
            mockRoot.attributes["data-theme"] = "catppuccin-mocha";
            applyActiveTheme("default");
            expect(mockRoot.attributes["data-theme"]).toBeUndefined();
        });

        it("sets data-theme for built-in theme", () => {
            applyActiveTheme("radiant");
            expect(mockRoot.attributes["data-theme"]).toBe("radiant");
        });

        it("injects custom style sheet rule for installed custom theme", () => {
            const custom: CustomThemeEntry = {
                id: "custom-aurora-borealis",
                name: "Aurora Borealis",
                packageName: "Aurora",
                appearance: "dark",
                theme: {
                    name: "Aurora Borealis",
                    appearance: "dark",
                    style: {
                        background: "#011627",
                        text: "#d6deeb",
                    },
                },
                isCustom: true,
                installedAt: new Date().toISOString(),
            };

            applyActiveTheme("custom-aurora-borealis", [custom]);
            expect(mockRoot.attributes["data-theme"]).toBe("custom-aurora-borealis");
            expect(mockStyleEl).not.toBeNull();
            expect(mockStyleEl?.textContent).toContain('[data-theme="custom-aurora-borealis"]');
            expect(mockStyleEl?.textContent).toContain("--theme-background: #011627;");
        });
    });
});
