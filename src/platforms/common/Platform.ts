import {Evented, type PromiseWithMethods} from "utils";
import type {URL, Document, File} from "core";
import type App from "ui/App";
import type {ContextMenuOptions} from "ui/contextMenu";
import type Clipboard from "./Clipboard";
import type {JsonStore} from "./JsonStore";

type Path = {
	sep: string;
	resolve(...parts: string[]): string;
};

/*
check loops so we can debug without freezing

if iterate() is called > max times in a session (between
calls to reset()), we get an alert in the UI, the info
is logged to the console, and we can break the loop
or let it continue for another step
*/

class Loop {
	private loops = 0;
	
	check(max: number, ...debugInfo) {
		if (this.loops > max) {
			console.log("Possible infinite loop\n");
			console.log("Debug info:\n");
			console.log(...debugInfo);
			
			if (!confirm("Possible infinite loop detected after " + max + " iterations. Continue?\n\nStack trace:\n\n" + stack)) {
				throw new Error("Breaking out of possible infinite loop");
			}
		}
		
		this.loops++;
		
		return true;
	}
	
	reset() {
		this.loops = 0;
	}
}

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
	
	private _loop = new Loop();
	
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
	
	loop(...args) {
		return this._loop.iterate(...args);
	}
	
	resetLoop() {
		this._loop.reset();
	}
}
