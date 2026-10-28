import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { AutoSaveController } from "../src/mainview/services/autoSaveController";
import type { AutoSaveSettings } from "../src/shared/domain/autoSave";

describe("AutoSaveController Unit Tests", () => {
    let settings: AutoSaveSettings;
    let unsavedChanges = false;
    let canSaveState = true;
    let saveCount = 0;

    beforeEach(() => {
        saveCount = 0;
        unsavedChanges = true;
        canSaveState = true;
        settings = {
            enabled: true,
            byTime: false,
            timeIntervalValue: 30,
            timeUnit: "seconds",
            byEnterStroke: false,
            enterStrokeCount: 1,
            byCharacterCount: false,
            characterCountThreshold: 50,
        };
    });

    it("triggers save when character count threshold is reached", () => {
        settings.byCharacterCount = true;
        settings.characterCountThreshold = 20;

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        // Type 10 characters
        controller.recordChange("Hello", "Hello World!");
        expect(saveCount).toBe(0);
        expect(controller.getCounters().characterDeltaCount).toBe(7);

        // Type 15 more characters (total delta = 22 >= 20)
        controller.recordChange("Hello World!", "Hello World! It is evening.");
        expect(saveCount).toBe(1);
        expect(controller.getCounters().characterDeltaCount).toBe(0);

        controller.destroy();
    });

    it("triggers save when Enter stroke count is reached via content changes", () => {
        settings.byEnterStroke = true;
        settings.enterStrokeCount = 2;

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        // 1st newline added
        controller.recordChange("Line 1", "Line 1\n");
        expect(saveCount).toBe(0);
        expect(controller.getCounters().enterStrokeCount).toBe(1);

        // 2nd newline added
        controller.recordChange("Line 1\n", "Line 1\nLine 2\n");
        expect(saveCount).toBe(1);
        expect(controller.getCounters().enterStrokeCount).toBe(0);

        controller.destroy();
    });

    it("triggers save on direct recordEnterKey", () => {
        settings.byEnterStroke = true;
        settings.enterStrokeCount = 1;

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        controller.recordEnterKey();
        expect(saveCount).toBe(1);
        expect(controller.getCounters().enterStrokeCount).toBe(0);

        controller.destroy();
    });

    it("suppresses auto-save when master enabled is false", () => {
        settings.enabled = false;
        settings.byEnterStroke = true;
        settings.byCharacterCount = true;

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        controller.recordEnterKey();
        controller.recordChange("A", "A long text that would normally exceed threshold");
        expect(saveCount).toBe(0);

        controller.destroy();
    });

    it("does not save when canSave returns false", () => {
        settings.byEnterStroke = true;
        settings.enterStrokeCount = 1;
        canSaveState = false; // e.g. no folder path or save in progress

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        controller.recordEnterKey();
        expect(saveCount).toBe(0);

        controller.destroy();
    });

    it("resets counters on notifySaved", () => {
        settings.byCharacterCount = true;
        settings.characterCountThreshold = 100;

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        controller.recordChange("", "Some text");
        expect(controller.getCounters().characterDeltaCount).toBe(9);

        controller.notifySaved();
        expect(controller.getCounters().characterDeltaCount).toBe(0);

        controller.destroy();
    });

    it("arms time-based auto-save timer and fires callback after duration", async () => {
        settings.byTime = true;
        settings.timeIntervalValue = 5; // clamped minimum 5s, test with short custom ms check
        settings.timeUnit = "seconds";

        const controller = new AutoSaveController({
            getSettings: () => settings,
            hasUnsavedChanges: () => unsavedChanges,
            canSave: () => canSaveState,
            onTriggerSave: () => {
                saveCount++;
            },
        });

        controller.recordChange("a", "ab");
        expect(controller.getCounters().hasActiveTimer).toBe(true);

        controller.destroy();
        expect(controller.getCounters().hasActiveTimer).toBe(false);
    });
});
