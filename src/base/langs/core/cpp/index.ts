import {Lang} from "core";

let loggedTypes = [];

let wordRe = /\w/;

export default class extends Lang {
	group = "c";
	name = "C++";
	defaultExtension = "cpp";
	injections = [];
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"comment",
			"string",
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"identifier",
			"field_identifier",
		].includes(type)) {
			return "id";
		}
		
		if ([
			"type_identifier",
		].includes(type)) {
			return "type";
		}
		
		if (type === "#include") {
			return "include";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string_literal", "\""].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		return "symbol";
	}
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"cpp",
			"cxx",
			"cc",
		].includes(type)) {
			return "general";
		}
		
		if (type === "vala") {
			return "alternate";
		}
		
		return null;
	}
}
