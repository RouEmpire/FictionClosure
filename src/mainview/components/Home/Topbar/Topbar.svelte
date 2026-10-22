<script lang="ts">
    import AppMenuBar from "./AppMenuBar.svelte";
    import TopbarActions from "./TopbarActions.svelte";
    import "./topbar.css";

    interface Props {
        onNewProject: () => void;
        onImportProject: () => void;
        onOpenSettings: () => void;
        onOpenShortcuts: () => void;
        onOpenAbout: () => void;
        onShowToast: (msg: string) => void;
    }

    let {
        onNewProject,
        onImportProject,
        onOpenSettings,
        onOpenShortcuts,
        onOpenAbout,
        onShowToast,
    }: Props = $props();
</script>

<header class="home-topbar">
    <div class="topbar-left">
        <AppMenuBar
            {onNewProject}
            {onImportProject}
            {onOpenSettings}
            {onOpenShortcuts}
            {onOpenAbout}
            {onShowToast}
        />
    </div>

    <TopbarActions
        {onOpenSettings}
        {onShowToast}
    />
</header>
