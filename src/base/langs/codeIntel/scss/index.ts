export default {
	indentOnNewline(document, line, cursor) {
		return line.string.substr(0, cursor.offset).match(/[\[{(]$/);
	},
	
	indentAdjustmentAfterInsertion(document, line, cursor) {
		let nodes = document.getNodesOnLine(cursor.lineIndex);
		let lastNode = nodes.at(-1);
		
		if (!lastNode || !lastNode.type.match(/[\]})]/)) {
			return 0;
		}
		
		let headerIndentLevel = document.lines[lastNode.parent.start.lineIndex].indentLevel;
		
		return headerIndentLevel - line.indentLevel;
	},
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("package.json");
	},
};
