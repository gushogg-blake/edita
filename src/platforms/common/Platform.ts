import {Evented} from "utils";

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
	
	// ...
	
	constructor() {
		super();
	}
	
	async init(config?: any): void;
}
