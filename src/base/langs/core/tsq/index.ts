import {Lang} from "core";

export default class extends Lang {
	group = "lisp";
	name = "Tree-sitter Query";
	defaultExtension = "tsq";
	
	getFooter(node) {
		return null;
	}
	
	getHeader(node) {
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
