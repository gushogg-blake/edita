import type {Node} from "core";
import {Hiliter} from "core/hiliting";

let wordRe = /\w/;

let keywords = new Set([
	"as",
	"case",
	"of",
	"class",
	"data",
	"family",
	"instance",
	"default",
	"deriving",
	"do",
	"forall",
	"foreign",
	"hiding",
	"if",
	"then",
	"else",
	"import",
	"infix",
	"infixl",
	"infixr",
	"let",
	"in",
	"mdo",
	"module",
	"newtype",
	"proc",
	"qualified",
	"rec",
	"type",
	"where",
]);

export default class extends Hiliter {
	getHiliteClass(node: Node): string | null {
		let {type, parent, text} = node;
		
		if ([
			"string",
			"regex",
		].includes(parent?.type)) {
			return null;
		}
		
		if (
			[
				"identifier",
				"property_identifier",
				"shorthand_property_identifier",
				"shorthand_property_identifier_pattern",
				"statement_identifier",
				"type_identifier",
				"predefined_type",
			].includes(type)
			&& !(
				parent?.parent?.type === "type"
				&& keywords.has(text)
			)
		) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string", "template_string", "`", "escape_sequence"].includes(type)) {
			return "string";
		}
		
		if (["integer", "real", "arithmetic_negation_expression"].includes(type)) {
			return "number";
		}
		
		if (type === "regex") {
			return "regex";
		}
		
		if ("(){}[]".includes(type) || type === "${") {
			return "bracket";
		}
		
		if (type[0].match(wordRe)) {
			if (keywords.has(type) || keywords.has(text)) {
				return "keyword";
			} else {
				return "id";
			}
		}
		
		return "symbol";
	}
}
