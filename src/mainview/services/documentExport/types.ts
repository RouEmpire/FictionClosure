export type ExportFormat = "pdf" | "epub" | "docx" | "markdown" | "html";

export type PaperSize =
	| "A4"
	| "A5"
	| "Letter"
	| "Legal"
	| "Executive"
	| "B5";

export type StandardFontFamily = "Times-Roman" | "Helvetica" | "Courier";

export type FontFamily = StandardFontFamily | "custom";

export type TextAlign = "left" | "center" | "right" | "justify";

export interface CustomFontConfig {
	name: string;
	data: Uint8Array;
	fileName: string;
	format: "ttf" | "otf" | "woff";
	sizeBytes: number;
}

export interface PaperDimension {
	width: number;
	height: number;
}

export interface PaperSizeOption {
	id: PaperSize;
	label: string;
	description: string;
	width: number;
	height: number;
}

export interface FontFamilyOption {
	id: FontFamily;
	label: string;
	description: string;
	category: "serif" | "sans" | "mono" | "custom";
}

export interface ColorPresetOption {
	id: string;
	label: string;
	hex: string;
}

export type CoverImageFit = "fill" | "cover" | "contain" | "none";
export type CoverPositionX = "left" | "center" | "right";
export type CoverPositionY = "top" | "middle" | "bottom";

export interface CoverOptionConfig {
	enabled: boolean;
	source: "project" | "custom" | "none";
	customImageDataUrl?: string;
	fit: CoverImageFit;
	positionX: CoverPositionX;
	positionY: CoverPositionY;
}

export interface FormatStatusOption {
	id: ExportFormat;
	label: string;
	ext: string;
	status: "ready" | "later";
	icon: string;
	description: string;
}

export interface PdfExportOptions {
	format: "pdf";
	paperSize: PaperSize;
	textColor: string;
	pageColor: string;
	margin: number;
	showPageNumber: boolean;
	fontFamily: FontFamily;
	customFont?: CustomFontConfig;
	textAlign: TextAlign;
	includeCover: boolean;
	coverOptions?: CoverOptionConfig;
	includeTitlePage: boolean;
	includeManuscriptOnly: boolean;
	customFileName?: string;
	saveToDisk?: (
		folderPath: string,
		fileName: string,
		pdfBase64: string,
	) => Promise<{ success: boolean; filePath?: string; error?: string }>;
}

export interface ExportProgress {
	stage: "preparing" | "rendering" | "styling" | "finalizing" | "saving";
	currentStep: number;
	totalSteps: number;
	message: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

export interface ExportResult {
	success: boolean;
	bytes?: number;
	filePath?: string;
	blob?: Blob;
	fileName?: string;
	error?: string;
}
