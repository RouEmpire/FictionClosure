import PDFDocument from "pdfkit";
import type { FictionDocument, ProjectInfo } from "@shared/types";
import { canRenderBrowserPreview } from "@shared/domain/coverSupport";
import {
	applyPageNumbers,
	paintPageBackground,
	resolveFontVariant,
	TYPOGRAPHY_METRICS,
} from "./pdfStyler";
import { parseMarkdownBlocks } from "./markdownFormatter";
import type { ExportProgressCallback, PdfExportOptions } from "./types";

/**
 * Decodes a base64 data URL into a Uint8Array for PDFKit image embedding.
 */
function decodeDataUrlToUint8Array(dataUrl: string): Uint8Array | null {
	try {
		const base64Index = dataUrl.indexOf(";base64,");
		if (base64Index === -1) return null;
		const base64 = dataUrl.slice(base64Index + 8);
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch {
		return null;
	}
}

/**
 * Renders a full fiction manuscript project into PDF format using PDFKit.
 */
export async function renderPdfDocument(
	project: ProjectInfo,
	documents: FictionDocument[],
	options: PdfExportOptions,
	onProgress?: ExportProgressCallback,
): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		try {
			onProgress?.({
				stage: "preparing",
				currentStep: 1,
				totalSteps: 5,
				message: "Initializing PDF layout and metadata...",
			});

			const doc = new PDFDocument({
				size: options.paperSize,
				margin: options.margin,
				bufferPages: true,
				autoFirstPage: false,
				info: {
					Title: project.name || "Untitled",
					Author: project.author || "Author",
					Subject: project.genre || "Fiction",
					Creator: "FictionClosure",
				},
			});

			// Accumulate PDF binary chunks
			const chunks: Uint8Array[] = [];
			doc.on("data", (chunk: Uint8Array) => {
				chunks.push(chunk);
			});

			doc.on("end", () => {
				const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
				const merged = new Uint8Array(totalLength);
				let offset = 0;
				for (const chunk of chunks) {
					merged.set(chunk, offset);
					offset += chunk.length;
				}
				resolve(merged);
			});

			doc.on("error", (err: Error) => {
				reject(err);
			});

			// On every new page, paint the user-selected background color
			doc.on("pageAdded", () => {
				paintPageBackground(doc, options.pageColor);
			});

			// 1. Cover Page (if enabled and project has a renderable cover)
			if (options.includeCover && project.coverImage) {
				const isRenderable = canRenderBrowserPreview(project.coverImage);
				if (isRenderable && project.coverImage.startsWith("data:")) {
					const coverBytes = decodeDataUrlToUint8Array(project.coverImage);
					if (coverBytes) {
						try {
							doc.addPage({ margin: 0 });
							const imgBuffer = Buffer.from(coverBytes.buffer) as unknown as Buffer;
							doc.image(imgBuffer, 0, 0, {
								fit: [doc.page.width, doc.page.height],
								align: "center",
								valign: "center",
							});
						} catch (err) {
							console.warn("Could not embed cover image in PDF:", err);
						}
					}
				}
			}

			// 2. Title Page (if enabled)
			if (options.includeTitlePage) {
				doc.addPage();
				doc.moveDown(8);

				// Project Title
				doc
					.font(resolveFontVariant(options.fontFamily, "bold"))
					.fontSize(TYPOGRAPHY_METRICS.titleSize)
					.fillColor(options.textColor)
					.text(project.name || "Untitled Project", { align: "center" });

				doc.moveDown(1.5);

				// Author
				if (project.author) {
					doc
						.font(resolveFontVariant(options.fontFamily, "regular"))
						.fontSize(TYPOGRAPHY_METRICS.subtitleSize)
						.fillColor(options.textColor)
						.text(`by ${project.author}`, { align: "center" });
				}

				doc.moveDown(3);

				// Genre & Date Meta
				if (project.genre) {
					doc
						.font(resolveFontVariant(options.fontFamily, "italic"))
						.fontSize(TYPOGRAPHY_METRICS.metaSize)
						.fillColor(options.textColor)
						.text(project.genre, { align: "center" });
				}

				const exportDate = new Date().toLocaleDateString(undefined, {
					year: "numeric",
					month: "long",
					day: "numeric",
				});
				doc
					.font(resolveFontVariant(options.fontFamily, "regular"))
					.fontSize(TYPOGRAPHY_METRICS.metaSize)
					.fillColor(options.textColor)
					.text(exportDate, { align: "center" });
			}

			// 3. Manuscript Content
			onProgress?.({
				stage: "rendering",
				currentStep: 2,
				totalSteps: 5,
				message: "Rendering chapters and formatting prose...",
			});

			const docsToExport = options.includeManuscriptOnly
				? documents.filter((d) => d.type === "manuscript")
				: [...documents];

			docsToExport.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			const regularFont = resolveFontVariant(options.fontFamily, "regular");
			const boldFont = resolveFontVariant(options.fontFamily, "bold");
			const italicFont = resolveFontVariant(options.fontFamily, "italic");

			for (let i = 0; i < docsToExport.length; i++) {
				const docItem = docsToExport[i];
				if (!docItem) continue;

				// Start chapter on fresh page
				doc.addPage();

				// Chapter Heading
				doc
					.font(boldFont)
					.fontSize(TYPOGRAPHY_METRICS.h1Size)
					.fillColor(options.textColor)
					.text(docItem.title || "Untitled Chapter", { align: "center" });

				doc.moveDown(2);

				// Parse and render content blocks
				const blocks = parseMarkdownBlocks(docItem.content || "");
				for (const block of blocks) {
					if (block.type === "heading") {
						const level = block.level ?? 2;
						const size =
							level === 1
								? TYPOGRAPHY_METRICS.h1Size
								: level === 2
									? TYPOGRAPHY_METRICS.h2Size
									: TYPOGRAPHY_METRICS.h3Size;

						doc.moveDown(1);
						doc
							.font(boldFont)
							.fontSize(size)
							.fillColor(options.textColor)
							.text(block.text || "", { align: "left" });
						doc.moveDown(0.6);
					} else if (block.type === "divider") {
						doc.moveDown(1);
						doc
							.font(regularFont)
							.fontSize(TYPOGRAPHY_METRICS.dividerSize)
							.fillColor(options.textColor)
							.text("* * *", { align: "center" });
						doc.moveDown(1);
					} else if (block.type === "blockquote") {
						doc
							.font(italicFont)
							.fontSize(TYPOGRAPHY_METRICS.blockquoteSize)
							.fillColor(options.textColor)
							.text(block.text || "", {
								indent: TYPOGRAPHY_METRICS.blockquoteIndent,
								align: options.textAlign,
								lineGap: TYPOGRAPHY_METRICS.bodyLineGap,
							});
						doc.moveDown(0.5);
					} else if (block.type === "listItem") {
						doc
							.font(regularFont)
							.fontSize(TYPOGRAPHY_METRICS.bodySize)
							.fillColor(options.textColor)
							.text(`•  ${block.text || ""}`, {
								indent: 14,
								align: "left",
								lineGap: TYPOGRAPHY_METRICS.bodyLineGap,
							});
						doc.moveDown(0.3);
					} else {
						// Standard prose paragraph
						doc
							.font(regularFont)
							.fontSize(TYPOGRAPHY_METRICS.bodySize)
							.fillColor(options.textColor)
							.text(block.text || "", {
								align: options.textAlign,
								lineGap: TYPOGRAPHY_METRICS.bodyLineGap,
							});
						doc.moveDown(0.6);
					}
				}
			}

			// 4. Header Page Numbers
			if (options.showPageNumber) {
				onProgress?.({
					stage: "styling",
					currentStep: 3,
					totalSteps: 5,
					message: "Applying top header page numbers (<page>/<total>)...",
				});

				const startPage =
					(options.includeCover && project.coverImage ? 1 : 0) +
					(options.includeTitlePage ? 1 : 0);

				applyPageNumbers(doc, {
					textColor: options.textColor,
					fontFamily: options.fontFamily,
					startFromPage: startPage,
				});
			}

			// 5. Finalize document
			onProgress?.({
				stage: "finalizing",
				currentStep: 4,
				totalSteps: 5,
				message: "Compiling binary PDF stream...",
			});

			doc.end();
		} catch (err) {
			reject(err);
		}
	});
}
