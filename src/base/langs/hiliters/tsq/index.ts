import type {Node} from "core";
import {Hiliter} from "core/hiliting";

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if (type === "anonymous_leaf") {
			return "literal";
		}
		
		if (type === "predicate_name") {
			return "keyword";
		}
		
		if ([
			"wildcard_node",
			"one_or_more",
			"zero_or_more",
		].includes(type)) {
			return "wildcard";
		}
		
		if (type === "capture" && node.text.match(/^@-/)) {
			return "delete";
		}
		
		if (type.match(/\w/)) {
			return type;
		}
		
		return null;
	}
}
