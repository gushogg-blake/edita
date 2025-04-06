import {Hiliter} from "modules/hiliter";

export default class extends Hiliter {
	getHiliteClass(node) {
		let {type, parent} = node;
		
		if ([
			"string_value",
			"integer_value",
			"float_value",
		].includes(parent?.type)) { //
			return null;
		}
		
		if (type === "tag_name") {
			return "tagName";
		}
		
		if (type === "class_name") {
			return "className";
		}
		
		if (type === "id_name" || type === "#" && parent?.type === "id_selector") {
			return "idName";
		}
		
		if (type === "property_name") {
			return "property";
		}
		
		if (type === "string_value") {
			return "string";
		}
		
		if (type === "color_value") {
			return "color";
		}
		
		if (type === "float_value" || type === "integer_value") {
			return "number";
		}
		
		if (type === "plain_value") {
			return "text";
		}
		
		if (type === "comment" || type === "single_line_comment") {
			return "comment";
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
