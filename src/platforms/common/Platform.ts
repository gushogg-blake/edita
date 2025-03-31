import {Evented} from "utils";
import type Clipboard from "./Clipboard";
import type Snippets from "./Snippets";

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
	snippets: Snippets;
	
	// ...
	
	constructor() {
		super();
	}
	
	async init(config?: any): void;
}
