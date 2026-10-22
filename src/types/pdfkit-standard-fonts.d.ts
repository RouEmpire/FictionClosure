declare module "pdfkit/standard-fonts/*" {
	const fontData: {
		name: string;
		bbox: [number, number, number, number];
		ascender: number;
		descender: number;
		xHeight?: number;
		capHeight?: number;
		glyphNames: string[];
		glyphWidths: number[];
		kernPairs?: Record<string, number>;
	};
	export default fontData;
}
