import {Evented} from "utils";
import type URL from "core";
import type Clipboard from "./Clipboard";
import type JsonStore from "./JsonStore";

type Path = {
	sep: string;
	resolve(...parts: string[]): string;
};

export default class extends Evented<{
	closeWindow: undefined;
	windowClosing: undefined;
	openFromElectronSecondInstance: string[];
	dialogClosed: undefined;
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
	
	// ...
	
	constructor() {
		super();
	}
	
	abstract init(config?: any): Promise<void>;
	
	callOpener(method: string, data: unknown) {
		throw new Error("callOpener: electron only");
	}
	
	abstract closeWindow(): void;
	abstract setTitle(title: string): void;
}
