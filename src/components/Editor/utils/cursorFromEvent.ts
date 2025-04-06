/*
get insert cursor from mouse event (the cursor either side of the clicked
char, depending on position within the char)
*/

export function getCursor(e, view, canvasDiv) {
	let {
		x: left,
		y: top,
	} = canvasDiv.getBoundingClientRect();
	
	let x = e.clientX - left;
	let y = e.clientY - top;
	
	let [row, col] = view.canvasUtils.cursorRowColFromScreenCoords(x, y);
	
	return view.canvasUtils.cursorFromRowCol(row, col);
}

/*
get char cursor (the cursor before the clicked char)
*/

export function getCharCursor(e, view, canvasDiv) {
	let {
		x: left,
		y: top,
	} = canvasDiv.getBoundingClientRect();
	
	let x = e.clientX - left;
	let y = e.clientY - top;
	
	let [row, col] = view.canvasUtils.rowColFromScreenCoords(x, y);
	
	return view.canvasUtils.cursorFromRowCol(row, col, true);
}
