/**
 * FictionClosure — Undo / Redo Stacks Engine
 *
 * Manages per-document edit history with:
 * - Keyboard shortcuts: Ctrl+Z (Undo) and Ctrl+Alt+Z (Redo)
 * - Persistent JSON storage: survives computer reboot / project reload
 * - Size limit: strictly bounded to half of project.json's targetWordCount
 */

import type {
	DocumentHistoryStack,
	HistorySnapshot,
	ProjectHistoryStacks,
} from "@shared/types";

export function calculateMaxStackSize(targetWordCount: number | undefined): number {
	const count =
		typeof targetWordCount === "number" && !isNaN(targetWordCount)
			? targetWordCount
			: 2000;
	return Math.max(10, Math.floor(count / 2));
}

export class HistoryManager {
	private stacks = new Map<string, DocumentHistoryStack>();
	private maxStackSize = 1000;
	private lastEditTime = new Map<string, number>();
	private debounceMs = 750;

	constructor(targetWordCount?: number) {
		this.setTargetWordCount(targetWordCount);
	}

	/**
	 * Configure max stack size based on project's targetWordCount / 2.
	 */
	public setTargetWordCount(targetWordCount?: number): void {
		this.maxStackSize = calculateMaxStackSize(targetWordCount);
		this.trimAllStacks();
	}

	public getMaxStackSize(): number {
		return this.maxStackSize;
	}

	/**
	 * Get or initialize history stacks for a given document.
	 */
	public getOrCreateStack(docId: string): DocumentHistoryStack {
		let stack = this.stacks.get(docId);
		if (!stack) {
			stack = { undo: [], redo: [] };
			this.stacks.set(docId, stack);
		}
		return stack;
	}

	/**
	 * Record a content modification.
	 * Groups continuous rapid typing bursts, while immediately capturing paste/enter.
	 */
	public recordEdit(
		docId: string,
		oldContent: string,
		newContent: string,
		cursor?: number,
		immediate: boolean = false,
	): void {
		if (oldContent === newContent) return;

		const stack = this.getOrCreateStack(docId);
		const now = Date.now();
		const lastTime = this.lastEditTime.get(docId) ?? 0;
		const isNewBurst = immediate || now - lastTime > this.debounceMs || stack.undo.length === 0;

		// Clear redo stack on new user edits
		stack.redo = [];

		if (isNewBurst) {
			// Save the state before this edit burst started
			stack.undo.push({
				content: oldContent,
				timestamp: now,
				cursor,
			});

			if (stack.undo.length > this.maxStackSize) {
				stack.undo.splice(0, stack.undo.length - this.maxStackSize);
			}
		}

		this.lastEditTime.set(docId, now);
	}

	/**
	 * Undo the last edit.
	 * Returns the restored snapshot, or null if undo stack is empty.
	 */
	public undo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null {
		const stack = this.getOrCreateStack(docId);
		if (stack.undo.length === 0) return null;

		const target = stack.undo.pop()!;

		// Push current state to redo
		stack.redo.push({
			content: currentContent,
			timestamp: Date.now(),
			cursor: currentCursor,
		});

		if (stack.redo.length > this.maxStackSize) {
			stack.redo.splice(0, stack.redo.length - this.maxStackSize);
		}

		this.lastEditTime.set(docId, 0); // reset debounce timer
		return target;
	}

	/**
	 * Redo the last undone edit.
	 * Returns the restored snapshot, or null if redo stack is empty.
	 */
	public redo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null {
		const stack = this.getOrCreateStack(docId);
		if (stack.redo.length === 0) return null;

		const target = stack.redo.pop()!;

		// Push current state to undo
		stack.undo.push({
			content: currentContent,
			timestamp: Date.now(),
			cursor: currentCursor,
		});

		if (stack.undo.length > this.maxStackSize) {
			stack.undo.splice(0, stack.undo.length - this.maxStackSize);
		}

		this.lastEditTime.set(docId, 0); // reset debounce timer
		return target;
	}

	public canUndo(docId: string): boolean {
		return (this.stacks.get(docId)?.undo.length ?? 0) > 0;
	}

	public canRedo(docId: string): boolean {
		return (this.stacks.get(docId)?.redo.length ?? 0) > 0;
	}

	/**
	 * Serializes all stacks to exportable JSON structure.
	 */
	public exportAllStacks(targetWordCount: number): ProjectHistoryStacks {
		const stacksObj: Record<string, DocumentHistoryStack> = {};
		for (const [docId, stack] of this.stacks.entries()) {
			if (stack.undo.length > 0 || stack.redo.length > 0) {
				stacksObj[docId] = {
					undo: stack.undo.slice(-this.maxStackSize),
					redo: stack.redo.slice(-this.maxStackSize),
				};
			}
		}

		return {
			schemaVersion: 1,
			updatedAt: new Date().toISOString(),
			targetWordCount,
			maxStackSize: this.maxStackSize,
			stacks: stacksObj,
		};
	}

	/**
	 * Imports and rehydrates history stacks from stored JSON data.
	 */
	public importAllStacks(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount: number,
	): void {
		this.setTargetWordCount(targetWordCount);
		this.stacks.clear();
		this.lastEditTime.clear();

		if (!data || !data.stacks || typeof data.stacks !== "object") {
			return;
		}

		for (const [docId, s] of Object.entries(data.stacks)) {
			if (s && Array.isArray(s.undo) && Array.isArray(s.redo)) {
				this.stacks.set(docId, {
					undo: s.undo.slice(-this.maxStackSize),
					redo: s.redo.slice(-this.maxStackSize),
				});
			}
		}
	}

	/**
	 * Restores/imports history stacks from stored JSON data.
	 * (Alias for importAllStacks).
	 */
	public restoreAll(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount: number = 50000,
	): void {
		this.importAllStacks(data, targetWordCount);
	}

	/**
	 * Clear all stacks.
	 */
	public clear(): void {
		this.stacks.clear();
		this.lastEditTime.clear();
	}

	private trimAllStacks(): void {
		for (const stack of this.stacks.values()) {
			if (stack.undo.length > this.maxStackSize) {
				stack.undo.splice(0, stack.undo.length - this.maxStackSize);
			}
			if (stack.redo.length > this.maxStackSize) {
				stack.redo.splice(0, stack.redo.length - this.maxStackSize);
			}
		}
	}
}

// Global singleton instance for application session
export const globalHistoryManager = new HistoryManager();
