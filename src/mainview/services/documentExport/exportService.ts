import type { FictionDocument, ProjectInfo } from "@shared/types";
import {
	createPdfBlob,
	generateDefaultExportFileName,
	uint8ArrayToBase64,
} from "./exportDownloader";
import { areStandardFontsAvailable } from "./fontManager";
import { findBundledFont } from "@shared/domain/bundledFonts";
import { renderPdfDocument } from "./pdfDocumentRenderer";
import type {
	ExportProgressCallback,
	ExportResult,
	PdfExportOptions,
} from "./types";

/**
 * Validates whether the project and document set are ready for PDF export.
 */
export function validateExportPrerequisites(
	project: ProjectInfo,
	documents: FictionDocument[],
	options: PdfExportOptions,
): { valid: boolean; reason?: string } {
	if (!project) {
		return { valid: false, reason: "No active project specified for export." };
	}

	const manuscriptDocs = options.includeManuscriptOnly
		? documents.filter((d) => d.type === "manuscript")
		: documents;

	if (manuscriptDocs.length === 0) {
		return {
			valid: false,
			reason:
				"Project contains no manuscript documents to export. Add at least one chapter or toggle include all documents.",
		};
	}

	// Validate custom or bundled font selection
	if (options.fontFamily === "custom") {
		if (
			!options.customFont ||
			!options.customFont.data ||
			options.customFont.data.byteLength === 0
		) {
			return {
				valid: false,
				reason:
					"A custom font file (.ttf or .otf) must be selected when using the Custom Font option.",
			};
		}
	} else if (findBundledFont(options.fontFamily)) {
		// Bundled fonts are verified and available in the distribution
	} else if (!areStandardFontsAvailable()) {
		return {
			valid: false,
			reason: `Standard font "${options.fontFamily}" is not available on this system. Please select a Bundled Font or Custom Font.`,
		};
	}

	return { valid: true };
}

/**
 * High-level service function to export a project to PDF format.
 */
export async function exportProjectToPdf(
	project: ProjectInfo,
	documents: FictionDocument[],
	options: PdfExportOptions,
	onProgress?: ExportProgressCallback,
): Promise<ExportResult> {
	const validation = validateExportPrerequisites(project, documents, options);
	if (!validation.valid) {
		return {
			success: false,
			error: validation.reason || "Export validation failed.",
		};
	}

	const fileName =
		options.customFileName?.trim() ||
		generateDefaultExportFileName(project.name || "Novel");

	try {
		const pdfBytes = await renderPdfDocument(
			project,
			documents,
			options,
			onProgress,
		);
		const blob = createPdfBlob(pdfBytes);

		let savedDiskPath: string | undefined = undefined;

		// If saveToDisk callback is provided and project has a folder path on disk,
		// automatically save the generated PDF into the project's exports/ directory
		if (options.saveToDisk && project.folderPath) {
			onProgress?.({
				stage: "saving",
				currentStep: 5,
				totalSteps: 5,
				message: "Saving PDF to project exports/ folder...",
			});

			try {
				const base64 = uint8ArrayToBase64(pdfBytes);
				const saveRes = await options.saveToDisk(
					project.folderPath,
					fileName,
					base64,
				);
				if (saveRes.success && saveRes.filePath) {
					savedDiskPath = saveRes.filePath;
				}
			} catch (err) {
				console.warn("Could not save to project exports folder:", err);
			}
		}

		return {
			success: true,
			bytes: pdfBytes.byteLength,
			blob,
			fileName,
			filePath: savedDiskPath,
		};
	} catch (err) {
		console.error("PDF export failed:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
