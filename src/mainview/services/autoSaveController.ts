import {
    getTimeIntervalMs,
    type AutoSaveSettings,
} from "@shared/domain/autoSave";

export interface AutoSaveControllerOptions {
    getSettings: () => AutoSaveSettings;
    hasUnsavedChanges: () => boolean;
    canSave: () => boolean;
    onTriggerSave: () => void | Promise<void>;
}

function countNewlines(str: string): number {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) === 10) count++;
    }
    return count;
}

/**
 * Coordinates and debounces automatic project saves based on time intervals,
 * Enter stroke counts, and character input volume.
 */
export class AutoSaveController {
    private options: AutoSaveControllerOptions;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private enterStrokeCount = 0;
    private characterDeltaCount = 0;

    constructor(options: AutoSaveControllerOptions) {
        this.options = options;
    }

    /**
     * Called whenever a document's content changes.
     * Evaluates character thresholds, newline/Enter additions, and arms the time-based timer.
     */
    public recordChange(oldContent: string, newContent: string): void {
        const settings = this.options.getSettings();
        if (!settings.enabled) return;

        this.armTimeTimer(settings);

        let shouldSave = false;

        // 1. Character count threshold check
        if (settings.byCharacterCount) {
            const delta = Math.abs(newContent.length - oldContent.length);
            this.characterDeltaCount += delta;
            if (this.characterDeltaCount >= settings.characterCountThreshold) {
                shouldSave = true;
            }
        }

        // 2. Enter stroke / newline additions check
        if (settings.byEnterStroke) {
            const oldLines = countNewlines(oldContent);
            const newLines = countNewlines(newContent);
            if (newLines > oldLines) {
                this.enterStrokeCount += (newLines - oldLines);
                if (this.enterStrokeCount >= settings.enterStrokeCount) {
                    shouldSave = true;
                }
            }
        }

        if (shouldSave) {
            this.triggerSave();
        }
    }

    /**
     * Explicitly record an Enter keypress from keydown event handlers.
     */
    public recordEnterKey(): void {
        const settings = this.options.getSettings();
        if (!settings.enabled) return;

        this.armTimeTimer(settings);

        if (settings.byEnterStroke) {
            this.enterStrokeCount += 1;
            if (this.enterStrokeCount >= settings.enterStrokeCount) {
                this.triggerSave();
            }
        }
    }

    /**
     * Arms or re-arms the time-based auto-save timer if unsaved changes exist.
     */
    public armTimeTimer(settings: AutoSaveSettings = this.options.getSettings()): void {
        if (!settings.enabled || !settings.byTime) {
            this.clearTimer();
            return;
        }

        // Only schedule if no timer is already ticking
        if (!this.timer && this.options.hasUnsavedChanges()) {
            const intervalMs = getTimeIntervalMs(settings.timeIntervalValue, settings.timeUnit);
            this.timer = setTimeout(() => {
                this.timer = null;
                if (this.options.hasUnsavedChanges()) {
                    this.triggerSave();
                }
            }, intervalMs);
        }
    }

    /**
     * Executes save if conditions are met and resets counters.
     */
    public triggerSave(): void {
        if (!this.options.canSave()) return;

        this.resetCounters();
        this.clearTimer();
        void this.options.onTriggerSave();
    }

    /**
     * Called when a save operation (manual or auto) completes successfully.
     */
    public notifySaved(): void {
        this.resetCounters();
        this.clearTimer();
    }

    /**
     * Call when settings are updated to adjust running timers.
     */
    public updateSettings(): void {
        this.clearTimer();
        if (this.options.hasUnsavedChanges()) {
            this.armTimeTimer();
        }
    }

    public getCounters(): { enterStrokeCount: number; characterDeltaCount: number; hasActiveTimer: boolean } {
        return {
            enterStrokeCount: this.enterStrokeCount,
            characterDeltaCount: this.characterDeltaCount,
            hasActiveTimer: this.timer !== null,
        };
    }

    public destroy(): void {
        this.clearTimer();
        this.resetCounters();
    }

    private clearTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    private resetCounters(): void {
        this.enterStrokeCount = 0;
        this.characterDeltaCount = 0;
    }
}
