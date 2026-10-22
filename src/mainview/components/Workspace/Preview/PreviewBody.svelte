<script lang="ts">
	import type { FictionDocument } from "../../../../shared/types";
	import { renderMarkdown } from "../../../../shared/domain/markdown";
	import {
		formatFontFeatureSettings,
		formatTextAutospace,
		type EditorTypographySettings,
	} from "../../../../shared/domain/typography";

	interface Props {
		document: FictionDocument;
		typography: EditorTypographySettings;
		onSelectWikilink: (targetName: string) => void;
	}

	let { document, typography, onSelectWikilink }: Props = $props();

	const fontFeatureSettingsCss = $derived(
		formatFontFeatureSettings(
			typography.fontFeatures,
			typography.customFontFeaturesText,
		),
	);
	const textAutospaceCss = $derived(
		formatTextAutospace(
			typography.textAutospace,
			typography.customTextAutospace,
		),
	);

	const renderedHtml = $derived(renderMarkdown(document.content));

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

<div class="preview-body" use:wikilinkDelegation>
	<article
		class="prose-content"
		style="
			{typography.fontFamily ? `font-family: ${typography.fontFamily};` : ''}
			--preview-text-indent: {typography.firstLineIndent}%;
			--preview-text-justify: {typography.textJustify};
			--preview-text-rendering: {typography.textRendering};
			--preview-font-features: {fontFeatureSettingsCss};
			--preview-autospace: {textAutospaceCss};
		"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html renderedHtml}
	</article>
</div>

<style>
	.preview-body {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
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
