<script lang="ts">
    interface Props {
        searchQuery: string;
        onNewProject: () => void;
        onImportProject: () => void;
    }

    let { searchQuery, onNewProject, onImportProject }: Props = $props();
</script>

<div class="empty-projects-card">
    <span class="empty-icon">
        <i class="fa-solid fa-folder-open"></i>
    </span>
    <h3>No Projects Found</h3>
    <p>
        {searchQuery
            ? `No projects match "${searchQuery}".`
            : "Create a new project or import an existing folder to begin writing."}
    </p>
    <div class="empty-actions">
        <button
            type="button"
            class="btn primary-action"
            onclick={onNewProject}
        >
            Create Project
        </button>
        <button
            type="button"
            class="btn secondary-action"
            onclick={onImportProject}
        >
            Import Project Folder
        </button>
    </div>
</div>
