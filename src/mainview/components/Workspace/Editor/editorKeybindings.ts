import type { ZenModeType } from "@shared/types";
import {
  wrapSelection,
  toggleLinePrefix,
  toggleTaskCheckbox,
  type TextTransformResult,
} from "@shared/domain/textFormatting";
import { matchesAction, type KeybindingActionId } from "@shared/domain/keybindings";
import type { MentionItem } from "./editorMentions";

export interface EditorKeyContext {
  zenMode: ZenModeType;
  isMentionOpen: boolean;
  mentionCandidates: MentionItem[];
  selectedMentionIndex: number;
  keybindings?: Partial<Record<KeybindingActionId, string[]>>;
  onSelectMentionIndex: (idx: number) => void;
  onInsertMention: (item: MentionItem) => void;
  onCloseMention: () => void;
  onExitZen?: () => void;
  onToggleZenMode?: (mode: ZenModeType) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleWordWrap: () => void;
  onOpenFind?: (withReplace?: boolean) => void;
  isFindOpen?: boolean;
  onCloseFind?: () => void;
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

  // Escape: Close Find & Replace if open
  if (e.key === "Escape" && ctx.isFindOpen) {
    e.preventDefault();
    ctx.onCloseFind?.();
    return true;
  }

  // Escape: Exit Zen mode
  if (e.key === "Escape" && ctx.zenMode !== "none") {
    e.preventDefault();
    ctx.onExitZen?.();
    return true;
  }

  const kb = ctx.keybindings;

  // Zen mode toggles
  if (matchesAction("toggleCzm", e, kb)) {
    e.preventDefault();
    ctx.onToggleZenMode?.("czm");
    return true;
  }
  if (matchesAction("toggleFocusZen", e, kb)) {
    e.preventDefault();
    ctx.onToggleZenMode?.("focus");
    return true;
  }
  if (matchesAction("toggleZen", e, kb)) {
    e.preventDefault();
    ctx.onToggleZenMode?.("zen");
    return true;
  }

  // Document Save
  if (matchesAction("save", e, kb)) {
    e.preventDefault();
    ctx.onSave();
    return true;
  }

  // History Redo & Undo
  if (matchesAction("redo", e, kb)) {
    e.preventDefault();
    ctx.onRedo();
    return true;
  }
  if (matchesAction("undo", e, kb)) {
    e.preventDefault();
    ctx.onUndo();
    return true;
  }

  // Find & Replace
  if (matchesAction("findReplace", e, kb)) {
    e.preventDefault();
    ctx.onOpenFind?.(true);
    return true;
  }
  if (matchesAction("find", e, kb)) {
    e.preventDefault();
    ctx.onOpenFind?.(false);
    return true;
  }

  // Toggle word wrap
  if (matchesAction("toggleWordWrap", e, kb)) {
    e.preventDefault();
    ctx.onToggleWordWrap();
    return true;
  }

  // Text formatting
  if (matchesAction("bold", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "**", "**", "bold text"),
    );
    return true;
  }
  if (matchesAction("italic", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "*", "*", "italic text"),
    );
    return true;
  }
  if (matchesAction("wikilink", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) =>
      wrapSelection(t, s, end, "[[", "]]", "Document"),
    );
    return true;
  }
  if (matchesAction("blockquote", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "> "));
    return true;
  }
  if (matchesAction("bulletList", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "- "));
    return true;
  }
  if (matchesAction("taskItem", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleLinePrefix(t, s, end, "- [ ] "));
    return true;
  }
  if (matchesAction("toggleTask", e, kb)) {
    e.preventDefault();
    ctx.applyTransform((t, s, end) => toggleTaskCheckbox(t, s, end));
    return true;
  }

  // Indent Tab key
  if (e.key === "Tab") {
    e.preventDefault();
    ctx.onInsertTab();
    return true;
  }

  return false;
}
