import {Lang} from "core";

let wordRe = /\w/;

export default class extends Lang {
	group = "javascript";
	name = "TSX";
	defaultExtension = "tsx";
	injections = [];
	
	isBlock(node) {
		return node.isMultiline() && [
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"arguments",
			"statement_block",
			"class_body",
			"template_string",
			"variable_declarator",
			"switch_body",
		].includes(node.type);
	}
	
	getFooter(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.firstChild)
			&& parent.lastChild.end.lineIndex > node.end.lineIndex
		) {
			return parent.lastChild;
		}
		
		return null;
	}
	
	getHeader(node) {
		let {parent} = node;
		
		if (
			parent
			&& this.isBlock(parent)
			&& node.equals(parent.lastChild)
			&& parent.firstChild.start.lineIndex < node.start.lineIndex
		) {
			return parent.firstChild;
		}
		
		return null;
	}
	
	getOpenerAndCloser(node) {
		if ([
			"object",
			"array",
			"parenthesized_expression", // includes if condition brackets
			"statement_block",
			"class_body",
			"template_string",
		].includes(node.type)) {
			return {
				opener: node.firstChild,
				closer: node.lastChild,
			};
		}
		
		return null;
	}
	
	getHiliteClass(node) {
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
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"tsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"jsx",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}
