import astMode from "./astMode";
import codeIntel from "./codeIntel";

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

let lang = {
	group: "haskell",
	code: "haskell",
	name: "Haskell",
	defaultExtension: "hs",
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
			
		].includes(node.type)) {
			return {
				opener: node.firstChild,
				closer: node.lastChild,
			};
		}
		
		return null;
	},
	
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
			"hs",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};

export default lang;
