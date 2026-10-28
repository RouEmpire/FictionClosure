import type {
    FictionDocument,
    ProjectFolder,
    ProjectInfo,
    SaveState,
} from "@shared/types";
import type { GitCommitRecord } from "@shared/domain/git";
import {
    promptSelectFolder,
    saveProject,
    loadProject,
    setRememberedFolder,
    clearCrashCache,
} from "@services/storage";
import { fetchGitDiffFiles } from "@services/git";
import { getDocumentRelativePath } from "@shared/domain/documentPaths";
import { globalHistoryManager } from "@services/historyManager";

export async function reloadProjectFromDisk(
    folderPath: string,
) {
    return await loadProject(folderPath);
}

export async function executeReloadProject(
    folderPath: string,
    activeDocId: string | null,
    onShowToast: (msg: string) => void,
): Promise<{ success: boolean; project?: ProjectInfo; documents?: FictionDocument[]; folders?: ProjectFolder[]; nextActiveDocId?: string }> {
    const res = await loadProject(folderPath);
    if (res.success && res.project && res.documents) {
        let nextDocId: string | undefined;
        if (!res.documents.some((d) => d.id === activeDocId) && res.documents.length > 0) {
            nextDocId = res.documents[0].id;
        }
        onShowToast("Project reloaded from disk");
        return { success: true, project: res.project, documents: res.documents, folders: res.folders, nextActiveDocId: nextDocId };
    }
    return { success: false };
}

export async function resolveDiffChangedDocs(
    folderPath: string,
    commitHash: string,
    documents: FictionDocument[],
): Promise<Set<string>> {
    const changedFiles = await fetchGitDiffFiles(folderPath, commitHash);
    const set = new Set<string>();
    for (const file of changedFiles) {
        const cleanFile = file.replace(/\\/g, "/");
        const doc = documents.find((d) => {
            const docRel = getDocumentRelativePath(d).replace(/\\/g, "/");
            return docRel === cleanFile || cleanFile.endsWith(docRel) || docRel.endsWith(cleanFile);
        });
        if (doc) set.add(doc.id);
    }
    return set;
}

export async function executeDiffSelection(
    folderPath: string | undefined,
    commit: GitCommitRecord,
    currentDiffCommit: GitCommitRecord | null,
    documents: FictionDocument[],
    activeDocId: string | null,
    onShowToast: (msg: string) => void,
): Promise<{ diffCommit: GitCommitRecord | null; changedDocIds: Set<string> | null; nextActiveDocId?: string }> {
    if (currentDiffCommit?.hash === commit.hash) {
        onShowToast("Exited Diff mode");
        return { diffCommit: null, changedDocIds: null };
    }
    if (!folderPath) {
        onShowToast("Cannot diff: Project is not saved to a folder");
        return { diffCommit: currentDiffCommit, changedDocIds: null };
    }
    try {
        const changedSet = await resolveDiffChangedDocs(folderPath, commit.hash, documents);
        let nextDocId: string | undefined;
        if (activeDocId && !changedSet.has(activeDocId) && changedSet.size > 0) {
            const firstChanged = Array.from(changedSet)[0];
            if (firstChanged) nextDocId = firstChanged;
        }
        onShowToast(`Diff active: comparing with ${commit.shortHash}`);
        return { diffCommit: commit, changedDocIds: changedSet, nextActiveDocId: nextDocId };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        onShowToast(`Failed to load diff: ${msg}`);
        return { diffCommit: currentDiffCommit, changedDocIds: null };
    }
}

export interface ExecuteSaveOptions {
    silent?: boolean;
}

export async function executeSave(
    project: ProjectInfo,
    documents: FictionDocument[],
    folders: ProjectFolder[],
    onShowToast: (msg: string) => void,
    onProjectSaved?: (project: ProjectInfo, documents: FictionDocument[]) => void,
    options?: ExecuteSaveOptions,
): Promise<{ state: SaveState; savedAt?: string }> {
    if (!project.folderPath) {
        if (options?.silent) {
            // Do not prompt interactive folder selection modal on background auto-save
            return { state: "saved" };
        }
        const selectRes = await promptSelectFolder();
        if (selectRes.canceled || !selectRes.folderPath) {
            onShowToast("Save canceled: no destination folder selected");
            return { state: "saved" };
        }
        project.folderPath = selectRes.folderPath;
        await setRememberedFolder(selectRes.folderPath);
    }

    const stacks = globalHistoryManager.exportAllStacks(project.targetWordCount);
    project.folders = folders;
    const res = await saveProject(project.folderPath, project, documents, stacks, folders);

    if (res.success) {
        project.lastSaved = res.savedAt;
        if (project.folderPath) {
            await clearCrashCache(project.folderPath);
        }
        onProjectSaved?.(project, documents);
        if (!options?.silent) {
            onShowToast(`Saved to ${project.folderPath}`);
        }
        return { state: "saved", savedAt: res.savedAt };
    } else {
        onShowToast(`Save failed: ${res.error || "Unknown error"}`);
        return { state: "error" };
    }
}

export function findDocOrFolderByTitle(
    title: string,
    documents: FictionDocument[],
    folders: ProjectFolder[],
): { doc?: FictionDocument; folder?: ProjectFolder } {
    const targetLower = title.trim().toLowerCase();
    const doc = documents.find((d) => d.title.toLowerCase() === targetLower);
    if (doc) return { doc };
    const folder = folders.find((f) => f.name.toLowerCase() === targetLower);
    if (folder) return { folder };
    return {};
}

export function createNewDocument(
    title: string,
    order: number,
    type: FictionDocument["type"] = "world",
): FictionDocument {
    return {
        id: `doc-${Date.now()}`,
        title: title.trim(),
        type,
        status: "draft",
        tags: [],
        order,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: `# ${title.trim()}\n\nAdd your notes for ${title} here...\n`,
    };
}
