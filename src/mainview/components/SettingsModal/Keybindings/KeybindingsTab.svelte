<script lang="ts">
    import {
        KEYBINDING_DEFINITIONS,
        findConflictingAction,
        keysAreEqual,
        resetKeybindings,
        type KeybindingActionId,
        type KeybindingCategory,
    } from "@shared/domain/keybindings";
    import KeybindingRow from "./KeybindingRow.svelte";
    import "./keybindingsTab.css";

    interface Props {
        keybindings: Record<KeybindingActionId, string[]>;
        onUpdateKeybindings: (newBindings: Record<KeybindingActionId, string[]>) => void;
    }

    let { keybindings, onUpdateKeybindings }: Props = $props();

    type FilterCategory = "all" | KeybindingCategory;

    let selectedCategory = $state<FilterCategory>("all");
    let searchQuery = $state<string>("");
    let recordingId = $state<KeybindingActionId | null>(null);

    const customizedCount = $derived(
        KEYBINDING_DEFINITIONS.filter(
            (def) => !keysAreEqual(keybindings[def.id] || def.defaultKeys, def.defaultKeys),
        ).length,
    );

    const filteredDefinitions = $derived(
        KEYBINDING_DEFINITIONS.filter((def) => {
            if (selectedCategory !== "all" && def.category !== selectedCategory) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const currentKeys = keybindings[def.id] || def.defaultKeys;
                return (
                    def.label.toLowerCase().includes(q) ||
                    def.description.toLowerCase().includes(q) ||
                    currentKeys.some((k) => k.toLowerCase().includes(q))
                );
            }
            return true;
        }),
    );

    function handleStartRecord(id: KeybindingActionId) {
        recordingId = id;
    }

    function handleCancelRecord() {
        recordingId = null;
    }

    function handleSaveRecord(id: KeybindingActionId, newKeys: string[]) {
        const updated = { ...keybindings, [id]: newKeys };
        onUpdateKeybindings(updated);
        recordingId = null;
    }

    function handleResetSingle(id: KeybindingActionId) {
        const def = KEYBINDING_DEFINITIONS.find((d) => d.id === id);
        if (!def) return;
        const updated = { ...keybindings, [id]: [...def.defaultKeys] };
        onUpdateKeybindings(updated);
    }

    function handleResetAll() {
        const defaults = resetKeybindings();
        onUpdateKeybindings(defaults);
        recordingId = null;
    }
</script>

<div class="keybindings-settings-tab" role="region" aria-label="Keybinding Settings">
    <!-- Hero Banner -->
    <div class="kb-hero-card">
        <div class="kb-hero-left">
            <div class="kb-hero-icon-box">
                <i class="fa-solid fa-keyboard"></i>
            </div>
            <div class="kb-hero-text">
                <h3 class="kb-hero-title">Keyboard Shortcuts</h3>
                <p class="kb-hero-desc">
                    {#if customizedCount > 0}
                        {customizedCount} customized shortcut{customizedCount > 1 ? "s" : ""}. Click any shortcut to rebind it.
                    {:else}
                        All shortcuts are using default presets. Click any key combination to rebind.
                    {/if}
                </p>
            </div>
        </div>

        {#if customizedCount > 0}
            <button
                type="button"
                class="kb-reset-all-btn"
                onclick={handleResetAll}
                title="Reset all keyboard shortcuts to system defaults"
            >
                <i class="fa-solid fa-rotate-left"></i>
                Reset All Defaults
            </button>
        {/if}
    </div>

    <!-- Controls Bar: Category Filter Chips & Search -->
    <div class="kb-controls-bar">
        <div class="kb-filter-chips" role="radiogroup" aria-label="Filter categories">
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "all"}
                onclick={() => (selectedCategory = "all")}
            >
                All ({KEYBINDING_DEFINITIONS.length})
            </button>
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "general"}
                onclick={() => (selectedCategory = "general")}
            >
                General
            </button>
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "document"}
                onclick={() => (selectedCategory = "document")}
            >
                Document
            </button>
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "workspace"}
                onclick={() => (selectedCategory = "workspace")}
            >
                Workspace
            </button>
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "editor"}
                onclick={() => (selectedCategory = "editor")}
            >
                Editor
            </button>
            <button
                type="button"
                class="kb-chip"
                class:active={selectedCategory === "formatting"}
                onclick={() => (selectedCategory = "formatting")}
            >
                Formatting
            </button>
        </div>

        <div class="kb-search-box">
            <i class="fa-solid fa-magnifying-glass kb-search-icon"></i>
            <input
                type="text"
                class="kb-search-input"
                placeholder="Search shortcuts..."
                bind:value={searchQuery}
            />
        </div>
    </div>

    <!-- Keybindings List -->
    <div class="kb-list" role="table" aria-label="Shortcuts list">
        {#each filteredDefinitions as def (def.id)}
            {@const currentKeys = keybindings[def.id] || def.defaultKeys}
            {@const conflictId = findConflictingAction(def.id, currentKeys, keybindings)}
            {@const conflictDef = conflictId ? KEYBINDING_DEFINITIONS.find((d) => d.id === conflictId) : null}

            <KeybindingRow
                definition={def}
                {currentKeys}
                isRecording={recordingId === def.id}
                conflictName={conflictDef ? conflictDef.label : null}
                onStartRecord={() => handleStartRecord(def.id)}
                onCancelRecord={handleCancelRecord}
                onSaveRecord={(newKeys) => handleSaveRecord(def.id, newKeys)}
                onReset={() => handleResetSingle(def.id)}
            />
        {/each}

        {#if filteredDefinitions.length === 0}
            <div class="kb-empty-state">
                <p>No shortcuts matched your search or category filter.</p>
            </div>
        {/if}
    </div>
</div>
