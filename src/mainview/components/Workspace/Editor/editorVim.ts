import { attach, type VimMode } from "@vimee/plugin-textarea";
import type { VimSettings } from "@shared/domain/vim";

export interface VimAttachmentCallbacks {
    onContentChange: (newContent: string) => void;
    onSave: () => void;
    onModeChange: (mode: VimMode) => void;
    onAfterTextChange: () => void;
}

export interface VimAttachmentHandle {
    destroy: () => void;
    getMode: () => VimMode;
    getContent: () => string;
}

/**
 * Attaches vim keybindings and state handling to the workspace editor textarea.
 * When enabled, binds modal editing, `:w` project save, and clipboard yank integration.
 */
export function setupVimTextarea(
    textarea: HTMLTextAreaElement | null,
    settings: VimSettings,
    callbacks: VimAttachmentCallbacks,
): VimAttachmentHandle | null {
    if (!textarea || !settings.enabled) {
        return null;
    }

    try {
        const vim = attach(textarea, {
            indentStyle: settings.indentStyle,
            indentWidth: settings.indentWidth,
            onChange: (val) => {
                callbacks.onContentChange(val);
                callbacks.onAfterTextChange();
            },
            onModeChange: (mode) => {
                callbacks.onModeChange(mode);
            },
            onSave: () => {
                callbacks.onSave();
            },
            onYank: (text) => {
                if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(text).catch(() => {
                        // Silently handle if clipboard write is blocked by browser permissions
                    });
                }
            },
        });

        // Initialize mode callback with starting mode
        callbacks.onModeChange(vim.getMode());

        return {
            destroy: () => {
                vim.destroy();
            },
            getMode: () => vim.getMode(),
            getContent: () => vim.getContent(),
        };
    } catch (err) {
        console.error("FictionClosure Vim Plugin Error: Failed to attach to textarea:", err);
        return null;
    }
}
