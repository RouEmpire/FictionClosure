<script lang="ts">
    import type {
        DocumentType,
        FictionDocument,
        ProjectFolder,
        ProjectInfo,
        ViewMode,
    } from "@shared/types";
    import CommandPalette from "@components/CommandPalette/CommandPalette.svelte";
    import NewDocModal from "@components/NewDocModal/NewDocModal.svelte";
    import ProjectSettingsModal from "./ProjectSettingsModal.svelte";

    interface Props {
        isCommandPaletteOpen: boolean;
        isNewDocModalOpen: boolean;
        isProjectSettingsOpen: boolean;
        project: ProjectInfo;
        documents: FictionDocument[];
        folders: ProjectFolder[];
        newDocInitialType: DocumentType;
        newDocInitialMode: "document" | "folder";
        newDocParentFolderId: string | null;
        onCloseCommandPalette: () => void;
        onCloseNewDocModal: () => void;
        onCloseProjectSettings: () => void;
        onOpenProjectSettings: () => void;
        onSelectDoc: (id: string) => void;
        onOpenNewDocModal: (type?: DocumentType) => void;
        onSave: () => void;
        onOpenSettings: () => void;
        onOpenShortcuts: () => void;
        onCreateDoc: (doc: FictionDocument) => void;
        onCreateFolder: (folder: ProjectFolder) => void;
        onSaveProjectSettings: (updated: {
            name: string;
            author: string;
            genre: string;
            targetWordCount: number;
            coverImage?: string;
            readme?: string;
        }) => void;
        onSetViewMode?: (mode: ViewMode) => void;
        onChangeFolder?: () => void;
        onShowToast?: (msg: string) => void;
    }

    let {
        isCommandPaletteOpen,
        isNewDocModalOpen,
        isProjectSettingsOpen,
        project,
        documents,
        folders,
        newDocInitialType,
        newDocInitialMode,
        newDocParentFolderId,
        onCloseCommandPalette,
        onCloseNewDocModal,
        onCloseProjectSettings,
        onOpenProjectSettings,
        onSelectDoc,
        onOpenNewDocModal,
        onSave,
        onOpenSettings,
        onOpenShortcuts,
        onCreateDoc,
        onCreateFolder,
        onSaveProjectSettings,
        onSetViewMode = () => {},
        onChangeFolder,
        onShowToast,
    }: Props = $props();
</script>

<CommandPalette
    isOpen={isCommandPaletteOpen}
    {documents}
    onClose={onCloseCommandPalette}
    {onSelectDoc}
    onNewDoc={onOpenNewDocModal}
    {onSave}
    {onSetViewMode}
    {onChangeFolder}
    {onOpenSettings}
    {onOpenProjectSettings}
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

<ProjectSettingsModal
    isOpen={isProjectSettingsOpen}
    {project}
    {documents}
    onClose={onCloseProjectSettings}
    onSaveSettings={onSaveProjectSettings}
    {onShowToast}
/>
