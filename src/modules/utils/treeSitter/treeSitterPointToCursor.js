module.exports = function(point) {
	return {
		lineIndex: point.row,
		offset: point.column,
	};
}
