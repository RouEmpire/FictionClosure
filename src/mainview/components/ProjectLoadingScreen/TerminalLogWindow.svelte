<script lang="ts">
	import { tick } from "svelte";
	import type { LogEntry } from "./types";

	interface Props {
		logs: LogEntry[];
		hasFinished: boolean;
		loadError?: string | null;
	}

	let { logs, hasFinished, loadError = null }: Props = $props();
	let terminalScrollElem: HTMLDivElement | null = $state(null);

	$effect(() => {
		// Track logs length so it reacts to additions
		void logs.length;
		tick().then(() => {
			if (terminalScrollElem) {
				terminalScrollElem.scrollTop = terminalScrollElem.scrollHeight;
			}
		});
	});
</script>

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

<style>
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
</style>
