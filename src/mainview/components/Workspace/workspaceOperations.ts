import type {
    FictionDocument,
    ProjectFolder,
    ProjectInfo,
    SaveState,
} from "../../../shared/types";
import {
    promptSelectFolder,
    saveProject,
    setRememberedFolder,
    clearCrashCache,
} from "../../services/storage";
import { globalHistoryManager } from "../../services/historyManager";

export async function executeSave(
    project: ProjectInfo,
    documents: FictionDocument[],
    folders: ProjectFolder[],
    onShowToast: (msg: string) => void,
    onProjectSaved?: (project: ProjectInfo, documents: FictionDocument[]) => void,
): Promise<{ state: SaveState; savedAt?: string }> {
    if (!project.folderPath) {
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
        onShowToast(`Saved to ${project.folderPath}`);
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
