/**
 * Gitmoji standard adapted for creative fiction writing.
 * Based on Gitmoji (https://gitmoji.dev) with meanings tailored for authors, novelists, and storytellers.
 */

export type GitmojiCategory = "writing" | "plot" | "characters" | "review" | "meta";

export interface GitmojiItem {
	emoji: string;
	code: string;
	description: string;
	writingDescription: string;
	category: GitmojiCategory;
}

export const FICTION_GITMOJIS: readonly GitmojiItem[] = [
	// --- Writing & Drafting ---
	{
		emoji: "📝",
		code: ":memo:",
		description: "Add or update documentation",
		writingDescription: "Draft or revise manuscript prose and chapters",
		category: "writing",
	},
	{
		emoji: "💬",
		code: ":speech_balloon:",
		description: "Add or update text and literals",
		writingDescription: "Write or refine dialogue and conversations",
		category: "writing",
	},
	{
		emoji: "🎨",
		code: ":art:",
		description: "Improve structure / format of the code",
		writingDescription: "Polish prose style, tone, pacing, or narrative voice",
		category: "writing",
	},
	{
		emoji: "🚧",
		code: ":construction:",
		description: "Work in progress",
		writingDescription: "Rough draft or work in progress scene",
		category: "writing",
	},
	{
		emoji: "🔥",
		code: ":fire:",
		description: "Remove code or files",
		writingDescription: "Cut discarded scenes or remove redundant passages",
		category: "writing",
	},
	{
		emoji: "⚡️",
		code: ":zap:",
		description: "Improve performance",
		writingDescription: "Improve narrative flow, scene pacing, or reduce exposition",
		category: "writing",
	},

	// --- Plot & Structure ---
	{
		emoji: "♻️",
		code: ":recycle:",
		description: "Refactor code",
		writingDescription: "Refactor storyline, restructure plot, or reorganize scenes",
		category: "plot",
	},
	{
		emoji: "🐛",
		code: ":bug:",
		description: "Fix a bug",
		writingDescription: "Fix plot holes, timeline contradictions, or continuity errors",
		category: "plot",
	},
	{
		emoji: "🧩",
		code: ":jigsaw:",
		description: "Add or update puzzle or modular pieces",
		writingDescription: "Connect subplots, plant foreshadowing, or resolve mysteries",
		category: "plot",
	},
	{
		emoji: "⏱️",
		code: ":stopwatch:",
		description: "Add or update performance benchmarks / timing",
		writingDescription: "Adjust chronology, scene timeline, or pacing sequence",
		category: "plot",
	},
	{
		emoji: "🔒️",
		code: ":lock:",
		description: "Fix security issues",
		writingDescription: "Conceal secrets, plot twists, or foreshadowing hints",
		category: "plot",
	},
	{
		emoji: "🚑️",
		code: ":ambulance:",
		description: "Critical hotfix",
		writingDescription: "Urgent storyline repair, canon fix, or critical plot fix",
		category: "plot",
	},

	// --- Characters & Lore ---
	{
		emoji: "✨",
		code: ":sparkles:",
		description: "Introduce new features",
		writingDescription: "Introduce new characters, subplots, or magic/world elements",
		category: "characters",
	},
	{
		emoji: "🎭",
		code: ":performing_arts:",
		description: "Theatrical or aesthetic update",
		writingDescription: "Character arc development, motivations, or backstory",
		category: "characters",
	},
	{
		emoji: "📖",
		code: ":book:",
		description: "Add or update documentation",
		writingDescription: "Add or update lore, research notes, or world bible",
		category: "characters",
	},
	{
		emoji: "🗺️",
		code: ":map:",
		description: "Add or update site map or geographic data",
		writingDescription: "Setting details, world geography, locations, or maps",
		category: "characters",
	},
	{
		emoji: "🏷️",
		code: ":label:",
		description: "Add or update types",
		writingDescription: "Update character tags, document statuses, or POV metadata",
		category: "characters",
	},

	// --- Review & Polish ---
	{
		emoji: "🔍",
		code: ":mag:",
		description: "Improve SEO",
		writingDescription: "Proofread, fix spelling, grammar, or word choices",
		category: "review",
	},
	{
		emoji: "🤝",
		code: ":handshake:",
		description: "Add or update dependencies or third-party",
		writingDescription: "Incorporate beta reader, editor, or critique feedback",
		category: "review",
	},
	{
		emoji: "💄",
		code: ":lipstick:",
		description: "Add or update the UI and style files",
		writingDescription: "Formatting, chapter headings, breaks, and typography",
		category: "review",
	},
	{
		emoji: "⏪",
		code: ":rewind:",
		description: "Revert changes",
		writingDescription: "Revert manuscript changes or restore prior version",
		category: "review",
	},

	// --- Meta & Milestones ---
	{
		emoji: "🎉",
		code: ":tada:",
		description: "Begin a project",
		writingDescription: "Project kickoff, initial story idea, or novel genesis",
		category: "meta",
	},
	{
		emoji: "🚀",
		code: ":rocket:",
		description: "Deploy stuff",
		writingDescription: "Draft milestone completed, export manuscript, or publishing",
		category: "meta",
	},
	{
		emoji: "🔖",
		code: ":bookmark:",
		description: "Release / Version tags",
		writingDescription: "Version milestone (e.g. First Draft, Arc 1 Complete)",
		category: "meta",
	},
	{
		emoji: "🗃️",
		code: ":card_file_box:",
		description: "Perform database related changes",
		writingDescription: "Reorganize chapter folders, binder ordering, or hierarchy",
		category: "meta",
	},
	{
		emoji: "🗑️",
		code: ":wastebasket:",
		description: "Deprecate code that needs to be cleaned up",
		writingDescription: "Archive discarded drafts, unused outlines, or scraps",
		category: "meta",
	},
	{
		emoji: "💡",
		code: ":bulb:",
		description: "Add or update comments in source code",
		writingDescription: "Brainstorm new story ideas, premises, or themes",
		category: "meta",
	},
	{
		emoji: "✒️",
		code: ":black_nib:",
		description: "Authoring notes",
		writingDescription: "Author's notes, preface, afterword, or acknowledgments",
		category: "meta",
	},
] as const;

