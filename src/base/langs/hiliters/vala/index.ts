import {Hiliter} from "modules/hiliter";

let wordRe = /\w/;

let keywords = new Set([
	"abstract",
	"as",
	"async",
	"base",
	"bool",
	"break",
	"case",
	"catch",
	"char",
	"class",
	"const",
	"construct",
	"continue",
	"default",
	"delegate",
	"delete",
	"do",
	"double",
	"else",
	"ensures",
	"enum",
	"export",
	"false",
	"finally",
	"float",
	"for",
	"foreach",
	"get",
	"if",
	"in",
	"instanceof",
	"int",
	"int8",
	"int16",
	"int32",
	"int64",
	"interface",
	"is",
	"long",
	"namespace",
	"new",
	"null",
	"override",
	"owned",
	"out",
	"public",
	"private",
	"protected",
	"ref",
	"return",
	"requires",
	"set",
	"short",
	"signal",
	"static",
	"string",
	"struct",
	"switch",
	"this",
	"throw",
	"throws",
	"true",
	"try",
	"typeof",
	"uchar",
	"uint",
	"uint8",
	"uint16",
	"uint32",
	"uint64",
	"ulong",
	"unichar",
	"unowned",
	"ushort",
	"using",
	"var",
	"virtual",
	"void",
	"weak",
	"while",
	"yield",
	
	// types are not always named after the word
	
	"this_access",
	"type",
]);

export default class extends Hiliter {
	getHiliteClass(node) {
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
			"vala",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
