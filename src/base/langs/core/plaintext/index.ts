import {Lang} from "core";

export default class extends Lang {
	name = "Plain text";
	
	commentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		let minIndentLevel = Math.min(...lines.map(line => line.indentLevel));
		let minIndent = document.format.indentation.string.repeat(minIndentLevel);
		
		return lines.map(function(line) {
			return line.string.replace(new RegExp("^" + minIndent), minIndent + "#");
		}).join(document.format.newline);
	}
	
	uncommentLines(document, startLineIndex, endLineIndex) {
		let lines = document.lines.slice(startLineIndex, endLineIndex);
		
		return lines.map(function(line) {
			return line.string.replace(/^(\s*)#?/, "$1");
		}).join(document.format.newline);
	}
	
	getSupportLevel(code, path) {
		// NOTE this will never be used due to the logic
		// (plaintext is hardcoded as the fallback)
		// just including for type check
		return "alternate";
	}
}
