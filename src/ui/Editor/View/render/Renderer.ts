import {Selection, s, AstSelection, a, Cursor, c} from "core";

import type View from "ui/Editor/View";

import CurrentLineHiliteRenderer from "./CurrentLineHiliteRenderer";
import NormalSelectionRenderer from "./NormalSelectionRenderer";
import AstSelectionRenderer from "./AstSelectionRenderer";
import AstInsertionHiliteRenderer from "./AstInsertionHiliteRenderer";
import MarginRenderer from "./MarginRenderer";
import FoldHiliteRenderer from "./FoldHiliteRenderer";
import CodeRenderer from "./CodeRenderer";
import NormalCursorRenderer from "./NormalCursorRenderer";

import type {CanvasRenderers} from "./types";

function getFoldedLineRowsToRender(view: View) {
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
	canvasRenderers: CanvasRenderers;
	
	constructor(view, canvasRenderers, uiState) {
		this.view = view;
		this.canvasRenderers = canvasRenderers;
		this.uiState = uiState;
		this.document = view.document;
		
		this.foldedLineRows = getFoldedLineRowsToRender(view);
		
		let firstRow = this.foldedLineRows[0];
		let lastRow = this.foldedLineRows.at(-1);
		
		this.visibleSelection = s(
			c(firstRow.lineIndex, firstRow.lineRow.startOffset),
			c(lastRow.lineIndex, lastRow.lineRow.startOffset + lastRow.lineRow.string.length),
		);
		
		this.firstRow = firstRow;
		this.lastRow = lastRow;
	}
	
	getVisibleScopes() {
		return this.document.getVisibleScopes(this.visibleSelection);
	}
	
	render() {
		let {
			mode,
			insertCursor,
			normalSelection,
			normalHilites,
			cursorBlinkOn,
			astSelection,
			astSelectionHilite,
			astInsertionHilite,
			focused,
		} = this.view;
		
		let {lines} = this.document;
		
		let {windowHasFocus, isPeekingAstMode} = this.uiState;
		
		let normal = mode === "normal";
		let ast = mode === "ast";
		
		let renderNormalCursor = normal && cursorBlinkOn && focused && !insertCursor && windowHasFocus;
		let renderInsertCursor = normal && insertCursor;
		let renderNormalSelection = normal && normalSelection.isFull();
		let renderAstSelectionHilite = ast && astSelectionHilite && (isPeekingAstMode || !astSelection.equals(astSelectionHilite));
		let renderAstInsertionHilite = ast && astInsertionHilite;
		
		let renderers = [
			normal && new CurrentLineHiliteRenderer(this),
			new NormalSelectionRenderer(this, normalHilites, this.canvasRenderers.normalHilites),
			renderNormalSelection && new NormalSelectionRenderer(this, [normalSelection.sort()], this.canvasRenderers.normalSelection),
			
			ast && new AstSelectionRenderer(this, astSelection, this.canvasRenderers.astSelection),
			renderAstSelectionHilite && new AstSelectionRenderer(this, astSelectionHilite, this.canvasRenderers.astSelectionHilite),
			renderAstInsertionHilite && new AstInsertionHiliteRenderer(this),
			
			new FoldHiliteRenderer(this),
			new MarginRenderer(this),
			
			...this.getVisibleScopes().map(({scope, ranges, injectionRanges}) => {
				return new CodeRenderer(this, scope, ranges, injectionRanges)
			}),
			
			renderNormalCursor && new NormalCursorRenderer(this, normalSelection.end),
			renderInsertCursor && new NormalCursorRenderer(this, insertCursor),
		].filter(Boolean);
		
		let {firstRow, lastRow} = this;
		
		for (let renderer of renderers) {
			renderer.init(firstRow);
			
			let lineAbove = lines[firstRow.lineIndex - 1] || null;
			
			renderer.renderBetweenLines(lineAbove, firstRow.viewLine.line, firstRow.rowIndexInLine, 0);
			
			for (let foldedLineRow of this.foldedLineRows) {
				renderer.startRow(foldedLineRow);
				
				renderer.renderRow();
				
				renderer.endRow();
				
				if (foldedLineRow.rowIndexInLine === foldedLineRow.wrappedLine.lineRows.length - 1) {
					let lineBelow = lines[foldedLineRow.lineIndex + 1] || null;
					
					renderer.renderBetweenLines(foldedLineRow.viewLine.line, lineBelow, 0, 0);
				}
			}
			
			if (lastRow.rowIndexInLine !== lastRow.wrappedLine.lineRows.length - 1) {
				let lineBelow = lines[lastRow.lineIndex + 1] || null;
				
				renderer.renderBetweenLines(lastRow.line, lineBelow, 0, lastRow.wrappedLine.lineRows.length - 1 - lastRow.rowIndexInLine);
			}
			
			renderer.flush();
		}
	}
}

export default Renderer;
