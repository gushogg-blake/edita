import {Evented, type PromiseWithMethods} from "utils";
import type {URL, Document, File} from "core";
import type {App} from "ui/app";
import type {ContextMenuOptions} from "ui/contextMenu";
import type Clipboard from "./Clipboard";
import type {JsonStore} from "./JsonStore";

type Path = {
	sep: string;
	resolve(...parts: string[]): string;
};

export default class extends Evented<{
	closeWindow: void;
	windowClosing: void;
	openFromElectronSecondInstance: string[];
	dialogClosed: void;
}> {
	isWeb: boolean;
	isMainWindow: boolean;
	config: any;
	systemInfo: any;
	path: Path;
	clipboard: Clipboard;
	jsonStore: JsonStore;
	lsp?: any; // TYPE
	fs: any; // TYPE fs
	urlsToOpenOnStartup?: URL[] = [];
	
	init(config?: any): Promise<void> {
		throw new Error("abstract");
	}
	
	backup(document: Document): void {
		throw new Error("abstract");
	}
	
	removeBackup(document: Document): void {
		throw new Error("abstract");
	}
	
	filesFromDropEvent(e, app: App): Promise<File[]> {
		throw new Error("abstract");
	}
	
	dialogPromise(showSyntheticDialog, name, options, windowOptions): PromiseWithMethods<any> {
		throw new Error("abstract");
	}
	
	openDialogWindow(app, dialog, dialogOptions, windowOptions): void {
		throw new Error("abstract");
	}
	
	callOpener(method: string, data: unknown) {
		throw new Error("electron only");
	}
	
	showContextMenu(e: Event, app: App, items, options: ContextMenuOptions = {}): void {
		throw new Error("abstract");
	}
	
	showContextMenuForElement(app: App, element: HTMLElement, items, options: ContextMenuOptions = {}): void {
		throw new Error("abstract");
	}
	
	get isWindows(): boolean {
		throw new Error("abstract");
	}
	
	setTitle(title: string): void {
		throw new Error("abstract");
	}
	
	loadTreeSitterLanguage(name: string): Promise<any> { // TYPE tree-sitter lang
		throw new Error("abstract");
	}
	
	locateTreeSitterWasm(): string {
		throw new Error("abstract");
	}
	
	showWindow(): void {
		throw new Error("electron only");
	}
	
	closeWindow(): void {
		throw new Error("electron only");
	}
}
