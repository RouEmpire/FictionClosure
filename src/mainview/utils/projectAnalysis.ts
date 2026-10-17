import type {
	FictionDocument,
	ProjectAnalysisResult,
	ProjectInfo,
} from "../../shared/types";
import { calculateWordCount } from "./markdown";

/**
 * Analyzes the structure, document breakdown, and integrity of a FictionClosure project.
 */
export function analyzeProject(
	folderPath: string,
	project: ProjectInfo | null | undefined,
	documents: FictionDocument[] = [],
	hasStacks: boolean = false,
	hasGitignore: boolean = false,
): ProjectAnalysisResult {
	const issues: string[] = [];
	const warnings: string[] = [];

	const manifestFound = Boolean(project);
	let manifestValid = false;

	if (!manifestFound) {
		issues.push("project.json was not found in the selected folder.");
	} else if (!project?.name || project.name.trim() === "") {
		warnings.push("Project name is missing or empty in project.json.");
	} else {
		manifestValid = true;
	}

	let manuscriptCount = 0;
	let characterCount = 0;
	let worldCount = 0;
	let notesCount = 0;
	let totalWordCount = 0;

	for (const doc of documents) {
		const words = calculateWordCount(doc.content || "");
		totalWordCount += words;

		switch (doc.type) {
			case "manuscript":
				manuscriptCount++;
				break;
			case "character":
				characterCount++;
				break;
			case "world":
				worldCount++;
				break;
			case "note":
			default:
				notesCount++;
				break;
		}

		if (!doc.title || doc.title.trim() === "") {
			warnings.push(`Document ${doc.id} has an empty or missing title.`);
		}
	}

	if (documents.length === 0) {
		warnings.push("No documents were found in this project folder.");
	}

	if (!hasStacks) {
		// Not fatal, just informational
	}

	let status: "valid" | "warning" | "invalid" = "valid";
	if (issues.length > 0) {
		status = "invalid";
	} else if (warnings.length > 0) {
		status = "warning";
	}

	return {
		isValid: status !== "invalid",
		status,
		folderPath,
		manifestFound,
		manifestValid,
		projectName: project?.name,
		author: project?.author,
		genre: project?.genre,
		targetWordCount: project?.targetWordCount,
		documentsFound: documents.length,
		manuscriptCount,
		characterCount,
		worldCount,
		notesCount,
		totalWordCount,
		hasStacks,
		hasGitignore,
		issues,
		warnings,
	};
}
