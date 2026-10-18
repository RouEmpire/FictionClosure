/**
 * FictionClosure — Time and Duration Formatting Utilities
 *
 * Implements precise duration formatting for project loading, background indexing,
 * and operation toasts.
 */

/**
 * Formats duration in milliseconds or seconds according to FictionClosure rules:
 * - If duration is less than 2 seconds (< 2000ms), displays in milliseconds (e.g. "450ms", "1250ms").
 * - If duration is 2 seconds or more (>= 2000ms), displays in seconds with up to 2 decimal places (e.g. "2s", "2.45s", "12.3s").
 */
export function formatLoadDuration(durationMs: number): string {
	const ms = Math.max(0, Math.round(durationMs));
	if (ms < 2000) {
		return `${ms}ms`;
	}
	const seconds = ms / 1000;
	// Format with up to 2 decimal places, trimming trailing zeros (e.g. 2.00 -> 2, 2.50 -> 2.5)
	const formatted = Number(seconds.toFixed(2)).toString();
	return `${formatted}s`;
}
