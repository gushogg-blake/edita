//let images = {
//	insert: "./img/insert.png",
//	expand: "./img/expand.png",
//};
//
//for (let [name, src] of Object.entries(images)) {
//	images[name] = new Image();
//	images[name].src = src;
//}

let lineWidth = 2;
let lineLength = 35;

module.exports = function(layers, view, isPeeking) {
	let {
		wrappedLines,
		astInsertionHilite: hilite,
		measurements,
		document: {
			fileDetails,
		},
	} = view;
	
	if (!hilite) {
		return;
	}
	
	let context = layers.hilites;
	
	context.fillStyle = platform.prefs.astInsertionHiliteBackground;
	
	let {colWidth, rowHeight} = measurements;
	let {startLineIndex, endLineIndex} = hilite;
	
	if (startLineIndex === wrappedLines.length) {
		let startRow = view.getLineStartingRow(startLineIndex - 1) + 1;
		
		let [x, y] = view.screenCoordsFromRowCol(startRow, 0);
		
		context.fillRect(x, y, lineLength, lineWidth);
		
		return;
	}
	
	let startLine = wrappedLines[startLineIndex].line;
	let lineAbove = startLineIndex === 0 ? null : wrappedLines[startLineIndex - 1].line;
	let startRow = view.getLineStartingRow(startLineIndex);
	let height = (view.getLineRangeTotalHeight(startLineIndex, endLineIndex)) * rowHeight;
	let indentLevel = lineAbove ? Math.max(startLine.indentLevel, lineAbove.indentLevel) : startLine.indentLevel;
	
	let [x, y] = view.screenCoordsFromRowCol(startRow, indentLevel * fileDetails.indentation.colsPerIndent);
	
	if (height === 0) {
		context.fillRect(x, y, lineLength, lineWidth);
	} else {
		let middle = y + Math.round(height / 2) - Math.round(lineWidth / 2);
		
		context.fillRect(x, middle, lineLength, lineWidth);
		
		context.save();
		
		context.translate(x + lineLength / 2, y + lineWidth / 2);
		context.rotate(45 * Math.PI / 180);
		context.fillRect(1, 2, 9, 9);
		
		context.restore();
	}
}
