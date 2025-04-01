import {Evented} from "utils";
import type Clipboard from "./Clipboard";
import type JsonStore from "./JsonStore";

type Path = {
	sep: string;
	resolve(...parts: string[]): string;
};

export default class extends Evented {
	isWeb: boolean;
	isMainWindow: boolean;
	config: any;
	systemInfo: any;
	path: Path;
	clipboard: Clipboard;
	jsonStore: JsonStore;
	
	// ...
	
	constructor() {
		super();
	}
	
	async init(config?: any): void;
}
