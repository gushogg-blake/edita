module.exports = function(
	lines,
	row,
	col,
	scrollPosition,
	measurements,
) {
	let {
		rowHeight,
		colWidth,
	} = measurements;
	
	let x = col * colWidth - scrollPosition.x;
	let y = (row - scrollPosition.row) * rowHeight;
	
	return [x, y];
}
