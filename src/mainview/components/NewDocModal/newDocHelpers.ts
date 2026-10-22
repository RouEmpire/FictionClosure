import type { DocumentType, ProjectFolder } from "@shared/types";
import { slugifyTitle } from "@shared/domain/documentPaths";

export function getDefaultDocTitle(docType: DocumentType, existingCount: number): string {
    if (docType === "manuscript") {
        return `Chapter ${existingCount + 1}`;
    } else if (docType === "character") {
        return "New Character";
    } else if (docType === "plot") {
        return "New Plot Arc";
    } else if (docType === "world") {
        return "New Lore Entry";
    }
    return "New Note";
}

export function getInitialDocContent(docType: DocumentType, trimmedTitle: string): string {
    if (docType === "manuscript") {
        return `# ${trimmedTitle}\n\nThe scene opens...\n`;
    } else if (docType === "character") {
        return `# ${trimmedTitle}\n\n## Overview\n\n## Appearance\n\n## Motivation & Goals\n\n## Relationships\n`;
    } else if (docType === "world") {
        return `# ${trimmedTitle}\n\n## Description\n\n## History\n\n## Rules & Significance\n`;
    } else if (docType === "plot") {
        return `# ${trimmedTitle}\n\n## Premise & Stakes\n\n## Inciting Incident\n\n## Rising Action & Climax\n\n## Resolution\n`;
    }
    return `# ${trimmedTitle}\n\n## Objective\n\n- [ ] Initial beat\n- [ ] Key reveal\n`;
}

export function buildDocRelativePath(
    parentFolder: ProjectFolder | undefined,
    docType: DocumentType,
    trimmedTitle: string,
    existingCount: number,
): string | undefined {
    if (!parentFolder) return undefined;
    const prefix = docType === "manuscript" ? `${String(existingCount + 1).padStart(2, "0")}_` : "";
    return `${parentFolder.relativePath}/${prefix}${slugifyTitle(trimmedTitle)}.md`;
}

export function buildFolderRelativePath(
    parentFolder: ProjectFolder | undefined,
    docType: DocumentType,
    trimmedName: string,
): string {
    const slug = slugifyTitle(trimmedName);
    if (parentFolder) {
        return `${parentFolder.relativePath}/${slug}`;
    }
    const typePrefix =
        docType === "character"
            ? "characters"
            : docType === "plot"
            ? "plots"
            : docType === "world"
            ? "world"
            : docType === "manuscript"
            ? "manuscript"
            : "notes";
    return `${typePrefix}/${slug}`;
}
