<script lang="ts">
	import type { FictionDocument } from "../../shared/types";
	import {
		renderMarkdown,
		calculateWordCount,
		estimateReadingTimeMinutes,
	} from "../../shared/domain/markdown";
	import {
		formatFontFeatureSettings,
		formatTextAutospace,
		DEFAULT_TYPOGRAPHY_SETTINGS,
		type EditorTypographySettings,
	} from "../../shared/domain/typography";

	interface Props {
		document: FictionDocument;
		typography?: EditorTypographySettings;
		onSelectWikilink: (targetName: string) => void;
	}

	let { document, typography = DEFAULT_TYPOGRAPHY_SETTINGS, onSelectWikilink }: Props = $props();

	const activeTypography = $derived(typography || DEFAULT_TYPOGRAPHY_SETTINGS);
	const fontFeatureSettingsCss = $derived(
		formatFontFeatureSettings(
			activeTypography.fontFeatures,
			activeTypography.customFontFeaturesText,
		),
	);
	const textAutospaceCss = $derived(
		formatTextAutospace(
			activeTypography.textAutospace,
			activeTypography.customTextAutospace,
		),
	);

	const renderedHtml = $derived(renderMarkdown(document.content));
	const wordCount = $derived(calculateWordCount(document.content));
	const readingTime = $derived(estimateReadingTimeMinutes(wordCount));

	function wikilinkDelegation(node: HTMLElement) {
		function onClick(e: MouseEvent) {
			const target = e.target as HTMLElement;
			const wikilinkBtn = target.closest<HTMLElement>(".wikilink-btn");
			if (wikilinkBtn) {
				const linkName = wikilinkBtn.getAttribute("data-wikilink");
				if (linkName) {
					e.preventDefault();
					onSelectWikilink(linkName);
				}
			}
		}
		node.addEventListener("click", onClick);
		return {
			destroy() {
				node.removeEventListener("click", onClick);
			},
		};
	}
</script>

