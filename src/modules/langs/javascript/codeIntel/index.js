module.exports = {
	shouldIndentOnNewline(line, lines, lineIndex, cursor) {
		return line.string.substr(0, cursor.offset).match(/[\[{(]$/);
	},
	
	indentAdjustmentAfterInsertion(line, lines, lineIndex) {
		let lastNode = line.nodes[line.nodes.length - 1];
		
		if (!lastNode || !lastNode.type.match(/[\]})]/)) {
			return 0;
		}
		
		let headerIndentLevel = lines[lastNode.parent.startPosition.row].indentLevel;
		
		return headerIndentLevel - line.indentLevel;
	},
};
