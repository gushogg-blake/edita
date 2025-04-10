import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"quoted_attribute_value",
			"doctype",
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"<",
			">",
			"/>",
			"</",
			"tag_name",
		].includes(type)) {
			return "tag";
		}
		
		if (type === "attribute_name") {
			return "attribute";
		}
		
		if (type === "quoted_attribute_value") {
			return "string";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		return "text";
	}
}
