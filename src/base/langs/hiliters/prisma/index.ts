import type {Node} from "core";
import {Hiliter} from "core/hiliting";

let wordRe = /\w/;

let keywords = new Set([
	//"model",
	//"datasource",
	//"generator",
]);

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {type, parent} = node;
		
		if ([
			"string",
			"regex",
		].includes(parent?.type)) {
			return null;
		}
		
		if (["identifier", "<", "</", ">", "/>"].includes(type) && [
			"jsx_opening_element",
			"jsx_closing_element",
			"jsx_self_closing_element",
		].includes(parent?.type)) {
			return "jsx";
		}
		
		if (type === "jsx_text") {
			return "text";
		}
		
		if (
			false
			//|| type === "string" && parent?.type === "jsx_attribute"
			//|| ["property_identifier", "="].includes(type) && parent?.type === "jsx_attribute"
			//|| "{}".includes(type) && parent?.type === "jsx_expression"
		) {
			return "jsx";
		}
		
		if ([
			"identifier",
			"property_identifier",
			"shorthand_property_identifier",
			"shorthand_property_identifier_pattern",
			"statement_identifier",
			"type_identifier",
			"predefined_type",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string", "template_string", "`", "escape_sequence"].includes(type)) {
			return "string";
		}
		
		if (type === "number") {
			return "number";
		}
		
		if (type === "regex") {
			return "regex";
		}
		
		if ("(){}[]".includes(type) || type === "${") {
			return "bracket";
		}
		
		if (type[0].match(wordRe)) {
			if (keywords.has(type)) {
				return "keyword";
			} else {
				return "id";
			}
		}
		
		if (type === "hash_bang_line") {
			return "hashBang";
		}
		
		return "symbol";
	}
}
