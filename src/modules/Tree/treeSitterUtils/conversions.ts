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
			start,
			end,
		} = range;
		
		return {
			startIndex,
			endIndex,
			
			startPosition: {
				row: start.lineIndex,
				column: start.offset,
			},
			
			endPosition: {
				row: end.lineIndex,
				column: end.offset,
			},
		};
	},
};

export default api;
