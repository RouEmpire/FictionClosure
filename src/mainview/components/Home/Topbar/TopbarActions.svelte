<script lang="ts">
    interface Props {
        onOpenSettings: () => void;
        onShowToast: (msg: string) => void;
    }

    let { onOpenSettings, onShowToast }: Props = $props();

    function handleTodo(featureName: string) {
        onShowToast(`${featureName} is planned for a future update (TODO)`);
    }
</script>

<div class="topbar-right">
    <!-- Tutorial Button (Marked as TODO) -->
    <button
        type="button"
        class="action-pill-btn todo-btn"
        onclick={() => handleTodo("Interactive Writing Tutorial")}
        title="Tutorial: interactive walkthrough for authors [TODO]"
    >
        <span class="btn-icon"><i class="fa-solid fa-lightbulb"></i></span>
        <span>Tutorial</span>
        <span class="todo-pill">TODO</span>
    </button>

    <!-- Document Button (Marked as TODO) -->
    <button
        type="button"
        class="action-pill-btn todo-btn"
        onclick={() => handleTodo("Product Documentation & Guides")}
        title="Documentation: Markdown syntax and writing guidelines [TODO]"
    >
        <span class="btn-icon"><i class="fa-solid fa-book"></i></span>
        <span>Docs</span>
        <span class="todo-pill">TODO</span>
    </button>

    <!-- Settings Button -->
    <button
        type="button"
        class="icon-action-btn"
        onclick={onOpenSettings}
        title="Preferences & Settings (Ctrl+P)"
        aria-label="Settings"
    >
        <i class="fa-solid fa-gear"></i>
    </button>
</div>
