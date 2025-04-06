import {CodeIntel} from "modules/codeIntel";

export default class extends CodeIntel {
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
	
	indentOnNewline(document, line, cursor) {
		return line.string.substr(0, cursor.offset).match(/[\[{(]$/);
	}
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		let nodes = document.getNodesOnLine(cursor.lineIndex, this.lang);
		
		for (let node of nodes) {
			if (node.end.offset !== cursor.offset) {
				continue;
			}
			
			let header = this.lang.astIntel.getHeader(node);
			
			if (header) {
				let {indentLevel} = document.lines[header.start.lineIndex];
				
				if (indentLevel !== line.indentLevel) {
					return indentLevel - line.indentLevel;
				}
			}
		}
		
		return 0;
	}
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("package.json");
	}
}
