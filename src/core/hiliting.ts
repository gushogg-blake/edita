import type {Node} from "core";

export type HiliteStyle = {
	color: string;
	fontWeight?: "normal" | "bold";
	fontStyle?: "normal" | "italic";
	textDecoration?: "none" | "underline";
};

export abstract class Hiliter {
	langCode: string;
	
	constructor(langCode: string) {
		this.langCode = langCode;
	}
	
	abstract getHiliteClass(node: Node): string | null;
}
