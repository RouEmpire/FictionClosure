<script lang="ts">
    import type {
        FictionDocument,
        ProjectFolder,
        ViewMode,
        ZenModeType,
    } from "../../../shared/types";
    import type { EditorTypographySettings } from "../../../shared/domain/typography";
    import Editor from "./Editor/Editor.svelte";
    import Preview from "./Preview/Preview.svelte";
    import WorkspaceEmptyState from "./WorkspaceEmptyState.svelte";

    interface Props {
        activeDoc: FictionDocument | null;
        documents: FictionDocument[];
        folders: ProjectFolder[];
        editorFont?: string;
        typography?: EditorTypographySettings;
        wordWrap: boolean;
        viewMode: ViewMode;
        zenMode: ZenModeType;
        onContentChange: (newContent: string) => void;
        onSave: () => void;
        onToggleWordWrap: () => void;
        onToggleZenMode: (mode: ZenModeType) => void;
        onExitZen: () => void;
        onSelectWikilink: (title: string) => void;
        onCreateNewDoc: () => void;
    }

    let {
        activeDoc,
        documents,
        folders,
        editorFont = "",
        typography,
        wordWrap,
        viewMode,
        zenMode,
        onContentChange,
        onSave,
        onToggleWordWrap,
        onToggleZenMode,
        onExitZen,
        onSelectWikilink,
        onCreateNewDoc,
    }: Props = $props();
</script>

<main class="center-stage view-{viewMode}">
    {#if activeDoc}
        {#if viewMode === "editor" || viewMode === "split" || zenMode !== "none"}
            <section class="pane pane-editor" aria-label="Editor">
                <Editor
                    document={activeDoc}
                    allDocuments={documents}
                    {folders}
                    customFont={editorFont}
                    {typography}
                    {wordWrap}
                    {zenMode}
                    {onContentChange}
                    {onSave}
                    {onToggleWordWrap}
                    {onToggleZenMode}
                    {onExitZen}
                />
            </section>
        {/if}

        {#if viewMode === "split" && zenMode === "none"}
            <div class="pane-divider" aria-hidden="true"></div>
        {/if}

        {#if (viewMode === "preview" || viewMode === "split") && zenMode === "none"}
            <section class="pane pane-preview" aria-label="Reading Preview">
                <Preview
                    document={activeDoc}
                    {typography}
                    {onSelectWikilink}
                />
            </section>
        {/if}
    {:else}
        <WorkspaceEmptyState onCreateDoc={onCreateNewDoc} />
    {/if}
</main>

<style>
    @import "./workspace.css";
</style>
