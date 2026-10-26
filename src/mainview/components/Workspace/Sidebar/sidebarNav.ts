import type { DocumentType, FictionDocument, ProjectFolder } from "@shared/types";

export interface NavTreeItem {
	kind: "section" | "folder" | "doc";
	type: DocumentType;
	id: string;
	label: string;
}

export function buildVisibleNavItems(
	sections: { type: DocumentType; label: string }[],
	documents: FictionDocument[],
	folders: ProjectFolder[],
	collapsedSections: Record<DocumentType, boolean>,
	collapsedFolders: Record<string, boolean>,
): NavTreeItem[] {
	const items: NavTreeItem[] = [];

	function getChildFolders(parentId: string): ProjectFolder[] {
		return folders.filter((f) => f.parentId === parentId);
	}

	function getFolderDocs(folderId: string): FictionDocument[] {
		return documents
			.filter((d) => d.folderId === folderId)
			.sort((a, b) => a.order - b.order);
	}

	function addFolderItems(f: ProjectFolder, sectionType: DocumentType) {
		items.push({
			kind: "folder",
			type: f.type || sectionType,
			id: f.id,
			label: f.name,
		});
		if (!collapsedFolders[f.id]) {
			for (const child of getChildFolders(f.id)) {
				addFolderItems(child, sectionType);
			}
			for (const doc of getFolderDocs(f.id)) {
				items.push({ kind: "doc", type: doc.type, id: doc.id, label: doc.title });
			}
		}
	}

	for (const sec of sections) {
		items.push({
			kind: "section",
			type: sec.type,
			id: `section-${sec.type}`,
			label: sec.label,
		});

		if (!collapsedSections[sec.type]) {
			const rootFolders = folders.filter((f) => !f.parentId && f.type === sec.type);
			for (const rf of rootFolders) {
				addFolderItems(rf, sec.type);
			}

			const rootDocs = documents
				.filter((d) => !d.folderId && d.type === sec.type)
				.sort((a, b) => a.order - b.order);
			for (const doc of rootDocs) {
				items.push({ kind: "doc", type: doc.type, id: doc.id, label: doc.title });
			}
		}
	}

	return items;
}

/**
 * Filters documents and folders to only those relevant to an active Git diff comparison.
 */
export function filterDiffNavData(
	documents: FictionDocument[],
	folders: ProjectFolder[],
	diffChangedDocIds?: Set<string> | null,
): { filteredDocs: FictionDocument[]; filteredFolders: ProjectFolder[] } {
	if (!diffChangedDocIds) {
		return { filteredDocs: documents, filteredFolders: folders };
	}

	const relevantDocs = documents.filter((d) => diffChangedDocIds.has(d.id));
	const relevantFolderIds = new Set<string>();

	for (const doc of relevantDocs) {
		let currentId = doc.folderId;
		while (currentId) {
			relevantFolderIds.add(currentId);
			const parent = folders.find((f) => f.id === currentId)?.parentId;
			currentId = parent || null;
		}
	}

	const relevantFolders = folders.filter((f) => relevantFolderIds.has(f.id));
	return { filteredDocs: relevantDocs, filteredFolders: relevantFolders };
}
