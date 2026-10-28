import type { FictionDocument, ProjectInfo } from "@shared/types";
import type { EditorTypographySettings } from "@shared/domain/typography";
import type { VimSettings } from "@shared/domain/vim";
import type { AutoSaveSettings } from "@shared/domain/autoSave";
import type { KeybindingActionId } from "@shared/domain/keybindings";

export interface WorkspaceProps {
    project: ProjectInfo;
    documents: FictionDocument[];
    editorFont?: string;
    typography?: EditorTypographySettings;
    vimSettings?: VimSettings;
    autoSaveSettings?: AutoSaveSettings;
    keybindings?: Record<KeybindingActionId, string[]>;
    onCloseProject: () => void;
    onOpenSettings: () => void;
    onOpenShortcuts: () => void;
    onProjectSaved?: (project: ProjectInfo, documents: FictionDocument[]) => void;
    onShowToast: (msg: string) => void;
}
