import type {
	CoverImageFit,
	CoverPositionX,
	CoverPositionY,
} from "./types";

export interface CoverLayoutInput {
	pageWidth: number;
	pageHeight: number;
	imageWidth: number;
	imageHeight: number;
	fit: CoverImageFit;
	positionX: CoverPositionX;
	positionY: CoverPositionY;
}

export interface CoverLayoutResult {
	x: number;
	y: number;
	width: number;
	height: number;
	clipToPage: boolean;
}

/**
 * Calculates the exact rendering rectangle (x, y, width, height) and clipping requirement
 * for an export cover image on a PDF page based on fit and 2D alignment position.
 */
export function computeCoverImageLayout(
	input: CoverLayoutInput,
): CoverLayoutResult {
	const {
		pageWidth,
		pageHeight,
		imageWidth,
		imageHeight,
		fit,
		positionX,
		positionY,
	} = input;

	if (
		imageWidth <= 0 ||
		imageHeight <= 0 ||
		pageWidth <= 0 ||
		pageHeight <= 0
	) {
		return {
			x: 0,
			y: 0,
			width: pageWidth,
			height: pageHeight,
			clipToPage: false,
		};
	}

	// 1. Fill: Stretch image to exactly fill page boundaries
	if (fit === "fill") {
		return {
			x: 0,
			y: 0,
			width: pageWidth,
			height: pageHeight,
			clipToPage: false,
		};
	}

	let renderWidth = imageWidth;
	let renderHeight = imageHeight;

	// 2. Sizing calculation
	if (fit === "contain") {
		// Scale to fit completely inside page maintaining aspect ratio
		const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
		renderWidth = imageWidth * scale;
		renderHeight = imageHeight * scale;
	} else if (fit === "cover") {
		// Scale to cover entire page maintaining aspect ratio, overflowing if necessary
		const scale = Math.max(pageWidth / imageWidth, pageHeight / imageHeight);
		renderWidth = imageWidth * scale;
		renderHeight = imageHeight * scale;
	}
	// If fit === "none", uses natural image 1:1 dimensions (renderWidth = imageWidth, renderHeight = imageHeight)

	// 3. Horizontal position calculation
	let x = 0;
	if (positionX === "center") {
		x = (pageWidth - renderWidth) / 2;
	} else if (positionX === "right") {
		x = pageWidth - renderWidth;
	} else {
		x = 0; // "left"
	}

	// 4. Vertical position calculation
	let y = 0;
	if (positionY === "middle") {
		y = (pageHeight - renderHeight) / 2;
	} else if (positionY === "bottom") {
		y = pageHeight - renderHeight;
	} else {
		y = 0; // "top"
	}

	// 5. Clipping requirement
	// Clip whenever image dimensions or positions exceed page bounds
	const exceedsPage =
		x < -0.01 ||
		y < -0.01 ||
		x + renderWidth > pageWidth + 0.01 ||
		y + renderHeight > pageHeight + 0.01;

	const clipToPage = fit === "cover" || exceedsPage;

	return {
		x,
		y,
		width: renderWidth,
		height: renderHeight,
		clipToPage,
	};
}

/**
 * Maps CoverPositionX and CoverPositionY to standard CSS object-position string.
 */
export function getCssObjectPosition(
	positionX: CoverPositionX,
	positionY: CoverPositionY,
): string {
	const vert = positionY === "middle" ? "center" : positionY;
	return `${positionX} ${vert}`;
}
