let Cursor = require("modules/Cursor");

let {c} = Cursor;

let api = {
	treeSitterPointToCursor(point) {
		return c(point.row, point.column);
	},
	
	cursorToTreeSitterPoint(cursor) {
		return {
			row: cursor.lineIndex,
			column: cursor.offset,
		};
	},
	
	rangeToTreeSitterRange(range) {
		let {
			startIndex,
			endIndex,
			selection,
		} = range;
		
		return {
			startIndex,
			endIndex,
			
			startPosition: {
				row: selection.start.lineIndex,
				column: selection.start.offset,
			},
			
			endPosition: {
				row: selection.end.lineIndex,
				column: selection.end.offset,
			},
		};
	},
};

module.exports = api;
