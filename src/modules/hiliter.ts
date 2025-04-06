import type {Node} from "core";

export abstract class Hiliter {
	langCode: string;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
	
	abstract getHiliteClass(node: Node): string | null;
}
