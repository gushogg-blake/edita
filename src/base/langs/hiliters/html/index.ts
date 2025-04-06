import {Hiliter} from "modules/hiliter";

export default class extends Hiliter {
	getHiliteClass(node) {
		let {
			type,
			parent,
		} = node;
		
		if ([
			"quoted_attribute_value",
			"doctype",
		].includes(parent?.type)) {
			return null;
		}
		
		if ([
			"<",
			">",
			"/>",
			"</",
			"tag_name",
		].includes(type)) {
			return "tag";
		}
		
		if (type === "attribute_name") {
			return "attribute";
		}
		
		if (type === "quoted_attribute_value") {
			return "string";
		}
		
		if (type === "comment") {
			return "comment";
		}
		
		return "text";
	}
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "<!--") + "-->";
		}).join(document.format.newline);
	}
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)(<!--)?/, "$1").replace(/-->$/, "");
		}).join(document.format.newline);
	}
}
