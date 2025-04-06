import type {Node} from "core";
import {Hiliter} from "modules/hiliter";

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
			"$",
			"name",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string", "\""].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (["php_tag", "?>"].includes(type)) {
			return "phpTag";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		return "symbol";
	}
}
