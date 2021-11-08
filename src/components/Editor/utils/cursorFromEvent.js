/*
get insert cursor from mouse event (the cursor either side of the clicked
char, depending on position within the char)
*/

function getCursor(e, view, canvasDiv) {
	let {
		x: left,
		y: top,
	} = canvasDiv.getBoundingClientRect();
	
	let x = e.clientX - left;
	let y = e.clientY - top;
	
	let [row, col] = view.cursorRowColFromScreenCoords(x, y);
	
	return view.cursorFromRowCol(row, col);
}

/*
get char cursor (the cursor before the clicked char)
*/

function getCharCursor(e, view, canvasDiv) {
	let {
		x: left,
		y: top,
	} = canvasDiv.getBoundingClientRect();
	
	let x = e.clientX - left;
	let y = e.clientY - top;
	
	let [row, col] = view.rowColFromScreenCoords(x, y);
	
	return view.cursorFromRowCol(row, col, true);
}

module.exports = {
	getCursor,
	getCharCursor,
};
