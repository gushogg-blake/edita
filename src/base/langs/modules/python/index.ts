import astMode from "./astMode";
import codeIntel from "./codeIntel";

let wordRe = /\w/;

let lang = {
	code: "python",
	name: "Python",
	defaultExtension: "py",
	astMode,
	codeIntel,
	injections: [],
	
	isBlock(node) {
		return node.start.lineIndex !== node.end.lineIndex && [
			
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
			
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"identifier",
		].includes(type)) {
			return "id";
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
			"py",
		].includes(type)) {
			return "general";
		}
		
		return null;
	},
};

export default lang;
