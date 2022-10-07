let nodeGetters = require("./nodeGetters");

function compareNodeAndCharCursor(node, cursor) {
	let {lineIndex, offset} = cursor;
	let start = nodeGetters.startPosition(node);
	let end = nodeGetters.endPosition(node);
	
	if (lineIndex < start.row || lineIndex === start.row && offset < start.column) {
		return "cursorBeforeNode";
	}
	
	if (lineIndex > end.row || lineIndex === end.row && offset >= end.column) {
		return "cursorAfterNode";
	}
	
	return "nodeContainsCursor";
}

module.exports = compareNodeAndCharCursor;
