<script lang="ts">
    import type { DocumentType, FictionDocument, ProjectFolder } from "@shared/types";
    import NewDocModalHeader from "./NewDocModalHeader.svelte";
    import DocumentForm from "./DocumentForm.svelte";
    import FolderForm from "./FolderForm.svelte";
    import NewDocModalFooter from "./NewDocModalFooter.svelte";
    import {
        getDefaultDocTitle,
        getInitialDocContent,
        buildDocRelativePath,
        buildFolderRelativePath,
    } from "./newDocHelpers";
    import "./newDocModal.css";

    interface Props {
        isOpen: boolean;
        initialType?: DocumentType;
        initialMode?: "document" | "folder";
        initialParentFolderId?: string | null;
        folders?: ProjectFolder[];
        onClose: () => void;
        onCreate: (doc: FictionDocument) => void;
        onCreateFolder?: (folder: ProjectFolder) => void;
        existingCount: number;
    }

    let {
        isOpen,
        initialType = "manuscript",
        initialMode = "document",
        initialParentFolderId = null,
        folders = [],
        onClose,
        onCreate,
        onCreateFolder,
        existingCount,
    }: Props = $props();

    let createMode = $state<"document" | "folder">("document");
    let docType = $state<DocumentType>("manuscript");
    let title = $state("");
    let tagsInput = $state("");
    let parentFolderId = $state<string | null>(null);

    // Folder-specific fields
    let folderName = $state("");
    let folderNote = $state("");
    let folderTagsInput = $state("");
    let folderIcon = $state("fa-solid fa-folder");

    let inputEl: HTMLInputElement | null = $state(null);
    let folderInputEl: HTMLInputElement | null = $state(null);

    $effect(() => {
        if (isOpen) {
            createMode = initialMode;
            docType = initialType;
            parentFolderId = initialParentFolderId;

            title = getDefaultDocTitle(docType, existingCount);
            folderName = "New Folder";
            folderNote = "";
            folderTagsInput = "";
            folderIcon = "fa-solid fa-folder";
            tagsInput = "";

            setTimeout(() => {
                if (createMode === "folder") {
                    folderInputEl?.focus();
                    folderInputEl?.select();
                } else {
                    inputEl?.focus();
                    inputEl?.select();
                }
            }, 50);
        }
    });

    function handleSubmit() {
        if (createMode === "folder") {
            handleCreateFolder();
        } else {
            handleCreateDocument();
        }
    }

    function handleCreateDocument() {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const initialContent = getInitialDocContent(docType, trimmedTitle);

        const parentFolder = parentFolderId
            ? folders.find((f) => f.id === parentFolderId)
            : undefined;
        const relativePath = buildDocRelativePath(
            parentFolder,
            docType,
            trimmedTitle,
            existingCount,
        );

        const now = new Date().toISOString();
        const newDoc: FictionDocument = {
            id: `doc-${Date.now()}`,
            title: trimmedTitle,
            type: docType,
            status: "draft",
            tags,
            summary: "",
            order: existingCount + 1,
            folderId: parentFolderId,
            relativePath,
            createdAt: now,
            updatedAt: now,
            content: initialContent,
        };

        onCreate(newDoc);
        onClose();
    }

    function handleCreateFolder() {
        const trimmedName = folderName.trim();
        if (!trimmedName) return;

        const tags = folderTagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const parentFolder = parentFolderId
            ? folders.find((f) => f.id === parentFolderId)
            : undefined;
        const relativePath = buildFolderRelativePath(
            parentFolder,
            docType,
            trimmedName,
        );

        const now = new Date().toISOString();
        const newFolder: ProjectFolder = {
            id: `folder-${Date.now()}`,
            name: trimmedName,
            type: docType,
            icon: folderIcon || "fa-solid fa-folder",
            tags,
            note: folderNote.trim(),
            parentId: parentFolderId,
            relativePath,
            createdAt: now,
            updatedAt: now,
        };

        onCreateFolder?.(newFolder);
        onClose();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }
</script>

{#if isOpen}
    <div
        class="modal-backdrop"
        onclick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}
        role="presentation"
    >
        <div
            class="modal-box"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            tabindex="-1"
            onkeydown={handleKeyDown}
        >
            <NewDocModalHeader
                {createMode}
                onSelectMode={(mode) => (createMode = mode)}
                {onClose}
            />

            <div class="modal-body">
                {#if createMode === "document"}
                    <DocumentForm
                        bind:docType
                        bind:title
                        bind:tagsInput
                        bind:parentFolderId
                        {folders}
                        {existingCount}
                        bind:inputEl
                    />
                {:else}
                    <FolderForm
                        bind:folderName
                        bind:parentFolderId
                        bind:docType
                        bind:folderTagsInput
                        bind:folderNote
                        bind:folderIcon
                        {folders}
                        bind:folderInputEl
                    />
                {/if}
            </div>

            <NewDocModalFooter
                {createMode}
                {onClose}
                onSubmit={handleSubmit}
            />
        </div>
    </div>
{/if}
