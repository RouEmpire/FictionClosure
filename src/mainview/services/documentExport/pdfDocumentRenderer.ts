import PDFDocument from "pdfkit";
import type { FictionDocument, ProjectInfo } from "@shared/types";
import { computeCoverImageLayout } from "./coverLayout";
import { prepareCoverImageBytes } from "./coverImageProcessor";
import { findBundledFont, loadBundledFontBytes } from "@shared/domain/bundledFonts";
import {
	areStandardFontsAvailable,
	ensureStandardFontsRegistered,
} from "./fontManager";
import {
	applyPageNumbers,
	paintPageBackground,
	resolveFontVariant,
	TYPOGRAPHY_METRICS,
} from "./pdfStyler";
import { parseMarkdownBlocks } from "./markdownFormatter";
import type { ExportProgressCallback, PdfExportOptions } from "./types";

/**
 * Renders a full fiction manuscript project into PDF format using PDFKit.
 */
export async function renderPdfDocument(
	project: ProjectInfo,
	documents: FictionDocument[],
	options: PdfExportOptions,
	onProgress?: ExportProgressCallback,
): Promise<Uint8Array> {
	// Pre-process cover image asynchronously before starting PDF stream
	let preparedCover: {
		bytes: Uint8Array;
		width?: number;
		height?: number;
	} | null = null;

	const coverCfg = options.coverOptions;
	const isCoverEnabled =
		options.includeCover &&
		coverCfg?.source !== "none" &&
		(coverCfg?.enabled ?? true);

	const coverDataUrl =
		coverCfg?.source === "custom"
			? coverCfg.customImageDataUrl
			: project.coverImage || coverCfg?.customImageDataUrl;

	if (isCoverEnabled && coverDataUrl) {
		try {
			preparedCover = await prepareCoverImageBytes(coverDataUrl);
		} catch (err) {
			console.warn("Could not prepare cover image for PDF export:", err);
		}
	}

	// Pre-load bundled font bytes if a bundled font was chosen
	const bundledFont = findBundledFont(options.fontFamily);
	let bundledFontBytes: Uint8Array | null = null;
	if (bundledFont) {
		try {
			bundledFontBytes = await loadBundledFontBytes(bundledFont);
		} catch (err) {
			console.warn(`Could not load bundled font "${bundledFont.name}":`, err);
		}
		if (!bundledFontBytes || bundledFontBytes.byteLength === 0) {
			throw new Error(
				`Bundled font "${bundledFont.name}" could not be loaded from application assets.`,
			);
		}
	}

	return new Promise((resolve, reject) => {
		try {
			onProgress?.({
				stage: "preparing",
				currentStep: 1,
				totalSteps: 5,
				message: "Initializing PDF layout and metadata...",
			});

			ensureStandardFontsRegistered();
			const customFontName = options.customFont?.name;
			const customFontData = options.customFont?.data;

			const defaultConstructorFont = customFontData
				? (customFontData as unknown as string)
				: bundledFontBytes
					? (bundledFontBytes as unknown as string)
					: areStandardFontsAvailable()
						? undefined
						: (null as unknown as string);

			const doc = new PDFDocument({
				size: options.paperSize,
				margin: options.margin,
				bufferPages: true,
				autoFirstPage: false,
				font: defaultConstructorFont,
				info: {
					Title: project.name || "Untitled",
					Author: project.author || "Author",
					Subject: project.genre || "Fiction",
					Creator: "FictionClosure",
				},
			});

			if (options.customFont) {
				doc.registerFont(options.customFont.name, options.customFont.data);
			}
			if (bundledFont && bundledFontBytes) {
				doc.registerFont(bundledFont.name, bundledFontBytes);
				if (options.fontFamily !== bundledFont.name) {
					doc.registerFont(options.fontFamily, bundledFontBytes);
				}
				if (bundledFont.id !== bundledFont.name && options.fontFamily !== bundledFont.id) {
					doc.registerFont(bundledFont.id, bundledFontBytes);
				}
			}

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

			// 1. Cover Page (if enabled and image was successfully prepared)
			let coverRendered = false;

			if (isCoverEnabled && preparedCover) {
				try {
					// Verify image decodes and extract dimensions using pure Uint8Array
					const pdfImg = (
						doc as unknown as {
							openImage: (src: Uint8Array) => {
								width: number;
								height: number;
							};
						}
					).openImage(preparedCover.bytes);

					// OpenImage must succeed before adding the page!
					doc.addPage({ margin: 0 });

					const imgWidth = pdfImg.width || preparedCover.width || 1;
					const imgHeight = pdfImg.height || preparedCover.height || 1;

					const layout = computeCoverImageLayout({
						pageWidth: doc.page.width,
						pageHeight: doc.page.height,
						imageWidth: imgWidth,
						imageHeight: imgHeight,
						fit: coverCfg?.fit || "cover",
						positionX: coverCfg?.positionX || "center",
						positionY: coverCfg?.positionY || "middle",
					});

					doc.save();
					if (layout.clipToPage) {
						doc.rect(0, 0, doc.page.width, doc.page.height).clip();
					}
					(
						doc as unknown as {
							image: (
								src: unknown,
								x: number,
								y: number,
								options?: { width: number; height: number },
							) => void;
						}
					).image(pdfImg, layout.x, layout.y, {
						width: layout.width,
						height: layout.height,
					});
					doc.restore();
					coverRendered = true;
				} catch (err) {
					console.warn("Could not embed cover image in PDF:", err);
				}
			}

			// 2. Title Page (if enabled)
			if (options.includeTitlePage) {
				doc.addPage();
				doc.moveDown(8);

				// Project Title
				doc
					.font(resolveFontVariant(options.fontFamily, "bold", customFontName))
					.fontSize(TYPOGRAPHY_METRICS.titleSize)
					.fillColor(options.textColor)
					.text(project.name || "Untitled Project", { align: "center" });

				doc.moveDown(1.5);

				// Author
				if (project.author) {
					doc
						.font(resolveFontVariant(options.fontFamily, "regular", customFontName))
						.fontSize(TYPOGRAPHY_METRICS.subtitleSize)
						.fillColor(options.textColor)
						.text(`by ${project.author}`, { align: "center" });
				}

				doc.moveDown(3);

				// Genre & Date Meta
				if (project.genre) {
					doc
						.font(resolveFontVariant(options.fontFamily, "italic", customFontName))
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
					.font(resolveFontVariant(options.fontFamily, "regular", customFontName))
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

			const regularFont = resolveFontVariant(options.fontFamily, "regular", customFontName);
			const boldFont = resolveFontVariant(options.fontFamily, "bold", customFontName);
			const italicFont = resolveFontVariant(options.fontFamily, "italic", customFontName);

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
					(coverRendered ? 1 : 0) + (options.includeTitlePage ? 1 : 0);

				applyPageNumbers(doc, {
					textColor: options.textColor,
					fontFamily: options.fontFamily,
					customFontName,
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
