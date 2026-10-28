<script lang="ts">
    import {
        formatShortcutKey,
        captureKeyCombo,
        keysAreEqual,
        type KeybindingDefinition,
    } from "@shared/domain/keybindings";

    interface Props {
        definition: KeybindingDefinition;
        currentKeys: string[];
        isRecording: boolean;
        conflictName: string | null;
        onStartRecord: () => void;
        onCancelRecord: () => void;
        onSaveRecord: (newKeys: string[]) => void;
        onReset: () => void;
    }

    let {
        definition,
        currentKeys,
        isRecording,
        conflictName,
        onStartRecord,
        onCancelRecord,
        onSaveRecord,
        onReset,
    }: Props = $props();

    const isCustomized = $derived(
        !keysAreEqual(currentKeys, definition.defaultKeys),
    );

    function handleKeyDown(e: KeyboardEvent) {
        if (!isRecording) return;

        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") {
            onCancelRecord();
            return;
        }

        const combo = captureKeyCombo(e);
        if (combo && combo.length > 0) {
            onSaveRecord(combo);
        }
    }
</script>

<svelte:window onkeydown={isRecording ? handleKeyDown : undefined} />

<div
    class="kb-row"
    class:is-recording={isRecording}
    class:has-conflict={Boolean(conflictName)}
    role="row"
>
    <!-- Left: Label, Category, Description -->
    <div class="kb-row-info">
        <div class="kb-row-header">
            <h4 class="kb-row-label">{definition.label}</h4>
            <span class="kb-category-badge">{definition.category}</span>
            {#if isCustomized}
                <span class="kb-custom-badge" title="Customized by user">Custom</span>
            {/if}
        </div>
        <p class="kb-row-desc">{definition.description}</p>
        {#if conflictName}
            <div class="kb-conflict-msg" role="alert">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Conflicts with <strong>{conflictName}</strong>
            </div>
        {/if}
    </div>

    <!-- Right: Key Combo Trigger & Reset -->
    <div class="kb-row-actions">
        <button
            type="button"
            class="kb-combo-btn"
            class:recording={isRecording}
            onclick={isRecording ? onCancelRecord : onStartRecord}
            title={isRecording ? "Press Esc to cancel" : "Click to record new shortcut"}
            aria-label={`Record new shortcut for ${definition.label}`}
        >
            {#if isRecording}
                <span class="kb-key-kbd">Press shortcut...</span>
            {:else}
                {#each currentKeys as key, idx}
                    <span class="kb-key-kbd">{formatShortcutKey(key)}</span>
                    {#if idx < currentKeys.length - 1}
                        <span class="kb-key-separator">+</span>
                    {/if}
                {/each}
            {/if}
        </button>

        {#if isCustomized}
            <button
                type="button"
                class="kb-btn-reset-single"
                onclick={onReset}
                title={`Reset to default (${definition.defaultKeys.join("+")})`}
                aria-label={`Reset ${definition.label} shortcut`}
            >
                <i class="fa-solid fa-rotate-left"></i>
            </button>
        {/if}
    </div>
</div>
