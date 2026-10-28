<script lang="ts">
    import {
        clampTimeInterval,
        clampEnterStrokeCount,
        clampCharacterCountThreshold,
        type AutoSaveSettings,
        type AutoSaveTimeUnit,
    } from "@shared/domain/autoSave";
    import "./autoSaveTab.css";

    interface Props {
        settings: AutoSaveSettings;
        onChange: () => void;
    }

    let { settings = $bindable(), onChange }: Props = $props();

    function handleToggleMaster() { settings.enabled = !settings.enabled; onChange(); }
    function handleToggleByTime() { settings.byTime = !settings.byTime; onChange(); }
    function handleSetTimeUnit(unit: AutoSaveTimeUnit) {
        settings.timeUnit = unit;
        settings.timeIntervalValue = clampTimeInterval(settings.timeIntervalValue, unit);
        onChange();
    }
    function handleTimeValueChange(e: Event) {
        const val = Number((e.target as HTMLInputElement).value);
        settings.timeIntervalValue = clampTimeInterval(val, settings.timeUnit);
        onChange();
    }
    function handleApplyTimePreset(val: number, unit: AutoSaveTimeUnit) {
        settings.timeUnit = unit;
        settings.timeIntervalValue = clampTimeInterval(val, unit);
        onChange();
    }
    function handleToggleByEnter() { settings.byEnterStroke = !settings.byEnterStroke; onChange(); }
    function handleEnterCountChange(e: Event) {
        const val = Number((e.target as HTMLInputElement).value);
        settings.enterStrokeCount = clampEnterStrokeCount(val);
        onChange();
    }
    function handleApplyEnterPreset(val: number) {
        settings.enterStrokeCount = clampEnterStrokeCount(val);
        onChange();
    }
    function handleToggleByChars() { settings.byCharacterCount = !settings.byCharacterCount; onChange(); }
    function handleCharCountChange(e: Event) {
        const val = Number((e.target as HTMLInputElement).value);
        settings.characterCountThreshold = clampCharacterCountThreshold(val);
        onChange();
    }
    function handleApplyCharPreset(val: number) {
        settings.characterCountThreshold = clampCharacterCountThreshold(val);
        onChange();
    }

    const activeRulesCount = $derived(
        (settings.byTime ? 1 : 0) + (settings.byEnterStroke ? 1 : 0) + (settings.byCharacterCount ? 1 : 0),
    );
</script>

