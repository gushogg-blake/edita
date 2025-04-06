import type {Node} from "core";
import {Hiliter} from "modules/hiliter";

export default class extends Hiliter {
	 // to get snippets
	
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"inline_link",
			"shortcut_link",
		].includes(type)) {
			return "link";
		}
		
		return null;
	}
}
