let AstSelection = require("modules/utils/AstSelection");

module.exports = function(layers, view, isPeeking) {
	let {
		wrappedLines,
		astSelectionHilite: hilite,
		astSelection: selection,
		document,
		sizes: {
			width,
		},
		measurements: {
			rowHeight,
		},
	} = view;
	
	if (!hilite) {
		return;
	}
	
	if (!isPeeking && AstSelection.equals(hilite, selection)) {
		return;
	}
	
	let context = layers.hilites;
	
	context.fillStyle = platform.prefs.astSelectionHiliteBackground;
	
	let {startLineIndex, endLineIndex} = hilite;
	let startLine = wrappedLines[startLineIndex].line;
	let startRow = view.getLineStartingRow(startLineIndex);
	let height = (view.getLineRangeTotalHeight(startLineIndex, endLineIndex - 1)) * rowHeight;
	
	let [x, y] = view.screenCoordsFromRowCol(
		startRow,
		startLine.indentLevel * document.fileDetails.indentation.colsPerIndent,
	);
	
	x = Math.max(0, x);
	
	if (height === 0) {
		context.fillRect(0, y, width, 2);
	} else {
		context.fillRect(0, y, width, height);
	}
}
