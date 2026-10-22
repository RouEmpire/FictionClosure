<script lang="ts">
	import type { FictionDocument } from "@shared/types";
	import {
		calculateWordCount,
		estimateReadingTimeMinutes,
	} from "@shared/domain/markdown";
	import {
		DEFAULT_TYPOGRAPHY_SETTINGS,
		type EditorTypographySettings,
	} from "@shared/domain/typography";
	import PreviewHeader from "./PreviewHeader.svelte";
	import PreviewBody from "./PreviewBody.svelte";

	interface Props {
		document: FictionDocument;
		typography?: EditorTypographySettings;
		onSelectWikilink: (targetName: string) => void;
	}

	let {
		document,
		typography = DEFAULT_TYPOGRAPHY_SETTINGS,
		onSelectWikilink,
	}: Props = $props();

	const activeTypography = $derived(typography || DEFAULT_TYPOGRAPHY_SETTINGS);
	const wordCount = $derived(calculateWordCount(document.content));
	const readingTime = $derived(estimateReadingTimeMinutes(wordCount));
</script>

<div class="preview-container" role="region" aria-label="Markdown preview">
	<PreviewHeader {document} {wordCount} {readingTime} />
	<PreviewBody
		{document}
		typography={activeTypography}
		{onSelectWikilink}
	/>
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
</style>
