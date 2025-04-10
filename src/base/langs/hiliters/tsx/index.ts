import type {Node} from "core";
import {Hiliter} from "core/hiliting";

let wordRe = /\w/;

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {type, parent} = node;
		
		if ([
			"string",
			"regex",
			"predefined_type",
		].includes(parent?.type)) {
			return null;
		}
		
		if (type === "jsx_text") {
			return "text";
		}
		
		if ([
			"jsx_fragment",
			"jsx_opening_element",
			"jsx_closing_element",
			"jsx_self_closing_element",
			"jsx_attribute",
		].includes(parent?.type)) {
			if (["identifier", "<", "</", ">", "/>"].includes(type)) {
				return "jsx";
			}
		}
		
		if (
			[
				"jsx_opening_element",
				"jsx_closing_element",
			].includes(parent?.parent?.type)
			&& parent.type === "member_expression"
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
		].includes(type)) {
			return "id";
		}
		
		if (type === "predefined_type") {
			return "keyword";
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
			return "keyword";
		}
		
		if (type === "hash_bang_line") {
			return "hashBang";
		}
		
		return "symbol";
	}
}
