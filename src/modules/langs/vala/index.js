let astMode = require("./astMode");
let codeIntel = require("./codeIntel");

let wordRe = /\w/;

let keywords = new Set([
	"abstract",
	"as",
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
	"delete",
	"do",
	"double",
	"else",
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
	"public",
	"private",
	"protected",
	"return",
	"set",
	"short",
	"signal",
	"static",
	"string",
	"struct",
	"switch",
	"this",
	"throw",
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
]);

let lang = {
	group: "vala",
	code: "vala",
	name: "Vala",
	defaultExtension: "vala",
	astMode,
	codeIntel,
	injections: [],
	
	init(env) {
		env = {...env, lang: this};
		
		this.astMode.init(env);
		this.codeIntel.init(env);
	},
	
	isBlock(node) {
		return node.isMultiline() && [
			"namespace_declaration", // classes
			"class_declaration", // classes
			"method_declaration", // functions
			"initializer", // case blocks, arrays
			//"for_statement",
			//"while_statement",
			//"do_statement",
			//"if_statement",
			//"else_statement",
			"switch_statement",
			"block", // for, while, do, if, else
		].includes(node.type);
	},
	
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
	},
	
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
	},
	
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
	},
	
	getHiliteClass(node) {
		let {type, parent} = node;
		
		if ([
			"string",
			"regex",
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
		
		return "symbol";
	},
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "//");
		}).join(document.format.newline);
	},
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(\/\/)?/, "$1");
		}).join(document.format.newline);
	},
	
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
	},
};

module.exports = lang;
