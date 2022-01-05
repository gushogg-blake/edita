module.exports = function(layers, view, isPeeking) {
	let {
		wrappedLines,
		astSelection,
		document,
		sizes: {
			width,
		},
		measurements: {
			rowHeight,
		},
	} = view;
	
	let context = layers.hilites;
	
	context.fillStyle = base.prefs.astSelectionBackground;
	
	let {startLineIndex, endLineIndex} = astSelection;
	let startLine = wrappedLines[startLineIndex].line;
	let startRow = view.getLineStartingRow(startLineIndex);
	let height = (view.getLineRangeTotalHeight(startLineIndex, endLineIndex)) * rowHeight;
	
	let [x, y] = view.screenCoordsFromRowCol(startRow, startLine.indentLevel * document.fileDetails.indentation.colsPerIndent);
	
	x = Math.max(0, x);
	
	if (height === 0) {
		context.fillRect(0, y, width, 2);
	} else {
		context.fillRect(0, y, width, height);
	}
}
