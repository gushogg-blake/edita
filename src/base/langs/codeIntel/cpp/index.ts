import {CodeIntel} from "modules/codeIntel";

export default class extends CodeIntel {
	indentOnNewline(document, line, cursor) {
		return line.string.substr(0, cursor.offset).match(/[\[{(]$/);
	}
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		let nodes = document.getNodesOnLine(cursor.lineIndex, lang);
		
		for (let node of nodes) {
			if (node.end.offset !== cursor.offset) {
				continue;
			}
			
			let header = lang.getHeader(node);
			
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
		return (await platform.fs(dir).readdir()).includes("Makefile");
	}
};
