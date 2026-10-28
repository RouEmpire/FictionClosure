<script lang="ts">
    import { untrack } from "svelte";
    import type {
        FictionDocument,
        ProjectFolder,
        ZenModeType,
    } from "@shared/types";
    import { calculateWordCount } from "@shared/domain/markdown";
    import {
        calculateRenderedLines,
        calculateUnwrappedLines,
        resolveTeleportOffset,
        type RenderedLine,
    } from "@utils/renderedLines";
    import { globalHistoryManager } from "@services/historyManager";
    import {
        wrapSelection,
        toggleLinePrefix,
    } from "@shared/domain/textFormatting";
    import {
        computeLineHeight,
        formatFontFeatureSettings,
        formatTextAutospace,
        DEFAULT_TYPOGRAPHY_SETTINGS,
        type EditorTypographySettings,
    } from "@shared/domain/typography";
    import EditorToolbar from "./EditorToolbar.svelte";
    import EditorGutter from "./EditorGutter.svelte";
    import EditorStatusbar from "./EditorStatusbar.svelte";
    import EditorMentionPopover from "./EditorMentionPopover.svelte";
    import EditorFindReplace from "./EditorFindReplace.svelte";
    import FocusDimmer from "./FocusDimmer.svelte";
    import type { SearchMatch } from "./findReplaceLogic";
    import {
        buildMentionCandidates,
        detectMentionQuery,
        computeMentionReplacement,
        type MentionItem,
    } from "./editorMentions";
    import { handleEditorKeyDown } from "./editorKeybindings";
    import {
        performUndo,
        performRedo,
        performTransform,
        performInsertSnippet,
        performInsertTab,
    } from "./editorTextActions";
    import { DEFAULT_VIM_SETTINGS, type VimMode, type VimSettings } from "@shared/domain/vim";
    import { setupVimTextarea } from "./editorVim";

    interface Props {
        document: FictionDocument;
        allDocuments?: FictionDocument[];
        folders?: ProjectFolder[];
        customFont?: string;
        typography?: EditorTypographySettings;
        vimSettings?: VimSettings;
        wordWrap?: boolean;
        zenMode?: ZenModeType;
        onContentChange: (newContent: string) => void;
        onSave: () => void;
        onToggleWordWrap?: () => void;
        onToggleZenMode?: (mode: ZenModeType) => void;
        onExitZen?: () => void;
    }

    let {
        document,
        allDocuments = [],
        folders = [],
        customFont = "",
        typography = DEFAULT_TYPOGRAPHY_SETTINGS,
        vimSettings = DEFAULT_VIM_SETTINGS,
        wordWrap: externalWordWrap,
        zenMode = "none",
        onContentChange,
        onSave,
        onToggleWordWrap,
        onToggleZenMode,
        onExitZen,
    }: Props = $props();

    let internalWordWrap = $state(true);
    let wordWrap = $derived(
        typeof externalWordWrap === "boolean"
            ? externalWordWrap
            : internalWordWrap,
    );

    function toggleWordWrap() {
        if (onToggleWordWrap) {
            onToggleWordWrap();
        } else {
            internalWordWrap = !internalWordWrap;
        }
    }

    let textareaEl: HTMLTextAreaElement | null = $state(null);
    let mirrorEl: HTMLDivElement | null = $state(null);
    let gutterEl: HTMLDivElement | null = $state(null);
    let cursorLine = $state(1);
    let cursorCol = $state(1);
    let renderedLines = $state<RenderedLine[]>([]);
    let textareaScrollTop = $state(0);
    let textareaScrollLeft = $state(0);

    const isFocusMode = $derived(zenMode === "focus" || zenMode === "czm");
    const activeTypography = $derived(
        typography || DEFAULT_TYPOGRAPHY_SETTINGS,
    );
    const computedLineHeight = $derived(
        computeLineHeight(activeTypography.fontSize),
    );
    const fontFeatureSettingsCss = $derived(
        formatFontFeatureSettings(
            activeTypography.fontFeatures,
            activeTypography.customFontFeaturesText,
        ),
    );
    const textAutospaceCss = $derived(
        formatTextAutospace(
            activeTypography.textAutospace,
            activeTypography.customTextAutospace,
        ),
    );
    const firstLineIndentCss = $derived(`${activeTypography.firstLineIndent}%`);

    let isMouseHidden = $state(false);

    function handleTypingActivity() {
        if (activeTypography.hideMouseOnTyping && !isMouseHidden) {
            isMouseHidden = true;
        }
    }

    const activeFont = $derived(
        customFont || activeTypography.fontFamily || "var(--font-prose)",
    );

    const paragraphCount = $derived.by(() => {
        const lines = document.content.split("\n");
        return Math.max(1, lines.length);
    });

    const docWords = $derived(calculateWordCount(document.content));
    const charCount = $derived(document.content.length);

    function updateRenderedLines() {
        if (!wordWrap) {
            renderedLines = calculateUnwrappedLines(document.content);
            return;
        }
        renderedLines = calculateRenderedLines({
            content: document.content,
            wordWrap,
            textareaEl,
            mirrorEl,
            lineHeight: computedLineHeight,
            fontSize: activeTypography.fontSize,
            textIndent: firstLineIndentCss,
            activeFont,
        });
    }

    $effect(() => {
        void document.content;
        void wordWrap;
        void activeFont;
        void computedLineHeight;
        void activeTypography.fontSize;
        void firstLineIndentCss;
        void textareaEl;
        void mirrorEl;
        updateRenderedLines();
    });

    $effect(() => {
        if (!textareaEl) return;
        const observer = new ResizeObserver(() => updateRenderedLines());
        observer.observe(textareaEl);
        return () => observer.disconnect();
    });

    let currentVimMode = $state<VimMode | null>(null);

    $effect(() => {
        const textarea = textareaEl;
        const _docId = document.id;
        const enabled = vimSettings?.enabled ?? false;
        const indentStyle = vimSettings?.indentStyle ?? "space";
        const indentWidth = vimSettings?.indentWidth ?? 2;

        if (!textarea || !enabled) {
            currentVimMode = null;
            return;
        }

        void _docId;

        const handle = untrack(() =>
            setupVimTextarea(
                textarea,
                { enabled, indentStyle, indentWidth },
                {
                    onContentChange,
                    onSave,
                    onModeChange: (mode) => {
                        currentVimMode = mode;
                    },
                    onAfterTextChange,
                },
            ),
        );

        return () => {
            handle?.destroy();
            currentVimMode = null;
        };
    });

    function updateCursorPosition() {
        if (!textareaEl) return;
        const selStart = textareaEl.selectionStart;
        const textUpToCursor = document.content.slice(0, selStart);
        const lines = textUpToCursor.split("\n");
        cursorLine = lines.length;
        cursorCol = (lines[lines.length - 1]?.length ?? 0) + 1;
        checkMentionTrigger();
    }

    let isMentionOpen = $state(false);
    let mentionQuery = $state("");
    let selectedMentionIndex = $state(0);

    const mentionCandidates = $derived.by<MentionItem[]>(() => {
        if (!isMentionOpen) return [];
        return buildMentionCandidates(
            mentionQuery,
            folders,
            allDocuments,
            document.id,
        );
    });

    function checkMentionTrigger() {
        if (!textareaEl) {
            isMentionOpen = false;
            return;
        }
        const q = detectMentionQuery(textareaEl);
        if (q !== null) {
            mentionQuery = q;
            isMentionOpen = true;
            if (selectedMentionIndex >= mentionCandidates.length) {
                selectedMentionIndex = 0;
            }
        } else {
            isMentionOpen = false;
        }
    }

    function insertMention(item: MentionItem) {
        if (!textareaEl) return;
        const result = computeMentionReplacement(textareaEl, item.name);
        if (!result) return;

        onContentChange(result.newContent);
        textareaEl.value = result.newContent;
        isMentionOpen = false;

        setTimeout(() => {
            if (textareaEl) {
                textareaEl.focus();
                textareaEl.selectionStart = textareaEl.selectionEnd =
                    result.newCursor;
                updateCursorPosition();
            }
        }, 0);
    }

    function handleGutterClick(line: RenderedLine, e: MouseEvent) {
        if (!textareaEl) return;
        e.preventDefault();
        textareaEl.focus();
        const targetOffset = resolveTeleportOffset(line, e.altKey);
        textareaEl.setSelectionRange(targetOffset, targetOffset);
        updateCursorPosition();
    }

    function handleScroll() {
        if (textareaEl) {
            textareaScrollTop = textareaEl.scrollTop;
            textareaScrollLeft = textareaEl.scrollLeft;
            if (gutterEl) {
                gutterEl.scrollTop = textareaEl.scrollTop;
            }
        }
    }

    function onAfterTextChange() {
        updateCursorPosition();
        updateRenderedLines();
    }

    let isFindOpen = $state(false);
    let isReplaceOpen = $state(false);
    let findInitialQuery = $state("");

    function handleOpenFind(withReplace: boolean = false) {
        if (textareaEl) {
            const selStart = textareaEl.selectionStart;
            const selEnd = textareaEl.selectionEnd;
            if (selEnd > selStart && selEnd - selStart < 200) {
                findInitialQuery = textareaEl.value.slice(selStart, selEnd);
            } else {
                findInitialQuery = "";
            }
        }
        isFindOpen = true;
        if (withReplace) {
            isReplaceOpen = true;
        }
    }

    function handleCloseFind() {
        isFindOpen = false;
        if (textareaEl) {
            textareaEl.focus();
        }
    }

    function handleSelectMatch(match: SearchMatch) {
        if (!textareaEl) return;
        textareaEl.focus();
        textareaEl.setSelectionRange(match.start, match.end);

        const textUpToMatch = textareaEl.value.slice(0, match.start);
        const lineIndex = textUpToMatch.split("\n").length - 1;
        const targetScrollTop = lineIndex * computedLineHeight - textareaEl.clientHeight / 2;
        textareaEl.scrollTop = Math.max(0, targetScrollTop);
        updateCursorPosition();
    }

    function handleFindReplace(newContent: string, newCursor: number) {
        const oldVal = document.content;
        globalHistoryManager.recordEdit(
            document.id,
            oldVal,
            newContent,
            newCursor,
        );
        onContentChange(newContent);
        if (textareaEl) {
            textareaEl.value = newContent;
            textareaEl.setSelectionRange(newCursor, newCursor);
        }
        onAfterTextChange();
    }

    function handleFindReplaceAll(newContent: string, count: number) {
        if (count === 0) return;
        const oldVal = document.content;
        const cursor = textareaEl?.selectionStart ?? 0;
        globalHistoryManager.recordEdit(
            document.id,
            oldVal,
            newContent,
            cursor,
        );
        onContentChange(newContent);
        if (textareaEl) {
            textareaEl.value = newContent;
        }
        onAfterTextChange();
    }

    function handleInput(e: Event) {
        const target = e.target as HTMLTextAreaElement;
        const oldVal = document.content;
        const newVal = target.value;
        globalHistoryManager.recordEdit(
            document.id,
            oldVal,
            newVal,
            target.selectionStart,
        );
        handleTypingActivity();
        onContentChange(newVal);
        onAfterTextChange();
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.defaultPrevented) return;
        if (vimSettings?.enabled && currentVimMode && currentVimMode !== "normal" && e.key === "Escape") {
            return;
        }
        handleTypingActivity();
        handleEditorKeyDown(e, {
            zenMode,
            isMentionOpen,
            mentionCandidates,
            selectedMentionIndex,
            onSelectMentionIndex: (idx) => (selectedMentionIndex = idx),
            onInsertMention: insertMention,
            onCloseMention: () => (isMentionOpen = false),
            onExitZen,
            onToggleZenMode,
            onSave,
            onUndo: () =>
                performUndo(
                    textareaEl,
                    document,
                    onContentChange,
                    onAfterTextChange,
                ),
            onRedo: () =>
                performRedo(
                    textareaEl,
                    document,
                    onContentChange,
                    onAfterTextChange,
                ),
            onToggleWordWrap: toggleWordWrap,
            onOpenFind: handleOpenFind,
            isFindOpen,
            onCloseFind: handleCloseFind,
            applyTransform: (fn) =>
                performTransform(
                    textareaEl,
                    document,
                    fn,
                    onContentChange,
                    onAfterTextChange,
                ),
            onInsertTab: () =>
                performInsertTab(
                    textareaEl,
                    onContentChange,
                    onAfterTextChange,
                ),
        });
    }
