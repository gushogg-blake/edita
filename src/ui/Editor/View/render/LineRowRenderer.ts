import generatorFromArray from "utils/generatorFromArray";
import Cursor, {c} from "core/Cursor";

export default class {
	constructor(renderer) {
		this.renderer = renderer;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.lastRenderedLineIndex = null;
	}
	
	get lineIndex() {
		return this.foldedLineRow.lineIndex;
	}
	
	get rowIndexInLine() {
		return this.foldedLineRow.rowIndexInLine;
	}
	
	get viewLine() {
		return this.foldedLineRow.viewLine;
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
		
		if (this.lastRenderedLineIndex !== null && this.lineIndex > this.lastRenderedLineIndex + 1) {
			this.resetAfterFold();
		}
		
		if (this.canvasRenderer.startRow) {
			this.canvasRenderer.startRow(this.isFirstRow ? 0 : this.viewLine.line.indentCols);
		}
	}
	
	endRow() {
		if (this.canvasRenderer.endRow) {
			this.canvasRenderer.endRow();
		}
		
		this.lastRenderedLineIndex = this.lineIndex;
	}
	
	resetAfterFold() {
		
	}
	
	renderRow() {
		
	}
	
	flush() {
		
	}
}
