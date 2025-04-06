import {Hiliter} from "modules/hiliter";

let wordRe = /\w/;

export default class extends Hiliter {
	group = "ruby";
	name = "Ruby";
	defaultExtension = "rb";
	injections = [];
	
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
			"constant",
			"simple_symbol",
			"hash_key_symbol",
			"class_variable",
		].includes(type)) {
			return "id";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		if (["string"].includes(type)) {
			return "string";
		}
		
		if (type === "integer" || type === "float") {
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
			"rb",
			"erb",
		].includes(type)) {
			return "general";
		}
		
		return null;
	}
}
