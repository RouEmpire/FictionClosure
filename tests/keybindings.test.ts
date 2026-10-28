import { describe, expect, it, beforeEach } from "bun:test";
import {
    matchesKeybinding,
    matchesAction,
    captureKeyCombo,
    findConflictingAction,
    loadKeybindings,
    saveKeybindings,
    resetKeybindings,
    formatShortcutKey,
    DEFAULT_KEYBINDINGS,
    KEYBINDING_DEFINITIONS,
    type KeybindingActionId,
} from "../src/shared/domain/keybindings";

describe("Keybindings Domain Subsystem", () => {
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

    describe("Schema & Definitions", () => {
        it("defines all expected actions across categories", () => {
            expect(KEYBINDING_DEFINITIONS.length).toBeGreaterThanOrEqual(25);
            for (const def of KEYBINDING_DEFINITIONS) {
                expect(def.id).toBeTruthy();
                expect(def.label).toBeTruthy();
                expect(def.description).toBeTruthy();
                expect(def.defaultKeys.length).toBeGreaterThan(0);
            }
        });

        it("has default mappings matching standard FictionClosure keys", () => {
            expect(DEFAULT_KEYBINDINGS.commandPalette).toEqual(["$mod", "K"]);
            expect(DEFAULT_KEYBINDINGS.settings).toEqual(["$mod", "P"]);
            expect(DEFAULT_KEYBINDINGS.save).toEqual(["$mod", "S"]);
            expect(DEFAULT_KEYBINDINGS.saveAs).toEqual(["$mod", "Shift", "S"]);
            expect(DEFAULT_KEYBINDINGS.bold).toEqual(["$mod", "B"]);
            expect(DEFAULT_KEYBINDINGS.italic).toEqual(["$mod", "I"]);
            expect(DEFAULT_KEYBINDINGS.toggleZen).toEqual(["$mod", "\\"]);
        });
    });

    describe("matchesKeybinding", () => {
        it("matches basic modifier + letter combinations", () => {
            const eventCtrlK = {
                key: "k",
                ctrlKey: true,
            };
            expect(matchesKeybinding(eventCtrlK, ["$mod", "K"])).toBe(true);

            const eventCtrlShiftS = {
                key: "s",
                ctrlKey: true,
                shiftKey: true,
            };
            expect(matchesKeybinding(eventCtrlShiftS, ["$mod", "Shift", "S"])).toBe(true);
        });

        it("rejects when unwanted modifiers are pressed", () => {
            const eventCtrlAltK = {
                key: "k",
                ctrlKey: true,
                altKey: true,
            };
            expect(matchesKeybinding(eventCtrlAltK, ["$mod", "K"])).toBe(false);

            const eventCtrlShiftK = {
                key: "k",
                ctrlKey: true,
                shiftKey: true,
            };
            expect(matchesKeybinding(eventCtrlShiftK, ["$mod", "K"])).toBe(false);
        });

        it("matches function keys and special characters", () => {
            const eventF1 = {
                key: "F1",
            };
            expect(matchesKeybinding(eventF1, ["F1"])).toBe(true);

            const eventBackslash = {
                key: "\\",
                ctrlKey: true,
            };
            expect(matchesKeybinding(eventBackslash, ["$mod", "\\"])).toBe(true);
        });
    });

    describe("matchesAction with Custom Overrides", () => {
        it("respects user overrides over defaults", () => {
            const userBindings: Partial<Record<KeybindingActionId, string[]>> = {
                save: ["$mod", "Alt", "S"],
            };

            const defaultSaveEvent = {
                key: "s",
                ctrlKey: true,
            };
            // Default Ctrl+S no longer triggers save
            expect(matchesAction("save", defaultSaveEvent, userBindings)).toBe(false);

            const customSaveEvent = {
                key: "s",
                ctrlKey: true,
                altKey: true,
            };
            // New Ctrl+Alt+S triggers save
            expect(matchesAction("save", customSaveEvent, userBindings)).toBe(true);
        });

        it("falls back to default keys if action has no override", () => {
            const userBindings: Partial<Record<KeybindingActionId, string[]>> = {
                bold: ["$mod", "Shift", "B"],
            };
            const eventCtrlK = {
                key: "k",
                ctrlKey: true,
            };
            expect(matchesAction("commandPalette", eventCtrlK, userBindings)).toBe(true);
        });
    });

    describe("captureKeyCombo", () => {
        it("captures modifier and key combinations", () => {
            const event = {
                key: "k",
                ctrlKey: true,
            };
            expect(captureKeyCombo(event)).toEqual(["$mod", "K"]);
        });

        it("returns null on bare modifier keys", () => {
            const eventShift = { key: "Shift", shiftKey: true };
            expect(captureKeyCombo(eventShift)).toBeNull();

            const eventCtrl = { key: "Control", ctrlKey: true };
            expect(captureKeyCombo(eventCtrl)).toBeNull();
        });
    });

    describe("findConflictingAction", () => {
        it("detects when a combination is already taken by another action", () => {
            const currentBindings = { ...DEFAULT_KEYBINDINGS };
            const conflict = findConflictingAction("commandPalette", ["$mod", "P"], currentBindings);
            expect(conflict).toBe("settings");
        });

        it("returns null if combination is unique or matches self", () => {
            const currentBindings = { ...DEFAULT_KEYBINDINGS };
            const conflictSelf = findConflictingAction("commandPalette", ["$mod", "K"], currentBindings);
            expect(conflictSelf).toBeNull();

            const conflictUnused = findConflictingAction("commandPalette", ["$mod", "Alt", "M"], currentBindings);
            expect(conflictUnused).toBeNull();
        });
    });

    describe("Persistence", () => {
        it("saves and loads keybinding overrides", () => {
            const overrides = { save: ["$mod", "D"] };
            saveKeybindings(overrides);

            const loaded = loadKeybindings();
            expect(loaded.save).toEqual(["$mod", "D"]);
            expect(loaded.commandPalette).toEqual(["$mod", "K"]);
        });

        it("resets to defaults cleanly", () => {
            saveKeybindings({ save: ["$mod", "D"] });
            const reset = resetKeybindings();
            expect(reset.save).toEqual(["$mod", "S"]);
        });
    });

    describe("formatShortcutKey", () => {
        it("formats keys correctly according to platform", () => {
            expect(formatShortcutKey("$mod", true)).toBe("⌘");
            expect(formatShortcutKey("$mod", false)).toBe("Ctrl");
            expect(formatShortcutKey("Shift", true)).toBe("⇧");
            expect(formatShortcutKey("Shift", false)).toBe("Shift");
        });
    });
});
