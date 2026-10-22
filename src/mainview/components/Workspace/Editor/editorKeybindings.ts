import type { ZenModeType } from "@shared/types";
import {
  wrapSelection,
  toggleLinePrefix,
  toggleTaskCheckbox,
  type TextTransformResult,
} from "@shared/domain/textFormatting";
import type { MentionItem } from "./editorMentions";

export interface EditorKeyContext {
  zenMode: ZenModeType;
  isMentionOpen: boolean;
  mentionCandidates: MentionItem[];
  selectedMentionIndex: number;
  onSelectMentionIndex: (idx: number) => void;
  onInsertMention: (item: MentionItem) => void;
  onCloseMention: () => void;
  onExitZen?: () => void;
  onToggleZenMode?: (mode: ZenModeType) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleWordWrap: () => void;
  applyTransform: (
    fn: (t: string, s: number, e: number) => TextTransformResult,
  ) => void;
  onInsertTab: () => void;
}

export function handleEditorKeyDown(
  e: KeyboardEvent,
  ctx: EditorKeyContext,
): boolean {
  // Mention popup keyboard navigation
  if (ctx.isMentionOpen && ctx.mentionCandidates.length > 0) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      ctx.onSelectMentionIndex(
        (ctx.selectedMentionIndex + 1) % ctx.mentionCandidates.length,
      );
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      ctx.onSelectMentionIndex(
        (ctx.selectedMentionIndex - 1 + ctx.mentionCandidates.length) %
          ctx.mentionCandidates.length,
      );
      return true;
    }
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const chosen = ctx.mentionCandidates[ctx.selectedMentionIndex];
      if (chosen) {
        ctx.onInsertMention(chosen);
      }
      return true;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      ctx.onCloseMention();
      return true;
    }
  }

  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const modPressed = isMac ? e.metaKey : e.ctrlKey;

  // Escape: Exit Zen mode
  if (e.key === "Escape" && ctx.zenMode !== "none") {
    e.preventDefault();
    ctx.onExitZen?.();
    return true;
  }

  // Zen mode shortcuts
  if (
    modPressed &&
    (e.key === "\\" || e.key === "|" || e.code === "Backslash")
  ) {
    e.preventDefault();
    if (e.altKey && !e.shiftKey) {
      ctx.onToggleZenMode?.("czm");
    } else if (e.shiftKey && !e.altKey) {
      ctx.onToggleZenMode?.("focus");
    } else if (!e.shiftKey && !e.altKey) {
      ctx.onToggleZenMode?.("zen");
    }
    return true;
  }

  // Save shortcut
  if (modPressed && e.key.toLowerCase() === "s") {
    e.preventDefault();
    ctx.onSave();
    return true;
  }

  // Redo shortcut: Ctrl+Alt+Z / Ctrl+Shift+Z / Ctrl+Y
  const isRedoKey =
    (modPressed && e.altKey && e.key.toLowerCase() === "z") ||
    (modPressed && e.shiftKey && e.key.toLowerCase() === "z") ||
    (modPressed && e.key.toLowerCase() === "y");

  if (isRedoKey) {
    e.preventDefault();
    ctx.onRedo();
    return true;
  }

  // Undo shortcut: Ctrl+Z
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    ctx.onUndo();
    return true;
  }

  // Toggle word wrap: Ctrl+W
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "w") {
    e.preventDefault();
    ctx.onToggleWordWrap();
    return true;
  }

  // Bold: Ctrl+B
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "b") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "**", "**", "bold text"),
    );
    return true;
  }

  // Italic: Ctrl+I
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "i") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "*", "*", "italic text"),
    );
    return true;
  }

  // Wikilink: Ctrl+L
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "l") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "[[", "]]", "Document"),
    );
    return true;
  }

  // Blockquote: Ctrl+Q
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "q") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "> "));
    return true;
  }

  // List: Ctrl+-
  if (modPressed && !e.altKey && (e.key === "-" || e.key === "_")) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "- "));
    return true;
  }

  // Task Item: Ctrl+Alt+T
  if (modPressed && e.altKey && e.key.toLowerCase() === "t") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "- [ ] "));
    return true;
  }

  // Toggle Task: Ctrl+T
  if (modPressed && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "t") {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleTaskCheckbox(t, s, end));
    return true;
  }

  // Tab
  if (e.key === "Tab") {
    e.preventDefault();
    ctx.onInsertTab();
    return true;
  }

  return false;
}
