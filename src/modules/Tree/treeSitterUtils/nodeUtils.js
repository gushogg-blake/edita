let nodeGetters = require("./nodeGetters");

let api = {
	...nodeGetters,
	
	compareCharCursor(node, cursor) {
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
	},
	
	isAfter(node, cursor) {
		return api.compareCharCursor(node, cursor) === "cursorBeforeNode";
	},
	
	endsAfter(node, cursor) {
		let {row, column} = nodeGetters.endPosition(node);
		
		return row > cursor.lineIndex || row === cursor.lineIndex && column > cursor.offset;
	},
	
	isOnOrAfter(node, cursor) {
		let {row, column} = nodeGetters.startPosition(node);
		
		return row === cursor.lineIndex && column === cursor.offset || api.compareCharCursor(node, cursor) === "cursorBeforeNode";
	},
};

module.exports = api;