export const DEFAULT_WRITING_GITMOJI: GitmojiItem = FICTION_GITMOJIS[0]; // 📝 :memo:

/**
 * Finds a Gitmoji item by its emoji character or :shortcode:.
 */
export function getGitmojiByCodeOrEmoji(token: string): GitmojiItem | undefined {
	const trimmed = token.trim();
	return FICTION_GITMOJIS.find(
		(item) => item.emoji === trimmed || item.code.toLowerCase() === trimmed.toLowerCase(),
	);
}

/**
 * Parses a commit message to extract any leading Gitmoji (emoji or shortcode).
 */
export function parseCommitMessage(rawMessage: string): {
	gitmoji: string;
	gitmojiCode?: string;
	cleanMessage: string;
	item?: GitmojiItem;
} {
	const trimmed = rawMessage.trim();
	if (!trimmed) {
		return { gitmoji: "", cleanMessage: "" };
	}

	// 1. Check for leading :shortcode: pattern, e.g. ":recycle: refactor plot"
	const shortcodeMatch = trimmed.match(/^(:[a-zA-Z0-9_+-]+:)\s*(.*)$/);
	if (shortcodeMatch) {
		const code = shortcodeMatch[1];
		const rest = shortcodeMatch[2].trim();
		const item = getGitmojiByCodeOrEmoji(code);
		return {
			gitmoji: item ? item.emoji : "",
			gitmojiCode: code,
			cleanMessage: rest,
			item,
		};
	}

	// 2. Check for leading unicode emoji character(s)
	for (const item of FICTION_GITMOJIS) {
		if (trimmed.startsWith(item.emoji)) {
			const rest = trimmed.slice(item.emoji.length).trim();
			return {
				gitmoji: item.emoji,
				gitmojiCode: item.code,
				cleanMessage: rest,
				item,
			};
		}
	}

	return {
		gitmoji: "",
		cleanMessage: trimmed,
	};
}

/**
 * Formats a commit message with an emoji prefix adhering to Gitmoji standards.
 */
export function formatCommitMessage(emojiOrCode: string, userMessage: string): string {
	const cleanUser = userMessage.trim();
	const item = getGitmojiByCodeOrEmoji(emojiOrCode);
	const prefix = item ? item.emoji : emojiOrCode.trim();

	// If the user already typed this emoji at the start, don't duplicate
	if (cleanUser.startsWith(prefix)) {
		return cleanUser;
	}

	return prefix ? `${prefix} ${cleanUser}` : cleanUser;
}

/**
 * Filter Gitmojis by search term and optional category.
 */
export function searchGitmojis(
	query: string,
	category?: GitmojiCategory | "all",
): GitmojiItem[] {
	const q = query.trim().toLowerCase();
	return FICTION_GITMOJIS.filter((item) => {
		if (category && category !== "all" && item.category !== category) {
			return false;
		}
		if (!q) return true;
		return (
			item.emoji.includes(q) ||
			item.code.toLowerCase().includes(q) ||
			item.writingDescription.toLowerCase().includes(q) ||
			item.description.toLowerCase().includes(q)
		);
	});
}
