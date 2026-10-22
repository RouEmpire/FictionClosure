export type ExportFormat = "pdf" | "epub" | "docx" | "markdown" | "html";

export type PaperSize =
	| "A4"
	| "A5"
	| "Letter"
	| "Legal"
	| "Executive"
	| "B5";

export type FontFamily = "Times-Roman" | "Helvetica" | "Courier";

export type TextAlign = "left" | "center" | "right" | "justify";

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
	category: "serif" | "sans" | "mono";
}

export interface ColorPresetOption {
	id: string;
	label: string;
	hex: string;
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
	textAlign: TextAlign;
	includeCover: boolean;
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
