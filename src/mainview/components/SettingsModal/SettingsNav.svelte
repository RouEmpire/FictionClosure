<script lang="ts">
    import { SETTINGS_TABS, type SettingsTabId } from "./settingsConstants";

    interface Props {
        activeTab: SettingsTabId;
        onSelectTab: (tab: SettingsTabId) => void;
    }

    let { activeTab, onSelectTab }: Props = $props();
</script>

<nav class="settings-tabs" aria-label="Settings categories">
    {#each SETTINGS_TABS as tab (tab.id)}
        <button
            type="button"
            class="tab-btn"
            class:active={activeTab === tab.id}
            onclick={() => onSelectTab(tab.id)}
        >
            <span><i class={tab.icon}></i></span>
            {tab.label}
            {#if tab.isTodo}
                <span class="badge-todo">TODO</span>
            {/if}
        </button>
    {/each}
</nav>
