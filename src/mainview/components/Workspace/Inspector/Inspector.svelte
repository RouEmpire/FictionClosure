<script lang="ts">
    import type { FictionDocument, ProjectFolder } from "../../../../shared/types";
    import InspectorHeader from "./InspectorHeader.svelte";
    import FolderInspector from "./FolderInspector.svelte";
    import DocumentInspector from "./DocumentInspector.svelte";

    interface Props {
        document?: FictionDocument | null;
        folder?: ProjectFolder | null;
        allDocuments?: FictionDocument[];
        allFolders?: ProjectFolder[];
        onUpdateDocMeta?: (updates: Partial<FictionDocument>) => void;
        onUpdateFolderMeta?: (folderId: string, updates: Partial<ProjectFolder>) => void;
        onNavigateToDocTitle?: (title: string) => void;
        onSelectDoc?: (docId: string) => void;
        onSelectFolder?: (folderId: string) => void;
        onClose: () => void;
    }

    let {
        document = null,
        folder = null,
        allDocuments = [],
        allFolders = [],
        onUpdateDocMeta,
        onUpdateFolderMeta,
        onNavigateToDocTitle,
        onSelectDoc,
        onSelectFolder,
        onClose,
    }: Props = $props();

    // Folder statistics and children
    const folderDocs = $derived.by(() => {
        if (!folder || !Array.isArray(allDocuments)) return [];
        return allDocuments.filter((d) => d.folderId === folder.id);
    });

    const folderSubfolders = $derived.by(() => {
        if (!folder || !Array.isArray(allFolders)) return [];
        return allFolders.filter((f) => f.parentId === folder.id);
    });
</script>

<aside class="inspector">
    <InspectorHeader isFolder={Boolean(folder)} {onClose} />

    <div class="inspector-body">
        {#if folder}
            <FolderInspector
                {folder}
                {folderDocs}
                {folderSubfolders}
                {onUpdateFolderMeta}
                {onSelectDoc}
                {onSelectFolder}
            />
        {:else if document}
            <DocumentInspector
                {document}
                {allDocuments}
                {onUpdateDocMeta}
                {onNavigateToDocTitle}
            />
        {:else}
            <div class="empty-inspector-state">
                <i class="fa-solid fa-circle-info"></i>
                <p>Select a document or folder to inspect its properties and metadata.</p>
            </div>
        {/if}
    </div>
</aside>

<style>
    .inspector {
        width: var(--inspector-width);
        background-color: var(--bg-secondary);
        border-left: 1px solid var(--border-subtle);
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        height: calc(100vh - var(--header-height));
        user-select: none;
    }

    .inspector-body {
        flex: 1;
        overflow-y: auto;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .empty-inspector-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 40px 16px;
        color: var(--text-muted);
        gap: 12px;
    }

    .empty-inspector-state i {
        font-size: 28px;
        opacity: 0.5;
    }

    .empty-inspector-state p {
        font-size: 12px;
        line-height: 1.5;
    }
</style>
