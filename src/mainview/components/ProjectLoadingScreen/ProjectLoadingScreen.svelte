<script lang="ts">
	import { onMount } from "svelte";
	import type { LogEntry, ProjectLoadingScreenProps } from "./types";
	import { createLogEntry, SIMULATED_BOOT_STEPS } from "./projectLoadingHelpers";
	import ChassisHeader from "./ChassisHeader.svelte";
	import TargetProjectBanner from "./TargetProjectBanner.svelte";
	import ProgressBarSection from "./ProgressBarSection.svelte";
	import TerminalLogWindow from "./TerminalLogWindow.svelte";

	let {
		projectName,
		folderPath,
		isLoaded,
		loadError = null,
		stats = null,
		onDone,
		onCancel,
	}: ProjectLoadingScreenProps = $props();

	let progress = $state(10);
	let logs = $state<LogEntry[]>([]);
	let hasFinished = $state(false);

	function addLog(tag: LogEntry["tag"], text: string) {
		logs = [...logs, createLogEntry(tag, text)];
	}

	onMount(() => {
		let isCancelled = false;
		const timers: ReturnType<typeof setTimeout>[] = [];

		// Initial boot step
		addLog("BOOT", "Initializing Electrobun IPC channel & native storage bridge... [OK]");
		progress = 18;

		// Simulated mount & discovery steps
		for (const step of SIMULATED_BOOT_STEPS) {
			timers.push(
				setTimeout(() => {
					if (isCancelled || hasFinished) return;
					addLog(step.tag, step.getMessage(projectName, folderPath));
					progress = step.progress;
				}, step.delayMs),
			);
		}

		return () => {
			isCancelled = true;
			timers.forEach(clearTimeout);
		};
	});

	// React when the backend load finishes or errors out
	$effect(() => {
		if (loadError && !hasFinished) {
			hasFinished = true;
			progress = 100;
			addLog("ERROR", `Load aborted: ${loadError}`);
			return;
		}

		// When backend loading has completed
		if (isLoaded && !hasFinished) {
			hasFinished = true;
			const docInfo = stats
				? `${stats.docCount} documents verified (${stats.wordCount.toLocaleString()} words)`
				: "Manuscript documents verified";

			// Give a short staggered finish
			setTimeout(() => {
				addLog("VERIFY", `Integrity check complete: ${docInfo} [OK]`);
				progress = 98;
				setTimeout(() => {
					addLog("READY", `Project "${projectName}" mounted. Launching workspace.`);
					progress = 100;
					setTimeout(() => {
						onDone();
					}, 200);
				}, 140);
			}, 80);
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && onCancel) {
			onCancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="loading-overlay"
	role="status"
	aria-live="polite"
	aria-label="Loading project {projectName}"
>
	<!-- High-tech CRT scanline backdrop -->
	<div class="scanlines-layer" aria-hidden="true"></div>

	<!-- Hacker terminal card -->
	<div class="terminal-chassis">
		<ChassisHeader {loadError} {onCancel} />

		<TargetProjectBanner {projectName} {folderPath} />

		<ProgressBarSection {progress} {loadError} />

		<TerminalLogWindow {logs} {hasFinished} {loadError} />

		{#if loadError}
			<div class="error-action-row">
				<button type="button" class="btn-return-home" onclick={onCancel}>
					Return to Home
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.loading-overlay {
		position: fixed;
		inset: 0;
		background-color: #050811;
		background-image: radial-gradient(circle at 50% 40%, #0d192b 0%, #050811 85%);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		color: #e2e8f0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
		user-select: none;
		animation: overlayFadeIn 0.25s ease-out;
	}

	@keyframes overlayFadeIn {
		from {
			opacity: 0;
			transform: scale(0.99);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* CRT scanlines effect */
	.scanlines-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: repeating-linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.2) 0px,
			rgba(0, 0, 0, 0.2) 1px,
			transparent 1px,
			transparent 2px
		);
		opacity: 0.6;
		z-index: 1;
	}

	/* Hacker Terminal Chassis */
	.terminal-chassis {
		position: relative;
		z-index: 2;
		width: 100%;
		max-width: 680px;
		background: #090e17;
		border: 1px solid rgba(6, 182, 212, 0.4);
		border-radius: 10px;
		box-shadow:
			0 0 35px rgba(6, 182, 212, 0.18),
			0 20px 40px rgba(0, 0, 0, 0.7),
			inset 0 0 20px rgba(6, 182, 212, 0.05);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 20px 24px;
	}

	.error-action-row {
		display: flex;
		justify-content: flex-end;
		padding-top: 4px;
	}

	.btn-return-home {
		background: #ef4444;
		color: #ffffff;
		border: none;
		border-radius: 4px;
		padding: 8px 16px;
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
		transition: all 0.15s ease;
	}

	.btn-return-home:hover {
		background: #dc2626;
	}
</style>
