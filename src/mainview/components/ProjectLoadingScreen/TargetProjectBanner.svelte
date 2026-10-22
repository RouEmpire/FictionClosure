<script lang="ts">
	interface Props {
		projectName: string;
		folderPath: string;
	}

	let { projectName, folderPath }: Props = $props();
</script>

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

<style>
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
</style>
