let generatorFromArray = require("utils/generatorFromArray");
let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");
let FoldHiliteRenderer = require("./FoldHiliteRenderer");
let MarginRenderer = require("./MarginRenderer");
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
		//this.view = view;
		this.canvas = canvas;
		this.document = view.document;
		this.foldedLineRows = getFoldedLineRowsToRender(view);
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
		
		let renderers = [
			new FoldHiliteRenderer(this),
			new MarginRenderer(this),
		];
		
		for (let {scope, ranges, injectionRanges} of this.getVisibleScopes()) {
			renderers.push(new CodeRenderer(this, scope, ranges, injectionRanges));
		}
		
		for (let renderer of renderers) {
			renderer.init(this.foldedLineRows[0]);
			
			for (let foldedLineRow of this.foldedLineRows) {
				renderer.startRow(foldedLineRow);
				
				renderer.renderRow();
				
				renderer.endRow();
			}
		}
	}
}

module.exports = Renderer;
