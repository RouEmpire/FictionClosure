import { describe, expect, it, beforeEach } from "bun:test";
import { setupVimTextarea, type VimAttachmentCallbacks } from "../src/mainview/components/Workspace/Editor/editorVim";
import type { VimSettings } from "../src/shared/domain/vim";

describe("Vim Textarea Integration (setupVimTextarea)", () => {
    beforeEach(() => {
        globalThis.getComputedStyle = (() => ({
            lineHeight: "26px",
            fontSize: "16px",
            paddingTop: "12px",
            paddingBottom: "24px",
        })) as unknown as typeof getComputedStyle;

        class MockKeyboardEvent extends Event {
            key: string;
            ctrlKey: boolean;
            shiftKey: boolean;
            altKey: boolean;
            metaKey: boolean;

            constructor(type: string, init?: { key?: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean }) {
                super(type, { bubbles: true, cancelable: true });
                this.key = init?.key ?? "";
                this.ctrlKey = init?.ctrlKey ?? false;
                this.shiftKey = init?.shiftKey ?? false;
                this.altKey = init?.altKey ?? false;
                this.metaKey = init?.metaKey ?? false;
            }
        }
        globalThis.KeyboardEvent = MockKeyboardEvent as unknown as typeof KeyboardEvent;
    });

    function createMockTextarea(initialValue: string = "Hello Vim Novelist\nSecond Line\n"): HTMLTextAreaElement {
        let val = initialValue;
        const listeners: Record<string, ((e: Event) => void)[]> = {};

        const textarea = {
            get value() {
                return val;
            },
            set value(v: string) {
                val = v;
            },
            selectionStart: 0,
            selectionEnd: 0,
            scrollTop: 0,
            clientHeight: 400,
            dataset: {} as Record<string, string>,
            addEventListener(type: string, listener: (e: Event) => void) {
                listeners[type] = listeners[type] || [];
                listeners[type].push(listener);
            },
            removeEventListener(type: string, listener: (e: Event) => void) {
                if (listeners[type]) {
                    listeners[type] = listeners[type].filter((l) => l !== listener);
                }
            },
            dispatchEvent(event: Event) {
                const handlers = listeners[event.type] || [];
                for (const h of handlers) h(event);
                return true;
            },
        } as unknown as HTMLTextAreaElement;

        return textarea;
    }

    it("returns null when vim settings are disabled", () => {
        const textarea = createMockTextarea();
        const settings: VimSettings = {
            enabled: false,
            indentStyle: "space",
            indentWidth: 2,
        };
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {},
            onModeChange: () => {},
            onAfterTextChange: () => {},
        };

        const handle = setupVimTextarea(textarea, settings, callbacks);
        expect(handle).toBeNull();
    });

    it("returns null when textarea is null", () => {
        const settings: VimSettings = {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
        };
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {},
            onModeChange: () => {},
            onAfterTextChange: () => {},
        };

        const handle = setupVimTextarea(null, settings, callbacks);
        expect(handle).toBeNull();
    });

    it("attaches successfully and initializes in normal mode", () => {
        const textarea = createMockTextarea("Draft scene 1");
        let reportedMode: string = "";

        const settings: VimSettings = {
            enabled: true,
            indentStyle: "space",
            indentWidth: 4,
        };
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {},
            onModeChange: (m) => {
                reportedMode = m;
            },
            onAfterTextChange: () => {},
        };

        const handle = setupVimTextarea(textarea, settings, callbacks);
        expect(handle).not.toBeNull();
        expect(reportedMode).toBe("normal");
        expect(handle?.getMode()).toBe("normal");
        expect(textarea.dataset.vimeeMode).toBe("normal");

        handle?.destroy();
        expect(textarea.dataset.vimeeMode).toBeUndefined();
    });

    it("triggers onSave callback when :w action executes", () => {
        const textarea = createMockTextarea("Chapter content");
        let savedCount = 0;

        const settings: VimSettings = {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
        };
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {
                savedCount++;
            },
            onModeChange: () => {},
            onAfterTextChange: () => {},
        };

        const handle = setupVimTextarea(textarea, settings, callbacks);

        // Simulate typing :w Enter in normal mode
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: ":" }));
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

        expect(savedCount).toBe(1);
        handle?.destroy();
    });

    it("copies to clipboard on yank (onYank)", () => {
        const textarea = createMockTextarea("Line of narrative text");
        let copiedClipboard = "";

        globalThis.navigator = {
            ...globalThis.navigator,
            clipboard: {
                writeText: async (text: string) => {
                    copiedClipboard = text;
                },
            } as Clipboard,
        };

        const settings: VimSettings = {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
        };
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {},
            onModeChange: () => {},
            onAfterTextChange: () => {},
        };

        const handle = setupVimTextarea(textarea, settings, callbacks);

        // Simulate 'yy' (yank current line)
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "y" }));
        textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "y" }));

        expect(copiedClipboard).toContain("Line of narrative text");
        handle?.destroy();
    });

    it("safely handles repeated attach, teardown, and re-attach cycles", () => {
        const textarea1 = createMockTextarea("Doc 1");
        const textarea2 = createMockTextarea("Doc 2");

        const settings: VimSettings = {
            enabled: true,
            indentStyle: "space",
            indentWidth: 2,
        };

        let activeMode: string = "";
        const callbacks: VimAttachmentCallbacks = {
            onContentChange: () => {},
            onSave: () => {},
            onModeChange: (m) => {
                activeMode = m;
            },
            onAfterTextChange: () => {},
        };

        // Attach Doc 1
        const handle1 = setupVimTextarea(textarea1, settings, callbacks);
        expect(handle1).not.toBeNull();
        expect(activeMode).toBe("normal");
        expect(textarea1.dataset.vimeeMode).toBe("normal");

        // Teardown Doc 1
        handle1?.destroy();
        expect(textarea1.dataset.vimeeMode).toBeUndefined();

        // Attach Doc 2
        const handle2 = setupVimTextarea(textarea2, settings, callbacks);
        expect(handle2).not.toBeNull();
        expect(activeMode).toBe("normal");
        expect(textarea2.dataset.vimeeMode).toBe("normal");

        handle2?.destroy();
        expect(textarea2.dataset.vimeeMode).toBeUndefined();
    });
});
