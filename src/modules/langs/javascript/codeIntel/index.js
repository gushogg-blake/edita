module.exports = {
	shouldIndentOnNewline(line, lines, lineIndex, cursor) {
		return line.string.substr(0, cursor.offset).match(/[\[{(]$/);
	},
	
	indentAdjustmentAfterInsertion(line, lines, lineIndex) {
		let firstNode = line.nodes[line.nodes.length - 1];
		
		if (!firstNode || !firstNode.type.match(/[\]})]/)) {
			return 0;
		}
		
		let headerIndentLevel = lines[firstNode.parent.startPosition.row].indentLevel;
		
		return headerIndentLevel - line.indentLevel;
	},
	
	async isProjectRoot(dir) {
		return (await platform.fs(dir).readdir()).includes("package.json");
	},
};
