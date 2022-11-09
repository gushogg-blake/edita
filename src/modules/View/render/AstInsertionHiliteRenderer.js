let LineRowRenderer = require("./LineRowRenderer");

/*
if (!hilite) {
	return;
}

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
*/

module.exports = class extends LineRowRenderer {
	constructor(renderer) {
		super(renderer);
		
		this.canvasRenderer = renderer.canvas.astInsertionHilite;
	}
	
	renderRow() {
		
	}
}
