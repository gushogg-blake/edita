import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"string_value",
			"integer_value",
			"float_value",
		].includes(parent?.type)) { //
			return null;
		}
		
		if (type === "tag_name") {
			return "tagName";
		}
		
		if (type === "class_name") {
			return "className";
		}
		
		if (type === "id_name" || type === "#" && parent?.type === "id_selector") {
			return "idName";
		}
		
		if (type === "property_name") {
			return "property";
		}
		
		if (type === "string_value") {
			return "string";
		}
		
		if (type === "color_value") {
			return "color";
		}
		
		if (type === "float_value" || type === "integer_value") {
			return "number";
		}
		
		if (type === "plain_value") {
			return "text";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		return "symbol";
	}
}
