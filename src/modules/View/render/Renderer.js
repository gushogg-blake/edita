let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");

let CurrentLineHiliteRenderer = require("./CurrentLineHiliteRenderer");
let NormalHiliteRenderer = require("./NormalHiliteRenderer");
let NormalSelectionRenderer = require("./NormalSelectionRenderer");
let AstSelectionRenderer = require("./AstSelectionRenderer");
let AstSelectionHiliteRenderer = require("./AstSelectionHiliteRenderer");
let AstInsertionHiliteRenderer = require("./AstInsertionHiliteRenderer");
let MarginRenderer = require("./MarginRenderer");
let FoldHiliteRenderer = require("./FoldHiliteRenderer");
let CodeRenderer = require("./CodeRenderer");
let NormalCursorRenderer = require("./NormalCursorRenderer");
let InsertCursorRenderer = require("./InsertCursorRenderer");

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
	constructor(view, canvasRenderers) {
		this.view = view;
		this.canvasRenderers = canvasRenderers;
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
		let {mode} = this.view;
		let normal = mode === "normal";
		let ast = mode === "ast";
		
		let renderers = [
			normal && new CurrentLineHiliteRenderer(this),
			new NormalHiliteRenderer(this),
			normal && new NormalSelectionRenderer(this),
			
			ast && new AstSelectionRenderer(this),
			ast && new AstSelectionHiliteRenderer(this),
			ast && new AstInsertionHiliteRenderer(this),
			
			new FoldHiliteRenderer(this),
			new MarginRenderer(this),
			
			...this.getVisibleScopes().map(({scope, ranges, injectionRanges}) => {
				return new CodeRenderer(this, scope, ranges, injectionRanges)
			}),
			
			normal && new NormalCursorRenderer(this),
			normal && new InsertCursorRenderer(this),
		].filter(Boolean);
		
		for (let renderer of renderers) {
			renderer.init(this.foldedLineRows[0]);
			
			for (let foldedLineRow of this.foldedLineRows) {
				renderer.startRow(foldedLineRow);
				
				renderer.renderRow();
				
				renderer.endRow();
			}
			
			renderer.flush();
		}
	}
}

module.exports = Renderer;
