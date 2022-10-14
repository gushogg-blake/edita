let generatorFromArray = require("utils/generatorFromArray");
let CodeRenderer = require("./CodeRenderer");

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
	
	renderMargin() {
		let {renderMargin} = this.canvas;
		
		for (let foldedLineRow of this.foldedLineRows) {
			renderMargin.drawLineNumber(foldedLineRow.lineIndex);
			renderFoldHilites.endRow();
		}
	}
	
	renderFoldHilites() {
		let {renderFoldHilites} = this.canvas;
		
		for (let foldedLineRow of this.foldedLineRows) {
			if (foldedLineRow.isFoldHeader) {
				let {line} = foldedLineRow;
				
				renderFoldHilites.drawHilite(line.indentCols, line.width - line.indentCols);
			}
			
			renderFoldHilites.endRow();
		}
	}
	
	render() {
		this.renderMargin();
		this.renderFoldHilites();
		
		let visibleRanges = 
	}
}

module.exports = Renderer;
