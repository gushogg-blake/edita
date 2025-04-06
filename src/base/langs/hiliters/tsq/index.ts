import {Hiliter} from "modules/hiliter";

export default class extends Hiliter {
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
		return null;
	}
	
	getHiliteClass(node) {
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
