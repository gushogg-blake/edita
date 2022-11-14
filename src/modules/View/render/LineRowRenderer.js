let Cursor = require("modules/utils/Cursor");

let {c} = Cursor;

function *generateVariableWidthParts(lineRow) {
	let offset = lineRow.startOffset;
	
	for (let part of lineRow.variableWidthParts) {
		yield {...part, offset};
		
		offset += part.type === "tab" ? 1 : part.string.length;
	}
}

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
	
	get isLastRow() {
		return this.rowIndexInLine === this.foldedLineRow.wrappedLine.lineRows.length - 1;
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
		return cursor && Cursor.equals(this.cursor, cursor);
	}
	
	_offsetOrInfinity(cursor) {
		return cursor?.lineIndex === this.lineIndex ? cursor.offset : Infinity;
	}
	
	startRow(row) {
		this.foldedLineRow = row;
		
		this.variableWidthPartGenerator = generateVariableWidthParts(this.lineRow);
		this.nextVariableWidthPart();
		
		this.offset = this.lineRow.startOffset;
		
		if (this.canvasRenderer.startRow) {
			this.canvasRenderer.startRow(this.rowIndexInLine === 0 ? 0 : this.line.indentCols);
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
