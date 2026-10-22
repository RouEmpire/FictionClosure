import type {
	ColorPresetOption,
	FontFamilyOption,
	FormatStatusOption,
	PaperSizeOption,
	PdfExportOptions,
} from "./types";

export const DEFAULT_PDF_EXPORT_OPTIONS: PdfExportOptions = {
	format: "pdf",
	paperSize: "A4",
	textColor: "#111827",
	pageColor: "#FFFFFF",
	margin: 54, // 0.75 in (54 pt)
	showPageNumber: true,
	fontFamily: "Times-Roman",
	textAlign: "justify",
	includeCover: true,
	includeTitlePage: true,
	includeManuscriptOnly: true,
};

export const PAPER_SIZE_OPTIONS: PaperSizeOption[] = [
	{
		id: "A4",
		label: "A4",
		description: "Standard International (210 × 297 mm)",
		width: 595.28,
		height: 841.89,
	},
	{
		id: "A5",
		label: "A5",
		description: "Compact Book / Digest (148 × 210 mm)",
		width: 419.53,
		height: 595.28,
	},
	{
		id: "Letter",
		label: "US Letter",
		description: "Standard North American (8.5 × 11 in)",
		width: 612,
		height: 792,
	},
	{
		id: "Legal",
		label: "US Legal",
		description: "Extended Document (8.5 × 14 in)",
		width: 612,
		height: 1008,
	},
	{
		id: "Executive",
		label: "Executive",
		description: "Monograph Format (7.25 × 10.5 in)",
		width: 522,
		height: 756,
	},
	{
		id: "B5",
		label: "B5",
		description: "Academic & Light Novel (176 × 250 mm)",
		width: 498.9,
		height: 708.66,
	},
];

export const FONT_FAMILY_OPTIONS: FontFamilyOption[] = [
	{
		id: "Times-Roman",
		label: "Times Roman",
		description: "Classic Literary Serif (Trade Book Standard)",
		category: "serif",
	},
	{
		id: "Helvetica",
		label: "Helvetica",
		description: "Modern Clean Sans-Serif",
		category: "sans",
	},
	{
		id: "Courier",
		label: "Courier",
		description: "Monospace Manuscript (Standard Submission)",
		category: "mono",
	},
];

export const TEXT_ALIGN_OPTIONS = [
	{ id: "left", label: "Left Align", icon: "fa-align-left" },
	{ id: "center", label: "Center Align", icon: "fa-align-center" },
	{ id: "right", label: "Right Align", icon: "fa-align-right" },
	{ id: "justify", label: "Justify (Book standard)", icon: "fa-align-justify" },
] as const;

export const PAGE_COLOR_PRESETS: ColorPresetOption[] = [
	{ id: "white", label: "Pure White", hex: "#FFFFFF" },
	{ id: "cream", label: "Warm Cream", hex: "#FDFBF7" },
	{ id: "antique", label: "Antique Paper", hex: "#F5F2EB" },
	{ id: "dark", label: "Dark Mode", hex: "#18181B" },
];

export const TEXT_COLOR_PRESETS: ColorPresetOption[] = [
	{ id: "onyx", label: "Onyx Black", hex: "#111827" },
	{ id: "charcoal", label: "Charcoal", hex: "#374151" },
	{ id: "sepia", label: "Sepia Ink", hex: "#3D2B1F" },
	{ id: "white", label: "Pure White", hex: "#F0F3F6" },
];

export const MARGIN_PRESETS = [
	{ id: "compact", label: "Compact (36 pt / 0.5 in)", pt: 36 },
	{ id: "normal", label: "Normal (54 pt / 0.75 in)", pt: 54 },
	{ id: "wide", label: "Wide (72 pt / 1.0 in)", pt: 72 },
	{ id: "book", label: "Book Trade (64 pt)", pt: 64 },
] as const;

export const EXPORT_FORMAT_OPTIONS: FormatStatusOption[] = [
	{
		id: "pdf",
		label: "PDF Document",
		ext: ".pdf",
		status: "ready",
		icon: "fa-file-pdf",
		description: "Print-ready, fixed-layout document with custom paper & styling",
	},
	{
		id: "epub",
		label: "EPUB eBook",
		ext: ".epub",
		status: "later",
		icon: "fa-book",
		description: "Reflowable digital book for e-readers and mobile devices",
	},
	{
		id: "docx",
		label: "Microsoft Word",
		ext: ".docx",
		status: "later",
		icon: "fa-file-word",
		description: "Editable manuscript document for editors and publishers",
	},
	{
		id: "markdown",
		label: "Markdown Archive",
		ext: ".zip",
		status: "later",
		icon: "fa-file-zipper",
		description: "Zip bundle of raw markdown files and metadata",
	},
	{
		id: "html",
		label: "Standalone HTML",
		ext: ".html",
		status: "later",
		icon: "fa-file-code",
		description: "Single self-contained web document with styling",
	},
];
