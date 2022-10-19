let generatorFromArray = require("utils/generatorFromArray");
let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");
let CodeRenderer = require("./CodeRenderer");

let {s} = Selection;
let {c} = Cursor;

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
		let {marginRenderer} = this.canvas;
		
		for (let foldedLineRow of this.foldedLineRows) {
			if (foldedLineRow.lineRow.startOffset === 0) {
				marginRenderer.drawLineNumber(foldedLineRow.lineIndex);
			}
			
			marginRenderer.endRow();
		}
	}
	
	renderFoldHilites() {
		let {foldHiliteRenderer} = this.canvas;
		
		for (let foldedLineRow of this.foldedLineRows) {
			if (foldedLineRow.isFoldHeader) {
				let {line} = foldedLineRow;
				
				foldHiliteRenderer.drawHilite(line.indentCols, line.width - line.indentCols);
			}
			
			foldHiliteRenderer.endRow();
		}
	}
	
	getVisibleScopes() {
		let firstRow = this.foldedLineRows[0];
		let lastRow = this.foldedLineRows[this.foldedLineRows.length - 1];
		
		return this.document.getVisibleScopes(s(
			c(firstRow.lineIndex, firstRow.lineRow.startOffset),
			c(lastRow.lineIndex, lastRow.lineRow.startOffset + lastRow.lineRow.string.length),
		));
	}
	
	render() {
		if (this.foldedLineRows.length === 0) {
			return;
		}
		
		this.renderMargin();
		this.renderFoldHilites();
		
		for (let {scope, ranges, injectionRanges} of this.getVisibleScopes()) {
			let codeRenderer = new CodeRenderer(this, scope, ranges, injectionRanges);
			
			codeRenderer.render();
		}
	}
}

module.exports = Renderer;
