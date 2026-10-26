<script lang="ts">
    import type {
        FictionDocument,
        ProjectFolder,
        ViewMode,
        ZenModeType,
    } from "@shared/types";
    import type { GitCommitRecord } from "@shared/domain/git";
    import {
        attachBlameToDiff,
        computeLineDiff,
        type DiffLineItem,
    } from "@shared/domain/diff";
    import { getDocumentRelativePath } from "@shared/domain/documentPaths";
    import type { EditorTypographySettings } from "@shared/domain/typography";
    import { fetchGitFileAtCommit, fetchGitFileBlame } from "@services/git";
    import Editor from "./Editor/Editor.svelte";
    import EditorDiffView from "./Editor/EditorDiffView.svelte";
    import Preview from "./Preview/Preview.svelte";
    import PreviewDiffBody from "./Preview/PreviewDiffBody.svelte";
    import DiffBanner from "./DiffBanner.svelte";
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
        folderPath?: string;
        writerName?: string;
        diffCommit?: GitCommitRecord | null;
        onExitDiff?: () => void;
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
        folderPath = "",
        writerName = "Author",
        diffCommit = null,
        onExitDiff,
        onContentChange,
        onSave,
        onToggleWordWrap,
        onToggleZenMode,
        onExitZen,
        onSelectWikilink,
        onCreateNewDoc,
    }: Props = $props();

    let diffLines = $state<DiffLineItem[]>([]);

    $effect(() => {
        if (diffCommit && activeDoc && folderPath) {
            const relPath = getDocumentRelativePath(activeDoc);
            void (async () => {
                const [oldContent, blameList] = await Promise.all([
                    fetchGitFileAtCommit(folderPath, diffCommit.hash, relPath),
                    fetchGitFileBlame(folderPath, relPath, diffCommit.hash),
                ]);
                const rawDiff = computeLineDiff(oldContent, activeDoc.content);
                const blameMap = new Map(blameList.map((b) => [b.lineNumber, b]));
                diffLines = attachBlameToDiff(rawDiff, blameMap, writerName);
            })();
        } else {
            diffLines = [];
        }
    });
</script>

<div class="stage-wrapper">
    {#if diffCommit && onExitDiff}
        <DiffBanner commit={diffCommit} {onExitDiff} />
    {/if}

    <main class="center-stage view-{viewMode}">
        {#if activeDoc}
            {#if viewMode === "editor" || viewMode === "split" || zenMode !== "none"}
                <section class="pane pane-editor" aria-label="Editor">
                    {#if diffCommit}
                        <EditorDiffView
                            {diffLines}
                            {writerName}
                            {typography}
                            customFont={editorFont}
                        />
                    {:else}
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
                    {/if}
                </section>
            {/if}

            {#if viewMode === "split" && zenMode === "none"}
                <div class="pane-divider" aria-hidden="true"></div>
            {/if}

            {#if (viewMode === "preview" || viewMode === "split") && zenMode === "none"}
                <section class="pane pane-preview" aria-label="Reading Preview">
                    {#if diffCommit}
                        <PreviewDiffBody {diffLines} {typography} />
                    {:else}
                        <Preview
                            document={activeDoc}
                            {typography}
                            {onSelectWikilink}
                        />
                    {/if}
                </section>
            {/if}
        {:else}
            <WorkspaceEmptyState onCreateDoc={onCreateNewDoc} />
        {/if}
    </main>
</div>

<style>
    .stage-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: 100%;
        overflow: hidden;
    }

    .center-stage {
        display: flex;
        flex: 1;
        height: 100%;
        overflow: hidden;
        background-color: var(--bg-primary);
    }

    .pane {
        flex: 1;
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .pane-divider {
        width: 1px;
        background-color: var(--border-subtle);
        flex-shrink: 0;
    }
</style>
