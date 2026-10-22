import type { FictionDocument, ProjectInfo } from "@shared/types";
import type { EditorTypographySettings } from "@shared/domain/typography";

export interface WorkspaceProps {
    project: ProjectInfo;
    documents: FictionDocument[];
    editorFont?: string;
    typography?: EditorTypographySettings;
    onCloseProject: () => void;
    onOpenSettings: () => void;
    onOpenShortcuts: () => void;
    onProjectSaved?: (project: ProjectInfo, documents: FictionDocument[]) => void;
    onShowToast: (msg: string) => void;
}
