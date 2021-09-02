module.exports = function(cursor) {
	return {
		row: cursor.lineIndex,
		column: cursor.offset,
	};
}
