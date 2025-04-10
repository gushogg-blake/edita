import type {Node} from "core";
import {Hiliter} from "core/hiliting";

let wordRe = /\w/;

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {
			type,
			parent,
		} = node;
		
		if ([
			
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"identifier",
		].includes(type)) {
			return "id";
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
}
