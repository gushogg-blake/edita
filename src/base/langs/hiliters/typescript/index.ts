import type {Node} from "core";
import {Hiliter} from "modules/hiliter";
import type {Node} from "core";
import type {Document, Node} from "core";

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
		
		if (["string", "string_fragment", "`", "escape_sequence"].includes(type)) {
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
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "//");
		}).join(document.format.newline);
	}
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(\/\/)?/, "$1");
		}).join(document.format.newline);
	}
}
