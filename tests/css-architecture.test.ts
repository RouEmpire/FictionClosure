import { describe, test, expect } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("CSS Architecture & Semantic Design System", () => {
	const stylesDir = path.resolve(__dirname, "../src/mainview/styles");
	const appCssPath = path.resolve(__dirname, "../src/mainview/app.css");

	const tokensCss = fs.readFileSync(path.join(stylesDir, "tokens.css"), "utf-8");
	const componentsCss = fs.readFileSync(
		path.join(stylesDir, "components.css"),
		"utf-8",
	);
	const projectModalsCss = fs.readFileSync(
		path.join(stylesDir, "projectModals.css"),
		"utf-8",
	);
	const coverDropzoneCss = fs.readFileSync(
		path.join(stylesDir, "coverDropzone.css"),
		"utf-8",
	);
	const utilitiesCss = fs.readFileSync(
		path.join(stylesDir, "utilities.css"),
		"utf-8",
	);
	const appCss = fs.readFileSync(appCssPath, "utf-8");

	describe("Design Tokens (tokens.css)", () => {
		test("defines all essential surface tokens", () => {
			expect(tokensCss).toContain("--bg-primary:");
			expect(tokensCss).toContain("--bg-secondary:");
			expect(tokensCss).toContain("--bg-tertiary:");
			expect(tokensCss).toContain("--bg-hover:");
			expect(tokensCss).toContain("--bg-active:");
		});

		test("defines text and border contrast tokens", () => {
			expect(tokensCss).toContain("--border-subtle:");
			expect(tokensCss).toContain("--border-bold:");
			expect(tokensCss).toContain("--text-primary:");
			expect(tokensCss).toContain("--text-secondary:");
			expect(tokensCss).toContain("--text-muted:");
		});

		test("defines brand and secondary accent palettes", () => {
			expect(tokensCss).toContain("--accent-primary:");
			expect(tokensCss).toContain("--accent-hover:");
			expect(tokensCss).toContain("--accent-subtle:");
			expect(tokensCss).toContain("--accent-secondary:");
			expect(tokensCss).toContain("--accent-secondary-hover:");
			expect(tokensCss).toContain("--accent-secondary-subtle:");
		});

		test("defines consistent spacing and radius scale", () => {
			expect(tokensCss).toContain("--space-1:");
			expect(tokensCss).toContain("--space-2:");
			expect(tokensCss).toContain("--space-4:");
			expect(tokensCss).toContain("--radius-sm:");
			expect(tokensCss).toContain("--radius-md:");
			expect(tokensCss).toContain("--radius-lg:");
			expect(tokensCss).toContain("--radius-xl:");
		});

		test("defines elevation shadows and transition timings", () => {
			expect(tokensCss).toContain("--shadow-sm:");
			expect(tokensCss).toContain("--shadow-md:");
			expect(tokensCss).toContain("--shadow-modal:");
			expect(tokensCss).toContain("--transition-fast:");
			expect(tokensCss).toContain("--transition-normal:");
		});

		test("supports opt-in light theme variables via [data-theme='light']", () => {
			expect(tokensCss).toContain('[data-theme="light"]');
			expect(tokensCss).toContain("--bg-primary: #f6f8fa;");
			expect(tokensCss).toContain("--text-primary: #1f2328;");
		});
	});

	describe("Semantic Component System (components.css)", () => {
		test("defines standard button primitives (.btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-close)", () => {
			expect(componentsCss).toContain(".btn {");
			expect(componentsCss).toContain(".btn-primary");
			expect(componentsCss).toContain(".btn-secondary");
			expect(componentsCss).toContain(".btn-ghost");
			expect(componentsCss).toContain(".btn-danger");
			expect(componentsCss).toContain(".btn-close");
			expect(componentsCss).toContain(".btn-group");
			expect(componentsCss).toContain(".btn-group-item");
		});

		test("defines accessible focus states on buttons", () => {
			expect(componentsCss).toContain(".btn:focus-visible {");
			expect(componentsCss).toContain("outline: 2px solid var(--accent-primary);");
		});

		test("defines standard form controls (.form-group, .form-label, .form-input, .form-textarea, .form-select)", () => {
			expect(componentsCss).toContain(".form-group {");
			expect(componentsCss).toContain(".form-label {");
			expect(componentsCss).toContain(".form-input");
			expect(componentsCss).toContain(".form-textarea {");
			expect(componentsCss).toContain(".form-select {");
		});

		test("defines unified modal dialog structure (.modal-backdrop, .modal-dialog, .modal-header, .modal-body, .modal-footer)", () => {
			expect(componentsCss).toContain(".modal-backdrop");
			expect(componentsCss).toContain(".modal-dialog");
			expect(componentsCss).toContain(".modal-box");
			expect(componentsCss).toContain(".modal-header {");
			expect(componentsCss).toContain(".modal-title");
			expect(componentsCss).toContain(".modal-body {");
			expect(componentsCss).toContain(".modal-footer {");
		});

		test("defines card and badge primitives", () => {
			expect(componentsCss).toContain(".card {");
			expect(componentsCss).toContain(".badge {");
			expect(componentsCss).toContain(".badge-accent {");
			expect(componentsCss).toContain(".badge-secondary {");
		});
	});

	describe("Project Modals Styles (projectModals.css)", () => {
		test("defines modal tabs and indicators", () => {
			expect(projectModalsCss).toContain(".tabs-nav");
			expect(projectModalsCss).toContain(".tab-nav");
			expect(projectModalsCss).toContain(".tab-btn");
			expect(projectModalsCss).toContain(".tab-indicator");
			expect(projectModalsCss).toContain(".cover-dot");
		});

		test("defines dual-column form rows and word count presets", () => {
			expect(projectModalsCss).toContain(".form-row-two");
			expect(projectModalsCss).toContain(".preset-buttons");
			expect(projectModalsCss).toContain(".preset-btn");
			expect(projectModalsCss).toContain(".path-input-group");
			expect(projectModalsCss).toContain(".browse-folder-btn");
		});

		test("defines README editor and live markdown preview layout", () => {
			expect(projectModalsCss).toContain(".readme-pane");
			expect(projectModalsCss).toContain(".readme-toolbar");
			expect(projectModalsCss).toContain(".preview-toggle-btns");
			expect(projectModalsCss).toContain(".readme-editor");
			expect(projectModalsCss).toContain(".readme-rendered-preview");
		});

		test("defines modal footer actions and keyboard shortcut legends", () => {
			expect(projectModalsCss).toContain(".shortcut-legend");
			expect(projectModalsCss).toContain(".cancel-btn");
			expect(projectModalsCss).toContain(".create-project-btn");
			expect(projectModalsCss).toContain(".save-settings-btn");
		});
	});

	describe("Cover Dropzone & Previews (coverDropzone.css)", () => {
		test("defines format banner and chip badges", () => {
			expect(coverDropzoneCss).toContain(".cover-format-banner");
			expect(coverDropzoneCss).toContain(".supported-formats-banner");
			expect(coverDropzoneCss).toContain(".format-chips-grid");
			expect(coverDropzoneCss).toContain(".format-chip");
		});

		test("defines dropzone interactions and dragging states", () => {
			expect(coverDropzoneCss).toContain(".dropzone");
			expect(coverDropzoneCss).toContain(".cover-dropzone");
			expect(coverDropzoneCss).toContain(".drop-icon");
			expect(coverDropzoneCss).toContain(".hidden-file-input");
		});

		test("defines active cover previews and non-browser artwork badges", () => {
			expect(coverDropzoneCss).toContain(".active-cover-container");
			expect(coverDropzoneCss).toContain(".cover-preview-card");
			expect(coverDropzoneCss).toContain(".rendered-cover-img");
			expect(coverDropzoneCss).toContain(".non-browser-preview-card");
			expect(coverDropzoneCss).toContain(".artwork-file-badge");
			expect(coverDropzoneCss).toContain(".format-badge-banner");
			expect(coverDropzoneCss).toContain(".large-file-icon");
		});

		test("defines cover actions and existing covers gallery", () => {
			expect(coverDropzoneCss).toContain(".change-cover-btn");
			expect(coverDropzoneCss).toContain(".remove-cover-btn");
			expect(coverDropzoneCss).toContain(".existing-covers-gallery");
			expect(coverDropzoneCss).toContain(".gallery-item-btn");
		});
	});

	describe("Semantic Utilities (utilities.css)", () => {
		test("provides clean flex layout utility classes", () => {
			expect(utilitiesCss).toContain(".flex-row {");
			expect(utilitiesCss).toContain(".flex-col {");
			expect(utilitiesCss).toContain(".items-center {");
			expect(utilitiesCss).toContain(".justify-between {");
			expect(utilitiesCss).toContain(".justify-center {");
			expect(utilitiesCss).toContain(".flex-1 {");
			expect(utilitiesCss).toContain(".flex-wrap {");
		});

		test("provides semantic gap utilities based on tokens", () => {
			expect(utilitiesCss).toContain(".gap-1 {");
			expect(utilitiesCss).toContain(".gap-2 {");
			expect(utilitiesCss).toContain(".gap-3 {");
			expect(utilitiesCss).toContain(".gap-4 {");
		});

		test("provides text and accessibility helpers", () => {
			expect(utilitiesCss).toContain(".text-muted {");
			expect(utilitiesCss).toContain(".text-accent {");
			expect(utilitiesCss).toContain(".text-truncate {");
			expect(utilitiesCss).toContain(".sr-only {");
		});
	});

	describe("Global Entrypoint (app.css)", () => {
		test("imports all design system modules in correct order", () => {
			expect(appCss).toContain('@import "./styles/tokens.css";');
			expect(appCss).toContain('@import "./styles/components.css";');
			expect(appCss).toContain('@import "./styles/projectModals.css";');
			expect(appCss).toContain('@import "./styles/coverDropzone.css";');
			expect(appCss).toContain('@import "./styles/utilities.css";');
		});

		test("maintains responsive breakpoints and accessibility focus", () => {
			expect(appCss).toContain(":focus-visible {");
			expect(appCss).toContain("::-webkit-scrollbar {");
			expect(appCss).toContain("@media (max-width: 950px)");
			expect(appCss).toContain("@media (max-width: 768px)");
		});
	});

	describe("Architecture Constraints & Maintainability", () => {
		test("all design system CSS files remain under 400 lines", () => {
			const checkLines = (fileContent: string, maxLines = 400) => {
				const lineCount = fileContent.split("\n").length;
				expect(lineCount).toBeLessThanOrEqual(maxLines);
			};

			checkLines(tokensCss);
			checkLines(componentsCss);
			checkLines(projectModalsCss);
			checkLines(coverDropzoneCss);
			checkLines(utilitiesCss);
			checkLines(appCss);
		});
	});
});
