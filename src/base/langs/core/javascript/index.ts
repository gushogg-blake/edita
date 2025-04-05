import {Lang} from "core";

let wordRe = /\w/;

let keywords = new Set([
	"async",
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"from",
	"function",
	"get",
	"if",
	"in",
	"instanceof",
	"import",
	"let",
	"new",
	"null",
	"of",
	"return",
	"set",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"undefined",
	"var",
	"void",
	"while",
	"with",
	"yield",
]);

export default class extends Lang {
	group = "javascript";
	name = "JavaScript";
	defaultExtension = "js";
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
			"js",
			"cjs",
			"es",
			"es6",
			"mjs",
			"jsx",
		].includes(type)) {
			return "general";
		}
		
		if ([
			"json",
			"json5",
		].includes(type)) {
			return "alternate";
		}
		
		return null;
	}
}
