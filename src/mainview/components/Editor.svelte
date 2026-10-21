<script lang="ts">
    import type { FictionDocument, ZenModeType } from "../../shared/types";
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
</style>