</script>

<svelte:window
    onpointermove={() => {
        if (isMouseHidden) isMouseHidden = false;
    }}
/>

<div
    class="editor-container"
    class:is-czm={zenMode === "czm"}
    class:is-focus={isFocusMode}
    class:mouse-hidden-on-typing={isMouseHidden}
    style="
        --active-editor-font: {activeFont};
        --editor-font-size: {activeTypography.fontSize}px;
        --editor-line-height: {computedLineHeight}px;
        --editor-font-weight: {activeTypography.fontWeight};
        --editor-font-feature-settings: {fontFeatureSettingsCss};
        --editor-text-rendering: {activeTypography.textRendering};
        --editor-text-indent: {firstLineIndentCss};
        --editor-text-justify: {activeTypography.textJustify};
        --editor-text-autospace: {textAutospaceCss};
    "
>
    {#if isMouseHidden}
        <div class="wayland-cursor-kick" aria-hidden="true"></div>
    {/if}

    {#if zenMode !== "czm"}
        <EditorToolbar
            {wordWrap}
            onUndo={() =>
                performUndo(
                    textareaEl,
                    document,
                    onContentChange,
                    onAfterTextChange,
                )}
            onRedo={() =>
                performRedo(
                    textareaEl,
                    document,
                    onContentChange,
                    onAfterTextChange,
                )}
            onInsertSnippet={(p, s) =>
                performInsertSnippet(
                    textareaEl,
                    document,
                    p,
                    s,
                    onContentChange,
                    onAfterTextChange,
                )}
            onBold={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) =>
                        wrapSelection(t, s, end, "**", "**", "bold text"),
                    onContentChange,
                    onAfterTextChange,
                )}
            onItalic={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) =>
                        wrapSelection(t, s, end, "*", "*", "italic text"),
                    onContentChange,
                    onAfterTextChange,
                )}
            onWikilink={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) =>
                        wrapSelection(t, s, end, "[[", "]]", "Document"),
                    onContentChange,
                    onAfterTextChange,
                )}
            onBlockquote={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) => toggleLinePrefix(t, s, end, "> "),
                    onContentChange,
                    onAfterTextChange,
                )}
            onBulletList={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) => toggleLinePrefix(t, s, end, "- "),
                    onContentChange,
                    onAfterTextChange,
                )}
            onTaskItem={() =>
                performTransform(
                    textareaEl,
                    document,
                    (t, s, end) => toggleLinePrefix(t, s, end, "- [ ] "),
                    onContentChange,
                    onAfterTextChange,
                )}
            onToggleWordWrap={toggleWordWrap}
            {isFindOpen}
            onToggleFind={() => (isFindOpen ? handleCloseFind() : handleOpenFind(false))}
        />
    {/if}

    <div class="writing-canvas">
        <EditorFindReplace
            isOpen={isFindOpen}
            {isReplaceOpen}
            content={document.content}
            cursorPosition={textareaEl?.selectionStart ?? 0}
            initialQuery={findInitialQuery}
            onClose={handleCloseFind}
            onToggleReplace={(open) => (isReplaceOpen = typeof open === "boolean" ? open : !isReplaceOpen)}
            onSelectMatch={handleSelectMatch}
            onReplace={handleFindReplace}
            onReplaceAll={handleFindReplaceAll}
        />

        <div
            bind:this={mirrorEl}
            class="editor-mirror"
            aria-hidden="true"
        ></div>

        {#if zenMode !== "czm"}
            <EditorGutter
                {renderedLines}
                {cursorLine}
                {zenMode}
                bind:gutterEl
                onGutterClick={handleGutterClick}
            />
        {/if}

        <div class="textarea-wrapper">
            <textarea
                bind:this={textareaEl}
                value={document.content}
                oninput={handleInput}
                onkeydown={handleKeyDown}
                onscroll={handleScroll}
                onclick={updateCursorPosition}
                onkeyup={updateCursorPosition}
                onselect={updateCursorPosition}
                onpointerup={updateCursorPosition}
                class="editor-textarea editor-czm"
                class:no-wrap={!wordWrap}
                placeholder="Begin your story here..."
                spellcheck="true"
                aria-label="Markdown document content"></textarea>

            <FocusDimmer
                {isFocusMode}
                {renderedLines}
                {cursorLine}
                scrollLeft={textareaScrollLeft}
                scrollTop={textareaScrollTop}
            />

            <EditorMentionPopover
                isOpen={isMentionOpen}
                candidates={mentionCandidates}
                selectedIndex={selectedMentionIndex}
                onSelect={insertMention}
            />
        </div>
    </div>

    {#if zenMode !== "czm"}
        <EditorStatusbar
            {cursorLine}
            {cursorCol}
            {paragraphCount}
            renderedLinesCount={renderedLines.length}
            {wordWrap}
            {docWords}
            {charCount}
            vimMode={vimSettings?.enabled ? currentVimMode : null}
        />
    {/if}
</div>
