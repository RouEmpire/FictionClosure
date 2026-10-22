import type { FictionDocument } from "../../../../shared/types";
import { globalHistoryManager } from "../../../services/historyManager";
import type { TextTransformResult } from "../../../../shared/domain/textFormatting";

export function performUndo(
	textarea: HTMLTextAreaElement | null,
	doc: FictionDocument,
	onContentChange: (newContent: string) => void,
	onAfterChange: () => void,
) {
	if (!textarea) return;
	const snapshot = globalHistoryManager.undo(
		doc.id,
		doc.content,
		textarea.selectionStart,
	);
	if (snapshot) {
		onContentChange(snapshot.content);
		textarea.value = snapshot.content;
		if (typeof snapshot.cursor === "number") {
			textarea.setSelectionRange(snapshot.cursor, snapshot.cursor);
		}
		onAfterChange();
	}
}

export function performRedo(
	textarea: HTMLTextAreaElement | null,
	doc: FictionDocument,
	onContentChange: (newContent: string) => void,
	onAfterChange: () => void,
) {
	if (!textarea) return;
	const snapshot = globalHistoryManager.redo(
		doc.id,
		doc.content,
		textarea.selectionStart,
	);
	if (snapshot) {
		onContentChange(snapshot.content);
		textarea.value = snapshot.content;
		if (typeof snapshot.cursor === "number") {
			textarea.setSelectionRange(snapshot.cursor, snapshot.cursor);
		}
		onAfterChange();
	}
}

export function performTransform(
	textarea: HTMLTextAreaElement | null,
	doc: FictionDocument,
	transformFn: (text: string, start: number, end: number) => TextTransformResult,
	onContentChange: (newContent: string) => void,
	onAfterChange: () => void,
) {
	if (!textarea) return;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const oldContent = doc.content;
	const res = transformFn(oldContent, start, end);

	globalHistoryManager.recordEdit(
		doc.id,
		oldContent,
		res.newText,
		res.newStart,
		true,
	);
	onContentChange(res.newText);
	textarea.value = res.newText;

	setTimeout(() => {
		if (textarea) {
			textarea.focus();
			textarea.setSelectionRange(res.newStart, res.newEnd);
			onAfterChange();
		}
	}, 0);
}

export function performInsertSnippet(
	textarea: HTMLTextAreaElement | null,
	doc: FictionDocument,
	prefix: string,
	suffix: string = "",
	onContentChange: (newContent: string) => void,
	onAfterChange: () => void,
) {
	if (!textarea) return;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const text = textarea.value;
	const selected = text.substring(start, end);

	const oldContent = doc.content;
	const replacement = prefix + (selected || "text") + suffix;
	const newContent =
		text.substring(0, start) + replacement + text.substring(end);
	globalHistoryManager.recordEdit(
		doc.id,
		oldContent,
		newContent,
		start + prefix.length,
		true,
	);
	onContentChange(newContent);

	setTimeout(() => {
		if (textarea) {
			textarea.focus();
			textarea.setSelectionRange(
				start + prefix.length,
				start + prefix.length + (selected.length || 4),
			);
			onAfterChange();
		}
	}, 0);
}

export function performInsertTab(
	textarea: HTMLTextAreaElement | null,
	onContentChange: (newContent: string) => void,
	onAfterChange: () => void,
) {
	if (!textarea) return;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const val = textarea.value;

	const newVal = val.substring(0, start) + "  " + val.substring(end);
	onContentChange(newVal);

	setTimeout(() => {
		if (textarea) {
			textarea.selectionStart = textarea.selectionEnd = start + 2;
			onAfterChange();
		}
	}, 0);
}
