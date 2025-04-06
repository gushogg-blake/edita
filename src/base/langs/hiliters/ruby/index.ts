import type {Node} from "core";
import {Hiliter} from "modules/hiliter";

let wordRe = /\w/;

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {type, parent} = node;
		
		if ([
			"string",
			"regex",
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"identifier",
			"constant",
			"simple_symbol",
			"hash_key_symbol",
			"class_variable",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string"].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (type === "regex") {
			return "regex";
		}
		
		if ("(){}[]".includes(type) || type === "${") {
			return "bracket";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		if (type === "hash_bang_line") {
			return "hashBang";
		}
		
		return "symbol";
	}
}