<div class="preview-container" use:wikilinkDelegation role="region" aria-label="Markdown preview">
	<!-- Document reading header -->
	<div class="preview-header">
		<div class="preview-meta-row">
			<span class="preview-type-badge type-{document.type}">{document.type}</span>
			<span class="preview-status-badge status-{document.status}">{document.status}</span>
			<span class="dot">•</span>
			<span class="reading-stats">{wordCount.toLocaleString()} words</span>
			<span class="dot">•</span>
			<span class="reading-time">~{readingTime} min read</span>
		</div>

		{#if document.summary}
			<div class="preview-summary">
				<em>{document.summary}</em>
			</div>
		{/if}
	</div>

	<!-- Rendered Content -->
	<article
		class="prose-content"
		style="
			{activeTypography.fontFamily ? `font-family: ${activeTypography.fontFamily};` : ''}
			--preview-text-indent: {activeTypography.firstLineIndent}%;
			--preview-text-justify: {activeTypography.textJustify};
			--preview-text-rendering: {activeTypography.textRendering};
			--preview-font-features: {fontFeatureSettingsCss};
			--preview-autospace: {textAutospaceCss};
		"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html renderedHtml}
	</article>
</div>

<style>
	.preview-container {
		height: 100%;
		overflow-y: auto;
		background-color: var(--bg-primary);
		padding: 32px 48px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.preview-header {
		width: 100%;
		max-width: 720px;
		padding-bottom: 20px;
		margin-bottom: 24px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.preview-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.preview-type-badge, .preview-status-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.type-manuscript { background: rgba(88, 166, 255, 0.15); color: #58a6ff; }
	.type-character { background: rgba(210, 153, 34, 0.15); color: #d29922; }
	.type-world { background: rgba(63, 185, 80, 0.15); color: #3fb950; }
	.type-note { background: rgba(188, 140, 255, 0.15); color: #bc8cff; }

	.status-draft { background: var(--bg-tertiary); color: var(--text-muted); }
	.status-in-progress { background: rgba(210, 153, 34, 0.2); color: #d29922; }
	.status-revised { background: rgba(88, 166, 255, 0.2); color: #58a6ff; }
	.status-completed { background: rgba(63, 185, 80, 0.2); color: #3fb950; }

	.dot {
		opacity: 0.4;
	}

	.preview-summary {
		margin-top: 10px;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border-left: 3px solid var(--accent-primary);
		border-radius: 0 4px 4px 0;
		color: var(--text-secondary);
		font-size: 13px;
	}

	.prose-content {
		width: 100%;
		max-width: 720px;
		font-family: var(--font-prose);
		font-size: 17px;
		line-height: 1.8;
		color: var(--text-primary);
	}

	:global(.prose-content .doc-heading) {
		font-family: var(--font-ui);
		font-weight: 700;
		color: var(--text-primary);
		margin-top: 1.8em;
		margin-bottom: 0.6em;
		line-height: 1.3;
	}

	:global(.prose-content .h1) {
		font-size: 2.2em;
		border-bottom: 1px solid var(--border-subtle);
		padding-bottom: 0.3em;
		color: var(--accent-hover);
	}

	:global(.prose-content .h2) {
		font-size: 1.6em;
		color: var(--text-primary);
	}

	:global(.prose-content .h3) {
		font-size: 1.25em;
		color: var(--text-secondary);
	}

	:global(.prose-content .doc-paragraph) {
		margin-bottom: 1.4em;
		text-align: justify;
		text-justify: var(--preview-text-justify, auto);
		text-indent: var(--preview-text-indent, 0%);
		text-rendering: var(--preview-text-rendering, auto);
		font-feature-settings: var(--preview-font-features, normal);
		text-autospace: var(--preview-autospace, normal);
		-webkit-text-autospace: var(--preview-autospace, normal);
	}

	:global(.prose-content .doc-blockquote) {
		border-left: 3px solid var(--accent-primary);
		padding: 6px 16px;
		margin: 1.4em 0;
		background: var(--bg-secondary);
		border-radius: 0 6px 6px 0;
		color: var(--text-secondary);
		font-style: italic;
	}

	:global(.prose-content .doc-list),
	:global(.prose-content .doc-ordered-list) {
		margin: 1em 0 1.4em 1.5em;
		padding: 0;
	}

	:global(.prose-content li) {
		margin-bottom: 0.4em;
	}

	:global(.prose-content .doc-checklist) {
		list-style: none;
		padding: 0;
		margin: 1em 0 1.4em 0;
	}

	:global(.prose-content .task-item) {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 0.4em;
	}

	:global(.prose-content .task-item input) {
		accent-color: var(--accent-primary);
	}

	:global(.prose-content .inline-code) {
		font-family: var(--font-editor);
		background-color: var(--bg-tertiary);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.88em;
		color: var(--accent-primary);
	}

	:global(.prose-content .code-block) {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 14px;
		overflow-x: auto;
		margin: 1.4em 0;
		font-family: var(--font-editor);
		font-size: 14px;
		line-height: 1.5;
	}

	:global(.prose-content .divider) {
		border: none;
		height: 1px;
		background: var(--border-subtle);
		margin: 2em 0;
	}

	:global(.prose-content .doc-link) {
		color: var(--accent-primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.prose-content .wikilink-btn) {
		display: inline-flex;
		align-items: center;
		background: var(--accent-subtle);
		color: var(--accent-hover);
		border: 1px solid rgba(230, 157, 69, 0.3);
		border-radius: 4px;
		padding: 1px 6px;
		font-family: var(--font-ui);
		font-size: 0.9em;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
		margin: 0 2px;
	}

	:global(.prose-content .wikilink-btn:hover) {
		background: var(--accent-primary);
		color: #000;
		border-color: var(--accent-primary);
	}
</style>
