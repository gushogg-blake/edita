import {Lang} from "core";

export default class extends Lang {
	group = "lisp";
	code = "tsq";
	name = "Tree-sitter Query";
	defaultExtension = "tsq";
	
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
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"tsq",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
