let AstSelection = require("modules/utils/AstSelection");

module.exports = function(layers, view, isPeeking) {
	let {
		wrappedLines,
		astSelectionHilite: hilite,
		astSelection: selection,
		document,
		measurements,
	} = view;
	
	if (!hilite) {
		return;
	}
	
	if (!isPeeking && AstSelection.equals(hilite, selection)) {
		return;
	}
	
	let context = layers.hilites;
	
	context.fillStyle = base.prefs.astSelectionHiliteBackground;
	
	let {colWidth, rowHeight} = measurements;
	let {startLineIndex, endLineIndex} = hilite;
	let startLine = wrappedLines[startLineIndex].line;
	let startRow = view.getLineStartingRow(startLineIndex);
	let height = (view.getLineRangeTotalHeight(startLineIndex, endLineIndex - 1)) * rowHeight;
	
	let [x, y] = view.screenCoordsFromRowCol(
		startRow,
		startLine.indentLevel * document.fileDetails.indentation.colsPerIndent,
	);
	
	if (height === 0) {
		context.fillRect(x, y, context.canvas.width, 2);
	} else {
		context.fillRect(x, y, context.canvas.width, height);
	}
}
