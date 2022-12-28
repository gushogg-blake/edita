let generatorFromArray = require("utils/generatorFromArray");
let Cursor = require("modules/Cursor");

let {c} = Cursor;

module.exports = class {
	constructor(renderer) {
		this.renderer = renderer;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
	}
	
	get lineIndex() {
		return this.foldedLineRow.lineIndex;
	}
	
	get rowIndexInLine() {
		return this.foldedLineRow.rowIndexInLine;
	}
	
	get line() {
		return this.foldedLineRow.line;
	}
	
	get lineRow() {
		return this.foldedLineRow.lineRow;
	}
	
	get lineRows() {
		return this.foldedLineRow.wrappedLine.lineRows;
	}
	
	get isLastRow() {
		return this.rowIndexInLine === this.lineRows.length - 1;
	}
	
	get isFirstRow() {
		return this.rowIndexInLine === 0;
	}
	
	get cursor() {
		return c(this.lineIndex, this.offset);
	}
	
	init(row) {
		if (this.canvasRenderer.init) {
			this.canvasRenderer.init();
		}
		
		this.startRow(row);
	}
	
	nextVariableWidthPart() {
		this.variableWidthPart = this.variableWidthPartGenerator.next().value;
	}
	
	atCursor(cursor) {
		return cursor?.equals(this.cursor);
	}
	
	_offsetOrInfinity(cursor) {
		return cursor?.lineIndex === this.lineIndex ? cursor.offset : Infinity;
	}
	
	renderBetweenLines(lineAbove, lineBelow, rowsAboveCurrent, rowsBelowCurrent) {
	}
	
	startRow(row) {
		this.foldedLineRow = row;
		
		this.variableWidthPartGenerator = generatorFromArray(this.lineRow.variableWidthParts);
		this.nextVariableWidthPart();
		
		this.offset = this.lineRow.startOffset;
		
		if (this.canvasRenderer.startRow) {
			this.canvasRenderer.startRow(this.isFirstRow ? 0 : this.line.indentCols);
		}
	}
	
	endRow() {
		if (this.canvasRenderer.endRow) {
			this.canvasRenderer.endRow();
		}
	}
	
	renderRow() {
		
	}
	
	flush() {
		
	}
}