<div class="autosave-settings-tab" role="region" aria-label="Auto-Save Settings">
    <!-- Hero Master Toggle -->
    <div class="autosave-hero-card" class:active={settings.enabled}>
        <div class="hero-left">
            <div class="hero-icon-box">
                <i class="fa-solid fa-floppy-disk"></i>
            </div>
            <div class="hero-text">
                <h3 class="hero-title">Project Auto-Save</h3>
                <p class="hero-desc">
                    Safeguard manuscript progress automatically using time intervals, Enter paragraph breaks, or character counts.
                </p>
            </div>
        </div>
        <div class="hero-toggle-area">
            <button
                type="button"
                class="btn-toggle-switch"
                class:active={settings.enabled}
                onclick={handleToggleMaster}
                aria-pressed={settings.enabled}
                aria-label="Toggle Master Auto-Save"
            >
                <span class="toggle-slider"></span>
            </button>
            <span class="toggle-label" class:text-green={settings.enabled}>
                {settings.enabled ? "Active" : "Disabled"}
            </span>
        </div>
    </div>

    {#if settings.enabled}
        <!-- 1. Time-based trigger -->
        <div class="trigger-card" class:enabled={settings.byTime}>
            <div class="trigger-header">
                <div class="trigger-header-left">
                    <div class="trigger-icon">
                        <i class="fa-regular fa-clock"></i>
                    </div>
                    <div>
                        <h4 class="trigger-title">Time Interval Auto-Save</h4>
                        <p class="trigger-desc">Periodically save whenever unsaved changes remain idle or active.</p>
                    </div>
                </div>
                <button
                    type="button"
                    class="btn-toggle-switch"
                    class:active={settings.byTime}
                    onclick={handleToggleByTime}
                    aria-pressed={settings.byTime}
                    aria-label="Toggle Time Interval Auto-Save"
                >
                    <span class="toggle-slider"></span>
                </button>
            </div>

            {#if settings.byTime}
                <div class="trigger-body">
                    <div class="trigger-input-row">
                        <span class="trigger-input-label">Save every:</span>
                        <input
                            type="number"
                            class="trigger-num-input"
                            value={settings.timeIntervalValue}
                            min={settings.timeUnit === "minutes" ? 1 : 5}
                            max={settings.timeUnit === "minutes" ? 120 : 3600}
                            onchange={handleTimeValueChange}
                            aria-label="Time interval value"
                        />
                        <div class="segmented-control" role="group" aria-label="Time unit">
                            <button
                                type="button"
                                class="segmented-btn"
                                class:active={settings.timeUnit === "seconds"}
                                onclick={() => handleSetTimeUnit("seconds")}
                            >
                                Seconds
                            </button>
                            <button
                                type="button"
                                class="segmented-btn"
                                class:active={settings.timeUnit === "minutes"}
                                onclick={() => handleSetTimeUnit("minutes")}
                            >
                                Minutes
                            </button>
                        </div>
                    </div>
                    <div class="preset-pills-row">
                        <span class="preset-pill-hint">Presets:</span>
                        <button type="button" class="preset-pill" onclick={() => handleApplyTimePreset(15, "seconds")}>15s</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyTimePreset(30, "seconds")}>30s</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyTimePreset(1, "minutes")}>1 min</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyTimePreset(2, "minutes")}>2 min</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyTimePreset(5, "minutes")}>5 min</button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- 2. Enter strokes / paragraph breaks -->
        <div class="trigger-card" class:enabled={settings.byEnterStroke}>
            <div class="trigger-header">
                <div class="trigger-header-left">
                    <div class="trigger-icon">
                        <i class="fa-solid fa-arrow-turn-down"></i>
                    </div>
                    <div>
                        <h4 class="trigger-title">Paragraph Break (Enter Stroke)</h4>
                        <p class="trigger-desc">Save automatically when pressing Enter to start a new paragraph or line.</p>
                    </div>
                </div>
                <button
                    type="button"
                    class="btn-toggle-switch"
                    class:active={settings.byEnterStroke}
                    onclick={handleToggleByEnter}
                    aria-pressed={settings.byEnterStroke}
                    aria-label="Toggle Enter Stroke Auto-Save"
                >
                    <span class="toggle-slider"></span>
                </button>
            </div>

            {#if settings.byEnterStroke}
                <div class="trigger-body">
                    <div class="trigger-input-row">
                        <span class="trigger-input-label">Save every:</span>
                        <input
                            type="number"
                            class="trigger-num-input"
                            value={settings.enterStrokeCount}
                            min="1"
                            max="50"
                            onchange={handleEnterCountChange}
                            aria-label="Enter stroke count"
                        />
                        <span class="trigger-input-label">Enter keypress(es)</span>
                    </div>
                    <div class="preset-pills-row">
                        <span class="preset-pill-hint">Presets:</span>
                        <button type="button" class="preset-pill" onclick={() => handleApplyEnterPreset(1)}>Every Enter (1)</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyEnterPreset(2)}>Every 2 Enters</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyEnterPreset(3)}>Every 3 Enters</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyEnterPreset(5)}>Every 5 Enters</button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- 3. Character input count -->
        <div class="trigger-card" class:enabled={settings.byCharacterCount}>
            <div class="trigger-header">
                <div class="trigger-header-left">
                    <div class="trigger-icon">
                        <i class="fa-solid fa-i-cursor"></i>
                    </div>
                    <div>
                        <h4 class="trigger-title">Character Count Volume</h4>
                        <p class="trigger-desc">Save automatically after typing a specific quantity of characters.</p>
                    </div>
                </div>
                <button
                    type="button"
                    class="btn-toggle-switch"
                    class:active={settings.byCharacterCount}
                    onclick={handleToggleByChars}
                    aria-pressed={settings.byCharacterCount}
                    aria-label="Toggle Character Count Auto-Save"
                >
                    <span class="toggle-slider"></span>
                </button>
            </div>

            {#if settings.byCharacterCount}
                <div class="trigger-body">
                    <div class="trigger-input-row">
                        <span class="trigger-input-label">Save after typing:</span>
                        <input
                            type="number"
                            class="trigger-num-input"
                            value={settings.characterCountThreshold}
                            min="5"
                            max="5000"
                            step="25"
                            onchange={handleCharCountChange}
                            aria-label="Character count threshold"
                        />
                        <span class="trigger-input-label">characters</span>
                    </div>
                    <div class="preset-pills-row">
                        <span class="preset-pill-hint">Presets:</span>
                        <button type="button" class="preset-pill" onclick={() => handleApplyCharPreset(50)}>50 chars</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyCharPreset(100)}>100 chars</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyCharPreset(250)}>250 chars</button>
                        <button type="button" class="preset-pill" onclick={() => handleApplyCharPreset(500)}>500 chars</button>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Summary Status Card -->
        <div class="autosave-summary-card">
            <div class="summary-icon">
                <i class="fa-solid fa-circle-info"></i>
            </div>
            <div class="summary-text">
                {#if activeRulesCount === 0}
                    <span>No active trigger rules. Auto-save is idle until you enable at least one rule above.</span>
                {:else}
                    <span>Active auto-save triggers:</span>
                    {#if settings.byTime}
                        <span class="summary-rule-tag">⏱ Every {settings.timeIntervalValue} {settings.timeUnit}</span>
                    {/if}
                    {#if settings.byEnterStroke}
                        <span class="summary-rule-tag">↵ Every {settings.enterStrokeCount} Enter{settings.enterStrokeCount > 1 ? "s" : ""}</span>
                    {/if}
                    {#if settings.byCharacterCount}
                        <span class="summary-rule-tag">✍ Every {settings.characterCountThreshold} chars</span>
                    {/if}
                {/if}
            </div>
        </div>
    {/if}
</div>
