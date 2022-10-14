let generatorFromArray = require("utils/generatorFromArray");

function getFoldedLineRowsToRender(view) {
	let {sizes, measurements} = view;
	let foldedLineRows = [];
	let rowsToRender = Math.ceil(sizes.height / measurements.rowHeight) + 1;
	
	let {
		lineIndex: firstLineIndex,
		rowIndexInLine: firstLineRowIndex,
	} = view.findFirstVisibleLine();
	
	let foldedLineRowGenerator = view.generateLineRowsFolded(firstLineIndex);
	let foldedLineRow = foldedLineRowGenerator.next().value;
	
	while (foldedLineRow?.rowIndexInLine < firstLineRowIndex) {
		foldedLineRow = foldedLineRowGenerator.next().value;
	}
	
	while (foldedLineRow && foldedLineRows.length < rowsToRender) {
		foldedLineRows.push(foldedLineRow);
		
		foldedLineRow = foldedLineRowGenerator.next().value;
	}
	
	return foldedLineRows;
}

/*
if (this.foldedLineRow.isFoldHeader) {
	this.renderFoldHilites.drawHilite(this.line.indentCols, this.line.width - this.line.indentCols);
}

if (this.rowIndexInLine === 0) {
	this.renderMargin.drawLineNumber(this.lineIndex);
}
*/

class Renderer {
	constructor(view, canvas) {
		this.view = view;
		this.canvas = canvas;
		this.document = view.document;
		this.foldedLineRows = getFoldedLineRowsToRender(view);
	}
	
	generateFoldedLineRows() {
		return generatorFromArray(this.foldedLineRows);
	}
	
	renderMargin(view, canvas) {
		
	}
	
	renderFoldHilites(view, canvas) {
		
	}
	
	render() {
		this.renderMargin();
		this.renderFoldHilites();
		
		
	}
}

module.exports = Renderer;
