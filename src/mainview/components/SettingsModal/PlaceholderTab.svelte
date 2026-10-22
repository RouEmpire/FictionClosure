<script lang="ts">
    import { PLACEHOLDER_TAB_CONTENT, type SettingsTabId } from "./settingsConstants";

    interface Props {
        tab: SettingsTabId;
    }

    let { tab }: Props = $props();

    const info = $derived(
        PLACEHOLDER_TAB_CONTENT[tab] || {
            icon: "fa-solid fa-gear",
            title: "Coming Soon",
            description: "Planned for a future update.",
        },
    );
</script>

<div class="placeholder-section">
    <span class="placeholder-icon">
        <i class={info.icon}></i>
    </span>
    <h4>{info.title}</h4>
    <p>{info.description}</p>
</div>
