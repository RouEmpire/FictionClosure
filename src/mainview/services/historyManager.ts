/**
 * FictionClosure — Undo / Redo Stacks Engine (Pure Functional & SOLID).
 *
 * Implements edit history with:
 * - Pure stack transformations (no OOP classes, no `this`)
 * - Segregated interfaces for reader, writer, and serialization
 * - Bounded stack capacity (half of targetWordCount, min 10)
 * - Optimized bounded slicing for high performance
 */

import type {
	DocumentHistoryStack,
	HistorySnapshot,
	ProjectHistoryStacks,
} from "@shared/types";

// ============================================================================
// 1. Interfaces (Interface Segregation Principle)
// ============================================================================

export interface HistoryStateReader {
	getMaxStackSize(): number;
	canUndo(docId: string): boolean;
	canRedo(docId: string): boolean;
}

export interface HistoryStateWriter {
	setTargetWordCount(targetWordCount?: number): void;
	getOrCreateStack(docId: string): DocumentHistoryStack;
	recordEdit(
		docId: string,
		oldContent: string,
		newContent: string,
		cursor?: number,
		immediate?: boolean,
	): void;
	undo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null;
	redo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null;
	clear(): void;
}

export interface HistorySerializer {
	exportAllStacks(targetWordCount: number): ProjectHistoryStacks;
	importAllStacks(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount: number,
	): void;
	restoreAll(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount?: number,
	): void;
}

export type HistoryManagerService = HistoryStateReader &
	HistoryStateWriter &
	HistorySerializer;

export interface HistoryManagerOptions {
	debounceMs?: number;
	clock?: () => number;
}

// ============================================================================
// 2. Pure Stack Domain Functions (Single Responsibility & Performance)
// ============================================================================

/**
 * Calculates max stack capacity as half of targetWordCount (min 10).
 */
export function calculateMaxStackSize(targetWordCount: number | undefined): number {
	const count =
		typeof targetWordCount === "number" && !isNaN(targetWordCount)
			? targetWordCount
			: 2000;
	return Math.max(10, Math.floor(count / 2));
}

/**
 * Returns a fresh, empty document history stack.
 */
export function createEmptyHistoryStack(): DocumentHistoryStack {
	return { undo: [], redo: [] };
}

/**
 * Trims a history snapshot array to the maximum allowable capacity.
 * Uses slice(-maxSize) which is substantially faster than shifting/splicing in-place.
 */
export function trimHistoryArray(
	items: HistorySnapshot[],
	maxSize: number,
): HistorySnapshot[] {
	if (items.length <= maxSize) return items;
	return items.slice(-maxSize);
}

/**
 * Records an edit burst into a document stack, resetting redo and enforcing size limit.
 */
export function applyEditBurst(
	stack: DocumentHistoryStack,
	oldContent: string,
	cursor: number | undefined,
	timestamp: number,
	maxSize: number,
): void {
	stack.redo = [];
	stack.undo.push({
		content: oldContent,
		timestamp,
		cursor,
	});
	if (stack.undo.length > maxSize) {
		stack.undo = trimHistoryArray(stack.undo, maxSize);
	}
}

/**
 * Undoes the last edit in the stack. Returns the restored snapshot or null.
 */
export function performUndo(
	stack: DocumentHistoryStack,
	currentContent: string,
	currentCursor: number | undefined,
	timestamp: number,
	maxSize: number,
): HistorySnapshot | null {
	if (stack.undo.length === 0) return null;
	const target = stack.undo.pop()!;

	stack.redo.push({
		content: currentContent,
		timestamp,
		cursor: currentCursor,
	});
	if (stack.redo.length > maxSize) {
		stack.redo = trimHistoryArray(stack.redo, maxSize);
	}

	return target;
}

/**
 * Redoes the last undone edit in the stack. Returns the restored snapshot or null.
 */
export function performRedo(
	stack: DocumentHistoryStack,
	currentContent: string,
	currentCursor: number | undefined,
	timestamp: number,
	maxSize: number,
): HistorySnapshot | null {
	if (stack.redo.length === 0) return null;
	const target = stack.redo.pop()!;

	stack.undo.push({
		content: currentContent,
		timestamp,
		cursor: currentCursor,
	});
	if (stack.undo.length > maxSize) {
		stack.undo = trimHistoryArray(stack.undo, maxSize);
	}

	return target;
}

/**
 * Serializes history map to an exportable JSON schema object.
 */
export function serializeHistoryMap(
	stacks: Map<string, DocumentHistoryStack>,
	targetWordCount: number,
	maxSize: number,
): ProjectHistoryStacks {
	const stacksObj: Record<string, DocumentHistoryStack> = {};
	for (const [docId, stack] of stacks.entries()) {
		if (stack.undo.length > 0 || stack.redo.length > 0) {
			stacksObj[docId] = {
				undo: trimHistoryArray(stack.undo, maxSize),
				redo: trimHistoryArray(stack.redo, maxSize),
			};
		}
	}

	return {
		schemaVersion: 1,
		updatedAt: new Date().toISOString(),
		targetWordCount,
		maxStackSize: maxSize,
		stacks: stacksObj,
	};
}

