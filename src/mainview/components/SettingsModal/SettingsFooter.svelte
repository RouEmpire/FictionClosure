<script lang="ts">
    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();
</script>

<div class="settings-footer">
    <span class="footer-hint">
        Shortcut: Press <kbd>Ctrl+P</kbd> to toggle Settings anytime
    </span>
    <button type="button" class="btn primary" onclick={onClose}>
        Done
    </button>
</div>
