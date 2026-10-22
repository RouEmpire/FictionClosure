<script lang="ts">
    import type { ZenModeType } from "@shared/types";

    interface Props {
        zenMode: ZenModeType;
        onSelectZenMode: (mode: ZenModeType) => void;
    }

    let { zenMode, onSelectZenMode }: Props = $props();

    let isZenDropdownOpen = $state(false);

    const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    const modKey = isMac ? "⌘" : "Ctrl";
</script>

<svelte:window
    onclick={(e) => {
        if (isZenDropdownOpen) {
            const target = e.target as HTMLElement;
            if (!target.closest(".zen-dropdown-wrapper")) {
                isZenDropdownOpen = false;
            }
        }
    }}
    onkeydown={(e) => {
        if (isZenDropdownOpen && e.key === "Escape") {
            isZenDropdownOpen = false;
        }
    }}
/>

<div class="zen-dropdown-wrapper">
    <button
        type="button"
        class="icon-btn zen-btn"
        class:active={zenMode !== "none"}
        onclick={(e) => {
            e.stopPropagation();
            isZenDropdownOpen = !isZenDropdownOpen;
        }}
        title="Zen writing modes (Click to choose mode)"
        aria-haspopup="true"
        aria-expanded={isZenDropdownOpen}
        aria-label="Zen writing modes"
    >
        <i class="fa-solid fa-spa"></i>
        <span class="dropdown-caret">▾</span>
    </button>

    {#if isZenDropdownOpen}
        <div
            class="zen-dropdown-panel"
            role="menu"
            aria-label="Zen mode selection"
        >
            <div class="dropdown-section-title">ZEN WRITING MODES</div>

            <button
                type="button"
                class="dropdown-row"
                class:active={zenMode === "zen"}
                onclick={() => {
                    onSelectZenMode(zenMode === "zen" ? "none" : "zen");
                    isZenDropdownOpen = false;
                }}
                role="menuitem"
            >
                <span class="row-icon"><i class="fa-solid fa-spa"></i></span>
                <div class="row-content">
                    <div class="row-title-line">
                        <span class="row-title">Zen Mode</span>
                        {#if zenMode === "zen"}
                            <span class="badge-active">Active</span>
                        {/if}
                    </div>
                    <span class="row-desc">Distraction-free centered editor</span>
                </div>
                <kbd class="row-kbd">{modKey}+\</kbd>
            </button>

            <button
                type="button"
                class="dropdown-row"
                class:active={zenMode === "focus"}
                onclick={() => {
                    onSelectZenMode(zenMode === "focus" ? "none" : "focus");
                    isZenDropdownOpen = false;
                }}
                role="menuitem"
            >
                <span class="row-icon"><i class="fa-solid fa-bullseye"></i></span>
                <div class="row-content">
                    <div class="row-title-line">
                        <span class="row-title">Focus Zen Mode</span>
                        {#if zenMode === "focus"}
                            <span class="badge-active">Active</span>
                        {/if}
                    </div>
                    <span class="row-desc">Highlight active paragraph, 50% dim others</span>
                </div>
                <kbd class="row-kbd">{modKey}+Shift+\</kbd>
            </button>

            <button
                type="button"
                class="dropdown-row"
                class:active={zenMode === "czm"}
                onclick={() => {
                    onSelectZenMode(zenMode === "czm" ? "none" : "czm");
                    isZenDropdownOpen = false;
                }}
                role="menuitem"
            >
                <span class="row-icon"><i class="fa-solid fa-bolt"></i></span>
                <div class="row-content">
                    <div class="row-title-line">
                        <span class="row-title">Concentrate Zen (CZM)</span>
                        {#if zenMode === "czm"}
                            <span class="badge-active">Active</span>
                        {/if}
                    </div>
                    <span class="row-desc">Pure textarea only, hides chrome & header</span>
                </div>
                <kbd class="row-kbd">{modKey}+Alt+\</kbd>
            </button>

            {#if zenMode !== "none"}
                <div class="dropdown-divider"></div>
                <button
                    type="button"
                    class="dropdown-row exit-row"
                    onclick={() => {
                        onSelectZenMode("none");
                        isZenDropdownOpen = false;
                    }}
                    role="menuitem"
                >
                    <span class="row-icon"><i class="fa-solid fa-xmark"></i></span>
                    <div class="row-content">
                        <span class="row-title">Exit Zen Mode</span>
                    </div>
                    <kbd class="row-kbd">Esc</kbd>
                </button>
            {/if}
        </div>
    {/if}
</div>

<style>
    .zen-dropdown-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
    }

    .icon-btn {
        background: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        border-radius: 6px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.15s ease;
    }

    .icon-btn:hover {
        background: var(--bg-hover);
        color: var(--text-primary);
    }

    .zen-btn.active {
        background: rgba(63, 185, 80, 0.15);
        border-color: var(--success-color);
        color: var(--success-color);
    }

    .dropdown-caret {
        font-size: 9px;
        margin-left: 2px;
        opacity: 0.7;
    }

    .zen-dropdown-panel {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        width: 320px;
        background-color: var(--bg-secondary);
        border: 1px solid var(--border-subtle);
        border-radius: 8px;
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
        padding: 6px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 3px;
    }

    .dropdown-section-title {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        padding: 6px 10px 4px 10px;
    }

    .dropdown-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        transition: all 0.15s ease;
        width: 100%;
        box-sizing: border-box;
    }

    .dropdown-row:hover {
        background-color: var(--bg-hover);
    }

    .dropdown-row.active {
        background-color: var(--bg-active);
        border-color: var(--accent-primary);
    }

    .row-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .row-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;
    }

    .row-title-line {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .row-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .badge-active {
        font-size: 10px;
        font-weight: 600;
        color: var(--accent-primary);
        background-color: var(--accent-subtle);
        border: 1px solid rgba(230, 157, 69, 0.3);
        padding: 1px 5px;
        border-radius: 10px;
    }

    .row-desc {
        font-size: 11px;
        color: var(--text-muted);
        line-height: 1.3;
    }

    .row-kbd {
        background-color: var(--bg-tertiary);
        border: 1px solid var(--border-subtle);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        font-family: var(--font-editor);
        color: var(--text-secondary);
        flex-shrink: 0;
    }

    .dropdown-divider {
        height: 1px;
        background-color: var(--border-subtle);
        margin: 4px 0;
    }

    .exit-row {
        color: var(--warning-color, #e69d45);
    }
</style>
