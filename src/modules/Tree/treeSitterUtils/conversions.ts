import Cursor, {c} from "modules/Cursor";

export function treeSitterPointToCursor(point) {
	return c(point.row, point.column);
}

export function cursorToTreeSitterPoint(cursor) {
	return {
		row: cursor.lineIndex,
		column: cursor.offset,
	};
}

export function rangeToTreeSitterRange(range) {
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
}
