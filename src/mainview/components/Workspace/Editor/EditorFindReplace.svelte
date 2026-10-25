<script lang="ts">
	import {
		findMatches,
		formatMatchCountText,
		getNextMatchIndex,
		getPreviousMatchIndex,
		replaceAllMatches,
		replaceSingleMatch,
		resolveActiveMatchIndex,
		type SearchMatch,
	} from "./findReplaceLogic";

	interface Props {
		isOpen: boolean;
		isReplaceOpen: boolean;
		content: string;
		cursorPosition?: number;
		initialQuery?: string;
		onClose: () => void;
		onToggleReplace: (open?: boolean) => void;
		onSelectMatch: (match: SearchMatch) => void;
		onReplace: (newContent: string, newCursor: number) => void;
		onReplaceAll: (newContent: string, count: number) => void;
	}

	let {
		isOpen,
		isReplaceOpen,
		content,
		cursorPosition = 0,
		initialQuery = "",
		onClose,
		onToggleReplace,
		onSelectMatch,
		onReplace,
		onReplaceAll,
	}: Props = $props();

	let query = $state("");
	let replaceText = $state("");
	let caseSensitive = $state(false);
	let activeMatchIndex = $state(0);

	let findInputRef: HTMLInputElement | null = $state(null);

	// Recompute matches whenever content, query, or case sensitivity changes
	const matches = $derived(findMatches(content, query, caseSensitive));
	const matchCountText = $derived(
		formatMatchCountText(matches.length, activeMatchIndex, query),
	);
	const activeMatch = $derived(
		activeMatchIndex >= 0 && activeMatchIndex < matches.length
			? matches[activeMatchIndex]
			: null,
	);

	// Synchronize initial query when panel opens
	$effect(() => {
		if (isOpen) {
			if (initialQuery) {
				query = initialQuery;
			}
			setTimeout(() => {
				if (findInputRef) {
					findInputRef.focus();
					findInputRef.select();
				}
			}, 30);
		}
	});

	// Keep activeMatchIndex in bounds or aligned to cursor
	$effect(() => {
		if (matches.length === 0) {
			activeMatchIndex = -1;
			return;
		}
		if (activeMatchIndex < 0 || activeMatchIndex >= matches.length) {
			activeMatchIndex = resolveActiveMatchIndex(
				matches,
				cursorPosition,
				activeMatchIndex,
			);
		}
	});

	function handleNext() {
		if (matches.length === 0) return;
		activeMatchIndex = getNextMatchIndex(activeMatchIndex, matches.length);
		const target = matches[activeMatchIndex];
		if (target) onSelectMatch(target);
	}

	function handlePrev() {
		if (matches.length === 0) return;
		activeMatchIndex = getPreviousMatchIndex(activeMatchIndex, matches.length);
		const target = matches[activeMatchIndex];
		if (target) onSelectMatch(target);
	}

	function handleReplace() {
		if (!activeMatch) return;
		const res = replaceSingleMatch(content, activeMatch, replaceText);
		onReplace(res.newContent, res.newCursor);
	}

	function handleReplaceAll() {
		if (!query || matches.length === 0) return;
		const res = replaceAllMatches(content, query, replaceText, caseSensitive);
		onReplaceAll(res.newContent, res.count);
	}

	function handleFindKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
			return;
		}

		if (e.altKey && e.key.toLowerCase() === "c") {
			e.preventDefault();
			caseSensitive = !caseSensitive;
			return;
		}

		const isMod = e.ctrlKey || e.metaKey;
		if (isMod && e.shiftKey && e.key.toLowerCase() === "f") {
			e.preventDefault();
			onToggleReplace(!isReplaceOpen);
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (e.shiftKey) {
				handlePrev();
			} else {
				handleNext();
			}
		}
	}

	function handleReplaceKeyDown(e: KeyboardEvent) {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (e.shiftKey) {
				handleReplaceAll();
			} else {
				handleReplace();
			}
		}
	}
</script>

{#if isOpen}
	<div
		class="find-replace-pane"
		role="search"
		aria-label="Find and Replace"
	>
		<!-- Row 1: Find Controls -->
		<div class="find-row">
			<button
				type="button"
				class="icon-toggle-btn toggle-replace-btn"
				class:expanded={isReplaceOpen}
				onclick={() => onToggleReplace(!isReplaceOpen)}
				title="Toggle Replace (Ctrl+Shift+F)"
				aria-expanded={isReplaceOpen}
				aria-label="Toggle Replace"
			>
				<i
					class="fa-solid"
					class:fa-chevron-down={isReplaceOpen}
					class:fa-chevron-right={!isReplaceOpen}
				></i>
			</button>

			<div class="input-with-adornment">
				<input
					type="text"
					class="find-input"
					placeholder="Find..."
					bind:this={findInputRef}
					bind:value={query}
					onkeydown={handleFindKeyDown}
					aria-label="Find text"
				/>
				<button
					type="button"
					class="adornment-btn match-case-btn"
					class:active={caseSensitive}
					onclick={() => (caseSensitive = !caseSensitive)}
					title="Match Case (Alt+C)"
					aria-pressed={caseSensitive}
				>
					Aa
				</button>
			</div>

			<div class="match-count-badge" class:has-results={matches.length > 0}>
				{matchCountText}
			</div>

			<div class="nav-buttons-group">
				<button
					type="button"
					class="action-icon-btn"
					onclick={handlePrev}
					disabled={matches.length === 0}
					title="Previous Match (Shift+Enter)"
					aria-label="Previous Match"
				>
					<i class="fa-solid fa-arrow-up"></i>
				</button>
				<button
					type="button"
					class="action-icon-btn"
					onclick={handleNext}
					disabled={matches.length === 0}
					title="Next Match (Enter)"
					aria-label="Next Match"
				>
					<i class="fa-solid fa-arrow-down"></i>
				</button>
				<button
					type="button"
					class="action-icon-btn close-find-btn"
					onclick={onClose}
					title="Close (Escape)"
					aria-label="Close find bar"
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
		</div>

		<!-- Row 2: Replace Controls (Expanded when isReplaceOpen is true) -->
		{#if isReplaceOpen}
			<div class="replace-row">
				<div class="spacer-chevron" aria-hidden="true"></div>

				<div class="input-with-adornment">
					<input
						type="text"
						class="find-input replace-input"
						placeholder="Replace with..."
						bind:value={replaceText}
						onkeydown={handleReplaceKeyDown}
						aria-label="Replace text"
					/>
				</div>

				<div class="replace-actions-group">
					<button
						type="button"
						class="text-action-btn"
						onclick={handleReplace}
						disabled={!activeMatch}
						title="Replace Current (Enter)"
					>
						Replace
					</button>
					<button
						type="button"
						class="text-action-btn"
						onclick={handleReplaceAll}
						disabled={matches.length === 0}
						title="Replace All Occurrences (Shift+Enter)"
					>
						Replace All
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
