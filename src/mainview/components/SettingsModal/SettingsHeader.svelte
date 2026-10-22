<script lang="ts">
    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();
</script>

<div class="settings-header">
    <div class="title-row">
        <span class="settings-icon">
            <i class="fa-solid fa-gear"></i>
        </span>
        <h2 id="settings-heading" class="settings-title">
            Preferences & Settings
        </h2>
    </div>
    <button
        type="button"
        class="close-btn"
        onclick={onClose}
        aria-label="Close settings"
    >
        <i class="fa-solid fa-xmark"></i>
    </button>
</div>
