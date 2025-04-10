import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if (parent?.type.endsWith("_heading")) {
			return null;
		}
		
		if (type === "link") {
			return "link";
		}
		
		if (type.endsWith("_heading")) {
			return "heading";
		}
		
		return "text";
	}
}
