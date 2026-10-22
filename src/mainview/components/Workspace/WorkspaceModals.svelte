<script lang="ts">
    import type {
        DocumentType,
        FictionDocument,
        ProjectFolder,
    } from "@shared/types";
    import CommandPalette from "../CommandPalette.svelte";
    import NewDocModal from "@components/NewDocModal/NewDocModal.svelte";

    interface Props {
        isCommandPaletteOpen: boolean;
        isNewDocModalOpen: boolean;
        documents: FictionDocument[];
        folders: ProjectFolder[];
        newDocInitialType: DocumentType;
        newDocInitialMode: "document" | "folder";
        newDocParentFolderId: string | null;
        onCloseCommandPalette: () => void;
        onCloseNewDocModal: () => void;
        onSelectDoc: (id: string) => void;
        onOpenNewDocModal: (type?: DocumentType) => void;
        onSave: () => void;
        onOpenSettings: () => void;
        onOpenShortcuts: () => void;
        onCreateDoc: (doc: FictionDocument) => void;
        onCreateFolder: (folder: ProjectFolder) => void;
    }

    let {
        isCommandPaletteOpen,
        isNewDocModalOpen,
        documents,
        folders,
        newDocInitialType,
        newDocInitialMode,
        newDocParentFolderId,
        onCloseCommandPalette,
        onCloseNewDocModal,
        onSelectDoc,
        onOpenNewDocModal,
        onSave,
        onOpenSettings,
        onOpenShortcuts,
        onCreateDoc,
        onCreateFolder,
    }: Props = $props();
</script>

<CommandPalette
    isOpen={isCommandPaletteOpen}
    {documents}
    onClose={onCloseCommandPalette}
    {onSelectDoc}
    onNewDoc={onOpenNewDocModal}
    {onSave}
    {onOpenSettings}
    {onOpenShortcuts}
/>

<NewDocModal
    isOpen={isNewDocModalOpen}
    initialType={newDocInitialType}
    initialMode={newDocInitialMode}
    initialParentFolderId={newDocParentFolderId}
    {folders}
    onClose={onCloseNewDocModal}
    onCreate={onCreateDoc}
    onCreateFolder={onCreateFolder}
    existingCount={documents.length}
/>