/**
 * Deserializes JSON history schema back into a Map of DocumentHistoryStacks.
 */
export function deserializeHistoryMap(
	data: ProjectHistoryStacks | null | undefined,
	maxSize: number,
): Map<string, DocumentHistoryStack> {
	const map = new Map<string, DocumentHistoryStack>();
	if (!data || !data.stacks || typeof data.stacks !== "object") {
		return map;
	}

	for (const [docId, s] of Object.entries(data.stacks)) {
		if (s && Array.isArray(s.undo) && Array.isArray(s.redo)) {
			map.set(docId, {
				undo: trimHistoryArray(s.undo, maxSize),
				redo: trimHistoryArray(s.redo, maxSize),
			});
		}
	}
	return map;
}

// ============================================================================
// 3. Functional Closure Service Factory (Zero OOP / No Classes / No 'this')
// ============================================================================

/**
 * Creates a functional HistoryManager instance using closures rather than OOP classes.
 */
export function createHistoryManager(
	initialTargetWordCount?: number,
	options: HistoryManagerOptions = {},
): HistoryManagerService {
	let stacks = new Map<string, DocumentHistoryStack>();
	const lastEditTime = new Map<string, number>();
	let maxStackSize = calculateMaxStackSize(initialTargetWordCount);
	const debounceMs = options.debounceMs ?? 750;
	const clock = options.clock ?? (() => Date.now());

	function trimAllStacks(): void {
		for (const stack of stacks.values()) {
			stack.undo = trimHistoryArray(stack.undo, maxStackSize);
			stack.redo = trimHistoryArray(stack.redo, maxStackSize);
		}
	}

	function setTargetWordCount(targetWordCount?: number): void {
		maxStackSize = calculateMaxStackSize(targetWordCount);
		trimAllStacks();
	}

	function getMaxStackSize(): number {
		return maxStackSize;
	}

	function getOrCreateStack(docId: string): DocumentHistoryStack {
		let stack = stacks.get(docId);
		if (!stack) {
			stack = createEmptyHistoryStack();
			stacks.set(docId, stack);
		}
		return stack;
	}

	function recordEdit(
		docId: string,
		oldContent: string,
		newContent: string,
		cursor?: number,
		immediate: boolean = false,
	): void {
		if (oldContent === newContent) return;

		const stack = getOrCreateStack(docId);
		const now = clock();
		const lastTime = lastEditTime.get(docId) ?? 0;
		const isNewBurst =
			immediate || now - lastTime > debounceMs || stack.undo.length === 0;

		if (isNewBurst) {
			applyEditBurst(stack, oldContent, cursor, now, maxStackSize);
		} else {
			// Clear redo even on continuous typing burst
			stack.redo = [];
		}

		lastEditTime.set(docId, now);
	}

	function undo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null {
		const stack = getOrCreateStack(docId);
		const target = performUndo(
			stack,
			currentContent,
			currentCursor,
			clock(),
			maxStackSize,
		);
		if (target) {
			lastEditTime.set(docId, 0); // reset debounce timer
		}
		return target;
	}

	function redo(
		docId: string,
		currentContent: string,
		currentCursor?: number,
	): HistorySnapshot | null {
		const stack = getOrCreateStack(docId);
		const target = performRedo(
			stack,
			currentContent,
			currentCursor,
			clock(),
			maxStackSize,
		);
		if (target) {
			lastEditTime.set(docId, 0); // reset debounce timer
		}
		return target;
	}

	function canUndo(docId: string): boolean {
		return (stacks.get(docId)?.undo.length ?? 0) > 0;
	}

	function canRedo(docId: string): boolean {
		return (stacks.get(docId)?.redo.length ?? 0) > 0;
	}

	function exportAllStacks(targetWordCount: number): ProjectHistoryStacks {
		return serializeHistoryMap(stacks, targetWordCount, maxStackSize);
	}

	function importAllStacks(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount: number,
	): void {
		setTargetWordCount(targetWordCount);
		stacks = deserializeHistoryMap(data, maxStackSize);
		lastEditTime.clear();
	}

	function restoreAll(
		data: ProjectHistoryStacks | null | undefined,
		targetWordCount: number = 50000,
	): void {
		importAllStacks(data, targetWordCount);
	}

	function clear(): void {
		stacks.clear();
		lastEditTime.clear();
	}

	return {
		getMaxStackSize,
		setTargetWordCount,
		getOrCreateStack,
		recordEdit,
		undo,
		redo,
		canUndo,
		canRedo,
		exportAllStacks,
		importAllStacks,
		restoreAll,
		clear,
	};
}

/**
 * Callable function providing full backward compatibility for `new HistoryManager(n)`
 * and `HistoryManager(n)` without using class or OOP constructs.
 */
export const HistoryManager = function (
	this: unknown,
	targetWordCount?: number,
): HistoryManagerService {
	return createHistoryManager(targetWordCount);
} as unknown as {
	new (targetWordCount?: number): HistoryManagerService;
	(targetWordCount?: number): HistoryManagerService;
};

// Global singleton instance for application session
export const globalHistoryManager: HistoryManagerService = createHistoryManager();
