<script lang="ts">
    import type { FictionDocument, ProjectFolder, ZenModeType } from "../../shared/types";
    import { calculateWordCount } from "../../shared/domain/markdown";
    import {
        calculateRenderedLines,
        calculateUnwrappedLines,
        resolveTeleportOffset,
        getGutterRowDisplay,
        type RenderedLine,
    } from "../utils/renderedLines";
    import { globalHistoryManager } from "../services/historyManager";
    import {
        wrapSelection,
        toggleLinePrefix,
        toggleTaskCheckbox,
        type TextTransformResult,
    } from "../../shared/domain/textFormatting";
    import {
        computeLineHeight,
        formatFontFeatureSettings,
        formatTextAutospace,
        DEFAULT_TYPOGRAPHY_SETTINGS,
        type EditorTypographySettings,
    } from "../../shared/domain/typography";

    interface Props {
        document: FictionDocument;
        allDocuments?: FictionDocument[];
        folders?: ProjectFolder[];
        customFont?: string;
        typography?: EditorTypographySettings;
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
        wordWrap: externalWordWrap,
        zenMode = "none",
        onContentChange,
        onSave,
        onToggleWordWrap,
        onToggleZenMode,
        onExitZen,
    }: Props = $props();

    let fontStyle = $state<"mono" | "serif" | "sans">("serif");
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

    function handlePointerMove() {
        if (isMouseHidden) {
            isMouseHidden = false;
        }
    }

    // Sync active font: custom font takes precedence, otherwise fallback to active preset
    const activeFont = $derived(
        customFont ||
            activeTypography.fontFamily ||
            (fontStyle === "mono"
                ? "var(--font-editor)"
                : fontStyle === "serif"
                  ? "var(--font-prose)"
                  : "var(--font-ui)"),
    );

    // Paragraph / logical line count
    const paragraphCount = $derived.by(() => {
        const lines = document.content.split("\n");
        return Math.max(1, lines.length);
    });

    // Word & character stats
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

    // Reactive effect for content, font, wrap or element changes
    $effect(() => {
        const _c = document.content;
        const _w = wordWrap;
        const _f = activeFont;
        const _lh = computedLineHeight;
        const _fs = activeTypography.fontSize;
        const _ind = firstLineIndentCss;
        const _t = textareaEl;
        const _m = mirrorEl;
        updateRenderedLines();
    });

    // ResizeObserver ensures line wrap recalculated on editor width / window resize
    $effect(() => {
        if (!textareaEl) return;
        const observer = new ResizeObserver(() => {
            updateRenderedLines();
        });
        observer.observe(textareaEl);
        return () => {
            observer.disconnect();
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

    // Mention / Autocomplete State for [[Folder]] and [[Document]]
    interface MentionItem {
        kind: "folder" | "doc";
        id: string;
        name: string;
        subtitle: string;
        icon: string;
        badge: string;
    }

    let isMentionOpen = $state(false);
    let mentionQuery = $state("");
    let selectedMentionIndex = $state(0);

    const mentionCandidates = $derived.by<MentionItem[]>(() => {
        if (!isMentionOpen) return [];
        const q = mentionQuery.trim().toLowerCase();
        const results: MentionItem[] = [];

        // 1. Folders
        for (const f of folders) {
            if (!q || f.name.toLowerCase().includes(q) || (f.tags || []).some((t) => t.toLowerCase().includes(q))) {
                results.push({
                    kind: "folder",
                    id: f.id,
                    name: f.name,
                    subtitle: f.note || f.relativePath,
                    icon: f.icon || "fa-solid fa-folder",
                    badge: "Folder",
                });
            }
        }

        // 2. Documents
        for (const d of allDocuments) {
            if (d.id === document.id) continue;
            if (!q || d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))) {
                results.push({
                    kind: "doc",
                    id: d.id,
                    name: d.title,
                    subtitle: d.summary || `${d.type} document`,
                    icon: "fa-solid fa-file-lines",
                    badge: d.type,
                });
            }
        }

        return results.slice(0, 8);
    });

    function checkMentionTrigger() {
        if (!textareaEl) {
            isMentionOpen = false;
            return;
        }
        const val = textareaEl.value;
        const pos = textareaEl.selectionStart;
        const textBefore = val.slice(0, pos);
        const match = /(?:^|[^\\])\[\[([^\]\n]*)$/.exec(textBefore);
        if (match) {
            mentionQuery = match[1] ?? "";
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
        const val = textareaEl.value;
        const cursorPos = textareaEl.selectionStart;
        const textBefore = val.slice(0, cursorPos);
        const match = /(?:^|[^\\])\[\[([^\]\n]*)$/.exec(textBefore);
        if (!match) return;

        const openBracketIdx = textBefore.lastIndexOf("[[");
        const beforeBracket = val.slice(0, openBracketIdx);
        const afterCursor = val.slice(cursorPos);
        const cleanAfter = afterCursor.startsWith("]]") ? afterCursor.slice(2) : afterCursor;
        const replacement = `[[${item.name}]]`;
        const newVal = beforeBracket + replacement + cleanAfter;

        onContentChange(newVal);
        textareaEl.value = newVal;
        const newCursor = beforeBracket.length + replacement.length;
        isMentionOpen = false;

        setTimeout(() => {
            if (textareaEl) {
                textareaEl.focus();
                textareaEl.selectionStart = textareaEl.selectionEnd = newCursor;
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

    function handleUndo() {
        if (!textareaEl) return;
        const snapshot = globalHistoryManager.undo(
            document.id,
            document.content,
            textareaEl.selectionStart,
        );
        if (snapshot) {
            onContentChange(snapshot.content);
            textareaEl.value = snapshot.content;
            if (typeof snapshot.cursor === "number") {
                textareaEl.setSelectionRange(snapshot.cursor, snapshot.cursor);
            }
            updateCursorPosition();
            updateRenderedLines();
        }
    }

    function handleRedo() {
        if (!textareaEl) return;
        const snapshot = globalHistoryManager.redo(
            document.id,
            document.content,
            textareaEl.selectionStart,
        );
        if (snapshot) {
            onContentChange(snapshot.content);
            textareaEl.value = snapshot.content;
            if (typeof snapshot.cursor === "number") {
                textareaEl.setSelectionRange(snapshot.cursor, snapshot.cursor);
            }
            updateCursorPosition();
            updateRenderedLines();
        }
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
        updateCursorPosition();
        updateRenderedLines();
    }

    function applyTransform(
        transformFn: (
            text: string,
            start: number,
            end: number,
        ) => TextTransformResult,
    ) {
        if (!textareaEl) return;
        const start = textareaEl.selectionStart;
        const end = textareaEl.selectionEnd;
        const oldContent = document.content;
        const res = transformFn(oldContent, start, end);

        globalHistoryManager.recordEdit(
            document.id,
            oldContent,
            res.newText,
            res.newStart,
            true,
        );
        onContentChange(res.newText);
        textareaEl.value = res.newText;

        setTimeout(() => {
            if (textareaEl) {
                textareaEl.focus();
                textareaEl.setSelectionRange(res.newStart, res.newEnd);
                updateCursorPosition();
                updateRenderedLines();
            }
        }, 0);
    }

    function handleKeyDown(e: KeyboardEvent) {
        handleTypingActivity();

        // Mention popup keyboard navigation
        if (isMentionOpen && mentionCandidates.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                selectedMentionIndex = (selectedMentionIndex + 1) % mentionCandidates.length;
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                selectedMentionIndex =
                    (selectedMentionIndex - 1 + mentionCandidates.length) % mentionCandidates.length;
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const chosen = mentionCandidates[selectedMentionIndex];
                if (chosen) {
                    insertMention(chosen);
                }
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                isMentionOpen = false;
                return;
            }
        }

        const isMac =
            typeof navigator !== "undefined" &&
            /Mac|iPhone|iPad|iPod/.test(navigator.platform);
        const modPressed = isMac ? e.metaKey : e.ctrlKey;

        // Escape: Exit Zen mode
        if (e.key === "Escape" && zenMode !== "none") {
            e.preventDefault();
            onExitZen?.();
            return;
        }

        // Zen mode shortcuts
        if (
            modPressed &&
            (e.key === "\\" || e.key === "|" || e.code === "Backslash")
        ) {
            e.preventDefault();
            if (e.altKey && !e.shiftKey) {
                onToggleZenMode?.("czm");
            } else if (e.shiftKey && !e.altKey) {
                onToggleZenMode?.("focus");
            } else if (!e.shiftKey && !e.altKey) {
                onToggleZenMode?.("zen");
            }
            return;
        }

        // Save shortcut: Ctrl+S / Cmd+S
        if (modPressed && e.key.toLowerCase() === "s") {
            e.preventDefault();
            onSave();
            return;
        }

        // Redo shortcut: Ctrl+Alt+Z / Cmd+Option+Z (also accept Ctrl+Shift+Z and Ctrl+Y)
        const isRedoKey =
            (modPressed && e.altKey && e.key.toLowerCase() === "z") ||
            (modPressed && e.shiftKey && e.key.toLowerCase() === "z") ||
            (modPressed && e.key.toLowerCase() === "y");

        if (isRedoKey) {
            e.preventDefault();
            handleRedo();
            return;
        }

        // Undo shortcut: Ctrl+Z / Cmd+Z
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "z"
        ) {
            e.preventDefault();
            handleUndo();
            return;
        }

        // Toggle word wrap: Ctrl+W / Cmd+W
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "w"
        ) {
            e.preventDefault();
            toggleWordWrap();
            return;
        }

        // Bold: Ctrl+B / Cmd+B (when NOT holding Alt, so Ctrl+Alt+B still toggles sidebar)
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "b"
        ) {
            e.preventDefault();
            applyTransform((t, s, e) =>
                wrapSelection(t, s, e, "**", "**", "bold text"),
            );
            return;
        }

        // Italic: Ctrl+I / Cmd+I
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "i"
        ) {
            e.preventDefault();
            applyTransform((t, s, e) =>
                wrapSelection(t, s, e, "*", "*", "italic text"),
            );
            return;
        }

        // Wikilink: Ctrl+L / Cmd+L
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "l"
        ) {
            e.preventDefault();
            applyTransform((t, s, e) =>
                wrapSelection(t, s, e, "[[", "]]", "Document"),
            );
            return;
        }

        // Blockquote: Ctrl+Q / Cmd+Q
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "q"
        ) {
            e.preventDefault();
            applyTransform((t, s, e) => toggleLinePrefix(t, s, e, "> "));
            return;
        }

        // List: Ctrl+- / Cmd+- (hyphen or minus)
        if (modPressed && !e.altKey && (e.key === "-" || e.key === "_")) {
            e.preventDefault();
            applyTransform((t, s, e) => toggleLinePrefix(t, s, e, "- "));
            return;
        }

        // Task Item: Ctrl+Alt+T / Cmd+Option+T
        if (modPressed && e.altKey && e.key.toLowerCase() === "t") {
            e.preventDefault();
            applyTransform((t, s, e) => toggleLinePrefix(t, s, e, "- [ ] "));
            return;
        }

        // Toggle Task [ ] / [x]: Ctrl+T / Cmd+T (without Alt)
        if (
            modPressed &&
            !e.altKey &&
            !e.shiftKey &&
            e.key.toLowerCase() === "t"
        ) {
            e.preventDefault();
            applyTransform((t, s, e) => toggleTaskCheckbox(t, s, e));
            return;
        }

        // Tab indentation support
        if (e.key === "Tab") {
            e.preventDefault();
            if (!textareaEl) return;
            const start = textareaEl.selectionStart;
            const end = textareaEl.selectionEnd;
            const val = textareaEl.value;

            // Insert 2 spaces
            const newVal = val.substring(0, start) + "  " + val.substring(end);
            onContentChange(newVal);

            // Reposition cursor
            setTimeout(() => {
                if (textareaEl) {
                    textareaEl.selectionStart = textareaEl.selectionEnd =
                        start + 2;
                    updateCursorPosition();
                }
            }, 0);
        }
    }

    function insertSnippet(prefix: string, suffix: string = "") {
        if (!textareaEl) return;
        const start = textareaEl.selectionStart;
        const end = textareaEl.selectionEnd;
        const text = textareaEl.value;
        const selected = text.substring(start, end);

        const oldContent = document.content;
        const replacement = prefix + (selected || "text") + suffix;
        const newContent =
            text.substring(0, start) + replacement + text.substring(end);
        globalHistoryManager.recordEdit(
            document.id,
            oldContent,
            newContent,
            start + prefix.length,
            true,
        );
        onContentChange(newContent);

        setTimeout(() => {
            if (textareaEl) {
                textareaEl.focus();
                textareaEl.setSelectionRange(
                    start + prefix.length,
                    start + prefix.length + (selected.length || 4),
                );
                updateCursorPosition();
            }
        }, 0);
    }
</script>

<svelte:window onpointermove={handlePointerMove} />

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
    <!-- Editor Toolbar: hidden in CZM -->
    {#if zenMode !== "czm"}
        <div class="editor-toolbar">
            <div class="toolbar-group">
                <button
                    type="button"
                    class="tool-btn"
                    onclick={handleUndo}
                    title="Undo (Ctrl+Z)"
                >
                    <i class="fa-solid fa-rotate-left"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={handleRedo}
                    title="Redo (Ctrl+Alt+Z)"
                >
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <div class="tool-divider"></div>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() => insertSnippet("# ", "")}
                    title="Heading 1"
                >
                    H1
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() => insertSnippet("## ", "")}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() => insertSnippet("### ", "")}
                    title="Heading 3"
                >
                    H3
                </button>
                <div class="tool-divider"></div>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            wrapSelection(t, s, e, "**", "**", "bold text"),
                        )}
                    title="Bold (Ctrl+B)"
                >
                    <i class="fa-solid fa-bold"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            wrapSelection(t, s, e, "*", "*", "italic text"),
                        )}
                    title="Italic (Ctrl+I)"
                >
                    <i class="fa-solid fa-italic"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            wrapSelection(t, s, e, "[[", "]]", "Document"),
                        )}
                    title="Insert Wikilink (Ctrl+L)"
                >
                    <i class="fa-solid fa-anchor"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            toggleLinePrefix(t, s, e, "> "),
                        )}
                    title="Blockquote (Ctrl+Q)"
                >
                    <i class="fa-solid fa-quote-left"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            toggleLinePrefix(t, s, e, "- "),
                        )}
                    title="Bullet List (Ctrl+-)"
                >
                    <i class="fa-solid fa-list-ul"></i>
                </button>
                <button
                    type="button"
                    class="tool-btn"
                    onclick={() =>
                        applyTransform((t, s, e) =>
                            toggleLinePrefix(t, s, e, "- [ ] "),
                        )}
                    title="Task Item (Ctrl+Alt+T, Toggle: Ctrl+T)"
                >
                    <i class="fa-solid fa-square-check"></i>
                </button>
            </div>

            <div class="toolbar-right">
                <!-- Wrap toggle -->
                <button
                    type="button"
                    class="tool-btn"
                    class:active={wordWrap}
                    onclick={toggleWordWrap}
                    title="Toggle Word Wrap (Ctrl+W)"
                >
                    ↩ Wrap
                </button>
            </div>
        </div>
    {/if}

    <!-- Main Writing Canvas: Gutter and Textarea share identical font-family, line-height, and padding -->
    <div class="writing-canvas">
        <!-- Hidden mirror element used for measuring rendered wrapped lines -->
        <div
            bind:this={mirrorEl}
            class="editor-mirror"
            aria-hidden="true"
        ></div>

        <!-- Line Numbers Gutter: hidden in Concentrate Zen Mode (CZM) -->
        {#if zenMode !== "czm"}
            <div class="gutter" bind:this={gutterEl}>
                {#each renderedLines as line, idx (idx)}
                    {@const row = getGutterRowDisplay(
                        line,
                        cursorLine,
                        zenMode,
                    )}
                    <div
                        class="gutter-number"
                        class:current={row.isCurrent}
                        class:is-dash={row.isDash}
                        class:dimmed={row.isDimmed}
                        role="button"
                        tabindex="-1"
                        title={line.isParagraphStart
                            ? `Line ${line.paragraphIndex} (Click: jump to start, Alt+Click: jump to end)`
                            : `Line ${line.paragraphIndex} (wrapped) (Click: jump to start, Alt+Click: jump to end)`}
                        onclick={(e) => handleGutterClick(line, e)}
                        onkeydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleGutterClick(
                                    line,
                                    e as unknown as MouseEvent,
                                );
                            }
                        }}
                    >
                        {row.text || "\u00A0"}
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Textarea and Focus Dimmer Wrapper -->
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

            {#if isFocusMode}
                <div
                    class="focus-dimmer-overlay"
                    aria-hidden="true"
                    style="transform: translate(-{textareaScrollLeft}px, -{textareaScrollTop}px);"
                >
                    {#each renderedLines as line, idx (idx)}
                        <div
                            class="dimmer-line"
                            class:is-active-paragraph={line.paragraphIndex ===
                                cursorLine}
                        ></div>
                    {/each}
                </div>
            {/if}

            <!-- Mention Autocomplete Popover for [[Folder]] and [[Document]] -->
            {#if isMentionOpen && mentionCandidates.length > 0}
                <div class="mention-popover" role="listbox" aria-label="Mention suggestion list">
                    <div class="mention-popover-header">
                        <span class="mention-header-title"><i class="fa-solid fa-at"></i> Mention</span>
                        <span class="mention-hint">↑↓ navigate • Enter insert • Esc close</span>
                    </div>
                    <div class="mention-items-list">
                        {#each mentionCandidates as item, idx (item.id)}
                            <button
                                type="button"
                                class="mention-item-btn"
                                class:selected={idx === selectedMentionIndex}
                                role="option"
                                aria-selected={idx === selectedMentionIndex}
                                onclick={() => insertMention(item)}
                            >
                                <span class="mention-icon"><i class={item.icon}></i></span>
                                <div class="mention-text-col">
                                    <span class="mention-name">{item.name}</span>
                                    {#if item.subtitle}
                                        <span class="mention-sub">{item.subtitle}</span>
                                    {/if}
                                </div>
                                <span class="mention-badge badge-{item.kind}">{item.badge}</span>
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Status Bar: hidden in Concentrate Zen Mode (CZM) -->
    {#if zenMode !== "czm"}
        <div class="editor-statusbar">
            <div class="status-left">
                <span>Ln {cursorLine}, Col {cursorCol}</span>
                <span class="status-dot-sep">•</span>
                <span
                    >{paragraphCount} lines{wordWrap &&
                    renderedLines.length !== paragraphCount
                        ? ` (${renderedLines.length} visual)`
                        : ""}</span
                >
            </div>
            <div class="status-right">
                <span>{docWords.toLocaleString()} words</span>
                <span class="status-dot-sep">•</span>
                <span>{charCount.toLocaleString()} chars</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .editor-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background-color: var(--bg-primary);
        position: relative;
        overflow: hidden;
    }

    .editor-toolbar {
        height: 38px;
        background-color: var(--bg-secondary);
        border-bottom: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px;
        flex-shrink: 0;
        user-select: none;
    }

    .toolbar-group,
    .toolbar-right {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .tool-btn {
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        border-radius: 4px;
        padding: 3px 7px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: all 0.15s ease;
    }

    .tool-btn:hover {
        background-color: var(--bg-hover);
        color: var(--text-primary);
        border-color: var(--border-subtle);
    }

    .tool-btn.active {
        background-color: var(--bg-active);
        color: var(--accent-primary);
        border-color: var(--accent-primary);
    }

    .tool-divider {
        width: 1px;
        height: 16px;
        background-color: var(--border-subtle);
        margin: 0 4px;
    }

    .writing-canvas {
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
        background-color: var(--bg-primary);
    }

    .gutter {
        width: 54px;
        background-color: var(--bg-primary);
        border-right: 1px solid var(--border-subtle);
        padding: 16px 8px;
        text-align: right;
        color: var(--text-muted);
        font-family: var(--active-editor-font);
        user-select: none;
        overflow-y: hidden;
        overflow-x: hidden;
        flex-shrink: 0;
        box-sizing: border-box;
    }

    .editor-container.mouse-hidden-on-typing,
    .editor-container.mouse-hidden-on-typing * {
        cursor: none !important;
    }

    .wayland-cursor-kick {
        position: absolute;
        top: 0;
        left: 0;
        width: 1px;
        height: 1px;
        opacity: 0.001;
        pointer-events: none;
        cursor: none !important;
    }

    .gutter-number {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        font-size: calc(var(--editor-font-size, 15px) - 2px);
        opacity: 0.45;
        cursor: pointer;
        transition:
            color 0.1s ease,
            opacity 0.1s ease,
            background-color 0.1s ease;
        border-radius: 2px;
        padding: 0 4px;
    }

    .gutter-number:hover {
        opacity: 0.9;
        background-color: var(--bg-hover);
        color: var(--text-primary);
    }

    .gutter-number.current {
        opacity: 1;
        color: var(--accent-primary);
        font-weight: 700;
    }

    .gutter-number.is-dash {
        font-weight: 400;
        font-size: calc(var(--editor-font-size, 15px) - 2px);
        opacity: 0.35;
    }

    .gutter-number.is-dash.current {
        opacity: 0.9;
        font-weight: 700;
        color: var(--accent-primary);
    }

    .gutter-number.dimmed {
        opacity: 0.22;
    }

    .gutter-number.dimmed:hover {
        opacity: 0.8;
    }

    .textarea-wrapper {
        position: relative;
        flex: 1;
        height: 100%;
        display: flex;
        overflow: hidden;
    }

    .focus-dimmer-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        pointer-events: none;
        padding: 16px 20px;
        box-sizing: border-box;
        will-change: transform;
    }

    .dimmer-line {
        height: var(--editor-line-height, 26px);
        line-height: var(--editor-line-height, 26px);
        box-sizing: border-box;
        background-color: var(--bg-primary);
        opacity: 0.5;
        transition:
            opacity 0.15s ease,
            background-color 0.15s ease;
    }

    .dimmer-line.is-active-paragraph {
        opacity: 0;
        background-color: transparent;
    }

    .editor-container.is-czm .writing-canvas {
        max-width: 840px;
        width: 100%;
        margin: 0 auto;
        padding: 30px 0;
    }

    .editor-mirror {
        position: absolute;
        top: -99999px;
        left: -99999px;
        visibility: hidden;
        pointer-events: none;
        z-index: -9999;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: normal;
        font-family: var(--active-editor-font);
        font-size: var(--editor-font-size, 15px);
        line-height: var(--editor-line-height, 26px);
        font-weight: var(--editor-font-weight, 400);
        font-feature-settings: var(--editor-font-feature-settings, normal);
        text-rendering: var(--editor-text-rendering, auto);
        text-indent: var(--editor-text-indent, 0%);
        box-sizing: border-box;
        padding: 16px 20px;
        tab-size: 2;
        overflow-y: hidden;
    }

    .editor-textarea {
        flex: 1;
        background-color: transparent;
        border: none;
        outline: none;
        color: var(--text-primary);
        padding: 16px 20px;
        font-family: var(--active-editor-font);
        font-size: var(--editor-font-size, 15px);
        line-height: var(--editor-line-height, 26px);
        font-weight: var(--editor-font-weight, 400);
        font-feature-settings: var(--editor-font-feature-settings, normal);
        text-rendering: var(--editor-text-rendering, auto);
        text-indent: var(--editor-text-indent, 0%);
        text-align: justify;
        text-justify: var(--editor-text-justify, auto);
        text-autospace: var(--editor-text-autospace, normal);
        -webkit-text-autospace: var(--editor-text-autospace, normal);
        resize: none;
        overflow-y: auto;
        tab-size: 2;
        box-sizing: border-box;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: normal;
    }

    .editor-czm {
        /* Standard modern syntax (works on newer WebKitGTK / Eletrobun) */
        scrollbar-width: none !important;
    }
    .editor-czm::-webkit-scrollbar {
        display: none !important;
        width: 0;
        height: 0;
    }

    .editor-textarea.no-wrap {
        white-space: pre;
        overflow-x: auto;
        overflow-wrap: normal;
        word-break: normal;
    }

    .editor-statusbar {
        height: var(--status-height);
        background-color: var(--bg-secondary);
        border-top: 1px solid var(--border-subtle);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        font-size: 11px;
        color: var(--text-muted);
        user-select: none;
        flex-shrink: 0;
    }

    .status-left,
    .status-right {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .status-dot-sep {
        opacity: 0.4;
    }

    /* Mention Autocomplete Popover */
    .mention-popover {
        position: absolute;
        bottom: 44px;
        right: 24px;
        width: 320px;
        max-width: calc(100% - 48px);
        background: var(--bg-secondary);
        border: 1px solid var(--border-bold);
        border-radius: 8px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
        z-index: 100;
        overflow: hidden;
        animation: mentionFadeIn 0.12s ease-out;
        user-select: none;
    }

    @keyframes mentionFadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .mention-popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 10px;
        background: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-subtle);
        font-size: 10px;
        color: var(--text-muted);
    }

    .mention-header-title {
        font-weight: 600;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .mention-hint {
        font-size: 9px;
        opacity: 0.7;
    }

    .mention-items-list {
        max-height: 220px;
        overflow-y: auto;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .mention-item-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 5px;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        width: 100%;
        transition: all 0.1s ease;
    }

    .mention-item-btn:hover {
        background: var(--bg-hover);
    }

    .mention-item-btn.selected {
        background: var(--accent-subtle);
        border-color: rgba(230, 157, 69, 0.35);
    }

    .mention-icon {
        font-size: 13px;
        color: var(--text-secondary);
        width: 16px;
        text-align: center;
        flex-shrink: 0;
    }

    .mention-item-btn.selected .mention-icon {
        color: var(--accent-primary);
    }

    .mention-text-col {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .mention-name {
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mention-sub {
        font-size: 10px;
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .mention-badge {
        font-size: 9px;
        text-transform: uppercase;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        flex-shrink: 0;
    }

    .mention-badge.badge-folder {
        background: var(--accent-secondary-subtle, rgba(88, 166, 255, 0.15));
        color: var(--accent-secondary, #58a6ff);
        border: 1px solid rgba(88, 166, 255, 0.3);
    }

    .mention-badge.badge-doc {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-subtle);
    }
</style>
