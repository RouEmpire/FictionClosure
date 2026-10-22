export interface RawShortcutItem {
	keys: string[];
	desc: string;
}

export interface RawShortcutGroup {
	id: string;
	title: string;
	shortcuts: RawShortcutItem[];
}

export interface ShortcutsHeaderConfig {
	title: string;
	icon: string;
}

export interface ShortcutsFooterConfig {
	tipPrefix: string;
	tipKey: string;
	tipSuffix: string;
	buttonText: string;
}

export interface ShortcutsConfig {
	header: ShortcutsHeaderConfig;
	footer: ShortcutsFooterConfig;
	groups: RawShortcutGroup[];
}

export interface ResolvedShortcutItem {
	keys: string[];
	desc: string;
}

export interface ResolvedShortcutGroup {
	id: string;
	title: string;
	shortcuts: ResolvedShortcutItem[];
}

export interface ShortcutsModalProps {
	isOpen: boolean;
	onClose: () => void;
	config?: ShortcutsConfig;
}
