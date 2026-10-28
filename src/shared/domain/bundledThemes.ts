/**
 * FictionClosure — Bundled Zed Themes Registry.
 *
 * Loads all bundled Zed theme JSON files from `src/media/theme/`, provides
 * typed metadata entries, and generates runtime CSS stylesheets for the app.
 */

import catppuccinPkg from "../../media/theme/Catppuccin.json";
import darkBlurOnePkg from "../../media/theme/DarkBlur one.json";
import draculaRefinedPkg from "../../media/theme/Dracula Refined.json";
import industrionalPkg from "../../media/theme/Industrional.json";
import monokaiNightFixPkg from "../../media/theme/Monokai Night Fix.json";
import oneMonokaiProPkg from "../../media/theme/One Monokai Pro.json";
import radiantPkg from "../../media/theme/Radiant.json";
import vampirePkg from "../../media/theme/Vampire.json";
import voidThemePkg from "../../media/theme/Void.json";

import {
    slugifyThemeId,
    generateThemeCssRule,
    type BundledThemeEntry,
    type ZedThemePackage,
} from "./theme";

export const BUNDLED_THEME_PACKAGES: ZedThemePackage[] = [
    catppuccinPkg as unknown as ZedThemePackage,
    darkBlurOnePkg as unknown as ZedThemePackage,
    draculaRefinedPkg as unknown as ZedThemePackage,
    industrionalPkg as unknown as ZedThemePackage,
    monokaiNightFixPkg as unknown as ZedThemePackage,
    oneMonokaiProPkg as unknown as ZedThemePackage,
    radiantPkg as unknown as ZedThemePackage,
    vampirePkg as unknown as ZedThemePackage,
    voidThemePkg as unknown as ZedThemePackage,
];

/**
 * Flattens all theme packages into individual themes with unique IDs.
 */
export function parseBundledThemes(packages: ZedThemePackage[] = BUNDLED_THEME_PACKAGES): BundledThemeEntry[] {
    const list: BundledThemeEntry[] = [];
    const seenIds = new Set<string>();

    for (const pkg of packages) {
        for (const th of pkg.themes || []) {
            let id = slugifyThemeId(th.name);
            if (seenIds.has(id)) {
                id = `${slugifyThemeId(pkg.name)}-${id}`;
            }
            if (seenIds.has(id)) {
                let counter = 2;
                while (seenIds.has(`${id}-${counter}`)) counter++;
                id = `${id}-${counter}`;
            }
            seenIds.add(id);

            list.push({
                id,
                name: th.name,
                packageName: pkg.name,
                appearance: th.appearance,
                theme: th,
            });
        }
    }

    return list;
}

export const BUNDLED_THEMES: BundledThemeEntry[] = parseBundledThemes();

/**
 * Finds a bundled theme by name or slug ID.
 */
export function findBundledTheme(nameOrId: string): BundledThemeEntry | null {
    const query = nameOrId.trim().toLowerCase();
    const slug = slugifyThemeId(query);

    return (
        BUNDLED_THEMES.find(
            (t) => t.id === slug || t.id === query || t.name.toLowerCase() === query,
        ) ?? null
    );
}

/**
 * Generates an aggregated CSS stylesheet declaring `[data-theme="<theme-id>"]`
 * rules for all bundled themes.
 */
export function generateAllBundledThemesCss(themes: BundledThemeEntry[] = BUNDLED_THEMES): string {
    return themes
        .map((t) => generateThemeCssRule(`[data-theme="${t.id}"]`, t.theme))
        .join("\n\n");
}

const STYLE_ELEMENT_ID = "fc-bundled-zed-themes";

/**
 * Ensures all bundled themes CSS rules are injected into document.head so any element
 * or the root `<html>` tag with `data-theme="<theme-id>"` instantly renders that theme.
 */
export function ensureBundledThemesRegisteredInDom(): void {
    if (typeof document === "undefined") return;

    if (document.getElementById(STYLE_ELEMENT_ID)) return;

    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ELEMENT_ID;
    styleEl.textContent = generateAllBundledThemesCss();
    document.head.appendChild(styleEl);
}
