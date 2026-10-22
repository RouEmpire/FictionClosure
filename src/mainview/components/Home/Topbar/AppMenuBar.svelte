<script lang="ts">
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

    let activeMenu = $state<string | null>(null);

    function toggleMenu(name: string) {
        activeMenu = activeMenu === name ? null : name;
    }

    function closeMenu() {
        activeMenu = null;
    }

    function handleAction(actionFn: () => void) {
        closeMenu();
        actionFn();
    }

    function handleTodo(featureName: string) {
        closeMenu();
        onShowToast(`${featureName} is planned for a future update (TODO)`);
    }
</script>

<svelte:window
    onclick={(e) => {
        if (activeMenu) {
            const target = e.target as HTMLElement;
            if (!target.closest(".app-menu-bar")) {
                activeMenu = null;
            }
        }
    }}
    onkeydown={(e) => {
        if (activeMenu && e.key === "Escape") {
            activeMenu = null;
        }
    }}
/>

<nav class="app-menu-bar" aria-label="Application menu">
    <!-- File Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "file"}
            onclick={() => toggleMenu("file")}
            aria-expanded={activeMenu === "file"}
            aria-haspopup="true"
        >
            File
        </button>
        {#if activeMenu === "file"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onNewProject)}
                >
                    <span>New Project...</span>
                    <kbd>Ctrl+N</kbd>
                </button>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onImportProject)}
                >
                    <span>Open / Import Project...</span>
                    <kbd>Ctrl+O</kbd>
                </button>
                <div class="menu-divider"></div>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onOpenSettings)}
                >
                    <span>Preferences...</span>
                    <kbd>Ctrl+P</kbd>
                </button>
            </div>
        {/if}
    </div>

    <!-- Edit Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "edit"}
            onclick={() => toggleMenu("edit")}
            aria-expanded={activeMenu === "edit"}
            aria-haspopup="true"
        >
            Edit
        </button>
        {#if activeMenu === "edit"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item disabled"
                    disabled
                >
                    <span>Undo</span>
                    <kbd>Ctrl+Z</kbd>
                </button>
                <button
                    type="button"
                    class="dropdown-item disabled"
                    disabled
                >
                    <span>Redo</span>
                    <kbd>Ctrl+Alt+Z</kbd>
                </button>
                <div class="menu-divider"></div>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onOpenSettings)}
                >
                    <span>Editor Font Settings...</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- View Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "view"}
            onclick={() => toggleMenu("view")}
            aria-expanded={activeMenu === "view"}
            aria-haspopup="true"
        >
            View
        </button>
        {#if activeMenu === "view"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onOpenShortcuts)}
                >
                    <span>Keyboard Shortcuts Cheatsheet</span>
                    <kbd>?</kbd>
                </button>
                <div class="menu-divider"></div>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleTodo("Fullscreen Mode")}
                >
                    <span>Toggle Fullscreen [TODO]</span>
                    <kbd>F11</kbd>
                </button>
            </div>
        {/if}
    </div>

    <!-- Selection Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "selection"}
            onclick={() => toggleMenu("selection")}
            aria-expanded={activeMenu === "selection"}
            aria-haspopup="true"
        >
            Selection
        </button>
        {#if activeMenu === "selection"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleTodo("Multi-select")}
                >
                    <span>Select All Projects [TODO]</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- Tools Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "tools"}
            onclick={() => toggleMenu("tools")}
            aria-expanded={activeMenu === "tools"}
            aria-haspopup="true"
        >
            Tools
        </button>
        {#if activeMenu === "tools"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onImportProject)}
                >
                    <span>Validate & Analyze Project Structure...</span>
                </button>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleTodo("Extension Manager")}
                >
                    <span>Extensions Manager [TODO]</span>
                </button>
            </div>
        {/if}
    </div>

    <!-- Help Menu -->
    <div class="menu-item-wrapper">
        <button
            type="button"
            class="menu-bar-btn"
            class:active={activeMenu === "help"}
            onclick={() => toggleMenu("help")}
            aria-expanded={activeMenu === "help"}
            aria-haspopup="true"
        >
            Help
        </button>
        {#if activeMenu === "help"}
            <div class="menu-dropdown" role="menu">
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onOpenShortcuts)}
                >
                    <span>Keyboard Shortcuts</span>
                    <kbd>?</kbd>
                </button>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleTodo("Tutorial Guide")}
                >
                    <span>Tutorial Guide [TODO]</span>
                </button>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleTodo("Documentation")}
                >
                    <span>Documentation [TODO]</span>
                </button>
                <div class="menu-divider"></div>
                <button
                    type="button"
                    class="dropdown-item"
                    onclick={() => handleAction(onOpenAbout)}
                >
                    <span>About FictionClosure</span>
                </button>
            </div>
        {/if}
    </div>
</nav>
