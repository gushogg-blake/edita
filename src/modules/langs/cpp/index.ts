import astMode from "./astMode";
import codeIntel from "./codeIntel";

let loggedTypes = [];

let wordRe = /\w/;

let lang = {
	group: "c",
	code: "cpp",
	name: "C++",
	defaultExtension: "cpp",
	astMode,
	codeIntel,
	injections: [],
	
	init(env) {
		env = {...env, lang: this};
		
		//this.astMode.init(env);
		this.codeIntel.init(env);
	},
	
	isBlock(node) {
		return node.start.lineIndex !== node.end.lineIndex && [
			"function_definition",
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
	
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"comment",
			"string",
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"identifier",
			"field_identifier",
		].includes(type)) {
			return "id";
		}
		
		if ([
			"type_identifier",
		].includes(type)) {
			return "type";
		}
		
		if (type === "#include") {
			return "include";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string_literal", "\""].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
			return "number";
		}
		
		if (type[0].match(wordRe)) {
			return "keyword";
		}
		
		return "symbol";
	},
	
	getSupportLevel(code, path) {
		if (!path) {
			return null; //
		}
		
		let type = platform.fs(path).lastType;
		
		if ([
			"cpp",
			"cxx",
			"cc",
		].includes(type)) {
			return "general";
		}
		
		if (type === "vala") {
			return "alternate";
		}
		
		return null;
	},
};

export default lang;
