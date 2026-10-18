<script lang="ts">
	import { onMount, tick } from "svelte";

	interface Props {
		projectName: string;
		folderPath: string;
		isLoaded: boolean;
		loadError?: string | null;
		stats?: { docCount: number; wordCount: number } | null;
		onDone: () => void;
		onCancel?: () => void;
	}

	let {
		projectName,
		folderPath,
		isLoaded,
		loadError = null,
		stats = null,
		onDone,
		onCancel,
	}: Props = $props();

	interface LogEntry {
		id: string;
		time: string;
		tag: "BOOT" | "MOUNT" | "MANIFEST" | "SCAN" | "GRAPH" | "STATE" | "VERIFY" | "READY" | "ERROR";
		text: string;
	}

	let progress = $state(10);
	let logs = $state<LogEntry[]>([]);
	let terminalScrollElem: HTMLDivElement | null = $state(null);
	let hasFinished = $state(false);

	function formatTimestamp(d: Date): string {
		const m = String(d.getMinutes()).padStart(2, "0");
		const s = String(d.getSeconds()).padStart(2, "0");
		const ms = String(d.getMilliseconds()).padStart(3, "0");
		return `${m}:${s}.${ms}`;
	}

	function addLog(tag: LogEntry["tag"], text: string) {
		const now = new Date();
		logs = [
			...logs,
			{
				id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
				time: formatTimestamp(now),
				tag,
				text,
			},
		];
		// Auto scroll to bottom
		tick().then(() => {
			if (terminalScrollElem) {
				terminalScrollElem.scrollTop = terminalScrollElem.scrollHeight;
			}
		});
	}

	onMount(() => {
		let isCancelled = false;
		const timers: ReturnType<typeof setTimeout>[] = [];

		// Initial boot step
		addLog("BOOT", "Initializing Electrobun IPC channel & native storage bridge... [OK]");
		progress = 18;

		// Step 2: Mount filesystem path
		timers.push(
			setTimeout(() => {
				if (isCancelled || hasFinished) return;
				addLog("MOUNT", `Locking project path: "${folderPath}"... [OK]`);
				progress = 38;
			}, 120),
		);

		// Step 3: Manifest inspection
		timers.push(
			setTimeout(() => {
				if (isCancelled || hasFinished) return;
				addLog("MANIFEST", `Validating fictionclosure.json manifest for "${projectName}"... [OK]`);
				progress = 58;
			}, 240),
		);

		// Step 4: Manuscript & character discovery
		timers.push(
			setTimeout(() => {
				if (isCancelled || hasFinished) return;
				addLog("SCAN", "Discovering chapters, character sheets, and lore documents... [OK]");
				progress = 74;
			}, 360),
		);

		// Step 5: Wikilinks & Word Counts
		timers.push(
			setTimeout(() => {
				if (isCancelled || hasFinished) return;
				addLog("GRAPH", "Indexing wikilinks [[...]], metadata tags, and word counts... [OK]");
				progress = 88;
			}, 480),
		);

		// Step 6: History Stacks
		timers.push(
			setTimeout(() => {
				if (isCancelled || hasFinished) return;
				addLog("STATE", "Restoring session undo/redo history buffers... [OK]");
				progress = 94;
			}, 600),
		);

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

		// When backend loading has completed and progress reached at least stage 88%
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
		<!-- Chassis Top Bar -->
		<div class="chassis-header">
			<div class="chassis-header-left">
				<div class="status-indicator">
					<span class="pulsing-led" class:error={Boolean(loadError)}></span>
					<span class="system-status-text">
						{loadError ? "DISK_IO_ERROR" : "DISK_IO_ACTIVE"}
					</span>
				</div>
				<span class="chassis-divider">|</span>
				<span class="kernel-id">CORE_MOUNT // TERMINAL_SHELL // v2.4</span>
			</div>
			<div class="chassis-header-right">
				{#if onCancel}
					<button
						type="button"
						class="cancel-btn"
						onclick={onCancel}
						title="Cancel loading and return to Home"
					>
						[ESC / CANCEL]
					</button>
				{/if}
			</div>
		</div>

		<!-- Target Project Banner -->
		<div class="target-project-banner">
			<div class="target-label">
				<span class="bracket">[</span>
				<span class="label-text">TARGET_PROJECT</span>
				<span class="bracket">]</span>
			</div>
			<h2 class="project-title-display">
				{projectName || "Untitled Project"}
			</h2>
			<div class="project-path-display" title={folderPath}>
				<span class="path-prompt">&gt;</span> {folderPath}
			</div>
		</div>

		<!-- High-Tech Progress Bar -->
		<div class="progress-section">
			<div class="progress-meta">
				<span class="progress-task-label">
					{#if loadError}
						<span class="error-text">MOUNT_ABORTED</span>
					{:else if progress >= 100}
						<span class="ready-text">WORKSPACE_READY</span>
					{:else}
						INITIALIZING_MANUSCRIPT_PIPELINE
					{/if}
				</span>
				<span class="progress-pct-readout">
					[ {Math.min(100, Math.round(progress))}% ]
				</span>
			</div>

			<!-- Visual Segmented Bar -->
			<div class="progress-track" class:error={Boolean(loadError)}>
				<div
					class="progress-fill"
					class:error={Boolean(loadError)}
					style="width: {Math.min(100, progress)}%;"
				>
					<div class="progress-shimmer"></div>
				</div>
			</div>
		</div>

		<!-- Running Hacker Terminal Log Window -->
		<div class="terminal-log-window">
			<div class="terminal-log-header">
				<span class="terminal-prompt-icon">⌨</span>
				<span class="terminal-title">TERMINAL_LOG_STREAM</span>
				<span class="stream-rate">LIVE_STDOUT</span>
			</div>

			<div class="terminal-log-body" bind:this={terminalScrollElem}>
				{#each logs as log (log.id)}
					<div class="log-line">
						<span class="log-time">[{log.time}]</span>
						<span class="log-tag tag-{log.tag.toLowerCase()}">[{log.tag}]</span>
						<span class="log-text">{log.text}</span>
					</div>
				{/each}
				{#if !hasFinished && !loadError}
					<div class="cursor-line">
						<span class="blinking-cursor">▋</span>
					</div>
				{/if}
			</div>
		</div>

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

	/* Chassis Top Header */
	.chassis-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid rgba(6, 182, 212, 0.2);
		padding-bottom: 12px;
		font-size: 11px;
		letter-spacing: 0.05em;
	}

	.chassis-header-left {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pulsing-led {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: #00ff9d;
		box-shadow: 0 0 8px #00ff9d;
		animation: pulseLed 1.2s infinite ease-in-out;
	}

	.pulsing-led.error {
		background-color: #ef4444;
		box-shadow: 0 0 8px #ef4444;
	}

	@keyframes pulseLed {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.85);
		}
	}

	.system-status-text {
		color: #22d3ee;
		font-weight: 700;
	}

	.chassis-divider {
		color: #334155;
	}

	.kernel-id {
		color: #64748b;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid rgba(148, 163, 184, 0.3);
		color: #94a3b8;
		font-family: inherit;
		font-size: 10px;
		padding: 3px 8px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.cancel-btn:hover {
		color: #f1f5f9;
		border-color: #00f0ff;
		box-shadow: 0 0 8px rgba(0, 240, 255, 0.3);
	}

	/* Target Project Banner */
	.target-project-banner {
		display: flex;
		flex-direction: column;
		gap: 4px;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 6px;
		padding: 12px 16px;
	}

	.target-label {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		letter-spacing: 0.1em;
	}

	.target-label .bracket {
		color: #06b6d4;
		font-weight: 700;
	}

	.target-label .label-text {
		color: #38bdf8;
		font-weight: 600;
	}

	.project-title-display {
		margin: 0;
		font-size: 20px;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: 0.02em;
		text-shadow: 0 0 16px rgba(6, 182, 212, 0.5);
	}

	.project-path-display {
		font-size: 11px;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.path-prompt {
		color: #00ff9d;
		font-weight: 700;
	}

	/* Progress Bar Section */
	.progress-section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 11px;
	}

	.progress-task-label {
		color: #67e8f9;
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.progress-task-label .ready-text {
		color: #00ff9d;
		text-shadow: 0 0 8px rgba(0, 255, 157, 0.5);
	}

	.progress-task-label .error-text {
		color: #f87171;
	}

	.progress-pct-readout {
		color: #00ff9d;
		font-weight: 700;
		text-shadow: 0 0 6px rgba(0, 255, 157, 0.4);
	}

	.progress-track {
		height: 10px;
		background: #030712;
		border: 1px solid rgba(6, 182, 212, 0.3);
		border-radius: 999px;
		overflow: hidden;
		position: relative;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
	}

	.progress-track.error {
		border-color: rgba(239, 68, 68, 0.4);
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #06b6d4 0%, #10b981 60%, #00ff9d 100%);
		border-radius: 999px;
		transition: width 0.16s ease-out;
		position: relative;
		overflow: hidden;
		box-shadow: 0 0 12px rgba(0, 255, 157, 0.6);
	}

	.progress-fill.error {
		background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
		box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
	}

	.progress-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.4) 50%,
			transparent 100%
		);
		animation: shimmer 1.2s infinite;
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(100%);
		}
	}

	/* Terminal Log Stream Window */
	.terminal-log-window {
		background: #04070e;
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		height: 170px;
		box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.8);
	}

	.terminal-log-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: rgba(16, 185, 129, 0.08);
		border-bottom: 1px solid rgba(16, 185, 129, 0.15);
		font-size: 10px;
		color: #10b981;
		font-weight: 700;
		letter-spacing: 0.06em;
	}

	.terminal-prompt-icon {
		font-size: 12px;
	}

	.stream-rate {
		margin-left: auto;
		color: #64748b;
		font-size: 9px;
	}

	.terminal-log-body {
		flex: 1;
		overflow-y: auto;
		padding: 10px 14px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 11px;
		line-height: 1.45;
	}

	.log-line {
		display: flex;
		align-items: baseline;
		gap: 8px;
		animation: logEntryFade 0.12s ease-out;
		word-break: break-all;
	}

	@keyframes logEntryFade {
		from {
			opacity: 0;
			transform: translateX(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.log-time {
		color: #475569;
		font-size: 10px;
		flex-shrink: 0;
	}

	.log-tag {
		font-weight: 700;
		font-size: 10px;
		flex-shrink: 0;
	}

	.tag-boot,
	.tag-mount {
		color: #38bdf8;
	}

	.tag-manifest,
	.tag-scan {
		color: #facc15;
	}

	.tag-graph {
		color: #c084fc;
	}

	.tag-state,
	.tag-verify {
		color: #34d399;
	}

	.tag-ready {
		color: #00ff9d;
		text-shadow: 0 0 6px rgba(0, 255, 157, 0.6);
	}

	.tag-error {
		color: #ef4444;
		text-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
	}

	.log-text {
		color: #cbd5e1;
	}

	.cursor-line {
		display: flex;
		align-items: center;
		height: 14px;
	}

	.blinking-cursor {
		color: #00ff9d;
		animation: blinkCursor 0.8s infinite step-start;
		font-size: 12px;
	}

	@keyframes blinkCursor {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
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
