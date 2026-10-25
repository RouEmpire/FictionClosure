import type { FictionDocument, ProjectFolder, ProjectInfo } from "../../../shared/types";

export function cascadeDeleteFolder(
    folders: ProjectFolder[],
    documents: FictionDocument[],
    folderId: string,
): { remainingFolders: ProjectFolder[]; deletedFolder: ProjectFolder | null } {
    const folderIndex = folders.findIndex((f) => f.id === folderId);
    if (folderIndex === -1) return { remainingFolders: folders, deletedFolder: null };
    const deletedFolder = folders[folderIndex];

    const folderIdsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
        added = false;
        for (const f of folders) {
            if (f.parentId && folderIdsToDelete.has(f.parentId) && !folderIdsToDelete.has(f.id)) {
                folderIdsToDelete.add(f.id);
                added = true;
            }
        }
    }

    for (const doc of documents) {
        if (doc.folderId && folderIdsToDelete.has(doc.folderId)) {
            doc.folderId = null;
        }
    }

    const remainingFolders = folders.filter((f) => !folderIdsToDelete.has(f.id));
    return { remainingFolders, deletedFolder };
}

export function duplicateDocument(
    documents: FictionDocument[],
    id: string,
): FictionDocument | null {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return null;
    const newDoc: FictionDocument = {
        id: `doc-${Date.now()}`,
        title: `${doc.title} (Copy)`,
        type: doc.type,
        status: doc.status,
        tags: [...doc.tags],
        order: doc.order + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: doc.content,
        pov: doc.pov,
        summary: doc.summary,
        folderId: doc.folderId,
    };
    const idx = documents.findIndex((d) => d.id === id);
    if (idx !== -1) {
        documents.splice(idx + 1, 0, newDoc);
    } else {
        documents.push(newDoc);
    }
    return newDoc;
}

export function renameFolderInList(
    folders: ProjectFolder[],
    folderId: string,
    newName: string,
): ProjectFolder | null {
    const f = folders.find((item) => item.id === folderId);
    if (!f || !newName.trim()) return null;
    f.name = newName.trim();
    f.updatedAt = new Date().toISOString();
    return f;
}

export function updateFolderMetaInList(
    folders: ProjectFolder[],
    folderId: string,
    updates: Partial<ProjectFolder>,
): ProjectFolder | null {
    const target = folders.find((f) => f.id === folderId);
    if (!target) return null;
    Object.assign(target, updates);
    target.updatedAt = new Date().toISOString();
    return target;
}

export function deleteDocFromList(
    documents: FictionDocument[],
    activeDocId: string | null,
    id: string,
): { newActiveDocId: string | null; deleted: boolean } {
    const idx = documents.findIndex((d) => d.id === id);
    if (idx === -1) return { newActiveDocId: activeDocId, deleted: false };
    documents.splice(idx, 1);
    const newActiveDocId = activeDocId === id ? (documents[0]?.id ?? null) : activeDocId;
    return { newActiveDocId, deleted: true };
}

export function renameDocInList(
    documents: FictionDocument[],
    id: string,
    newTitle: string,
): FictionDocument | null {
    const doc = documents.find((d) => d.id === id);
    if (!doc || !newTitle.trim()) return null;
    doc.title = newTitle.trim();
    doc.updatedAt = new Date().toISOString();
    return doc;
}

export function applyProjectSettingsUpdate(
    project: ProjectInfo,
    updated: {
        name: string;
        author: string;
        genre: string;
        targetWordCount: number;
        coverImage?: string;
        readme?: string;
    },
): ProjectInfo {
    return {
        ...project,
        name: updated.name,
        author: updated.author,
        genre: updated.genre,
        targetWordCount: updated.targetWordCount,
        coverImage: updated.coverImage,
        readme: updated.readme,
    };
}
