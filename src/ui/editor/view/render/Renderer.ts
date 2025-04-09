import {s, c} from "core";
import type {Document} from "core";

import type {View, Canvas, UiState} from "ui/edior/view";

import CurrentLineHiliteRenderer from "./CurrentLineHiliteRenderer";
import NormalSelectionRenderer from "./NormalSelectionRenderer";
import AstSelectionRenderer from "./AstSelectionRenderer";
import AstInsertionHiliteRenderer from "./AstInsertionHiliteRenderer";
import MarginRenderer from "./MarginRenderer";
import FoldHiliteRenderer from "./FoldHiliteRenderer";
import CodeRenderer from "./CodeRenderer";
import NormalCursorRenderer from "./NormalCursorRenderer";

/*
**WIP**

making this long-lived -- Renderer lifecycle will be just one for
a view.

individual renderers will be created dynamically as some won't be
needed -- this is in contrast to the canvas side, where all renderers
except code renderers can also be long lived
*/

export default class Renderer {
	view: View;
	canvas: Canvas;
	uiState: UiState;
	document: Document;
	
	constructor(view: View, canvas: Canvas) {
		this.view = view;
		this.canvas = canvas;
		this.document = view.document;
	}
	
	getVisibleScopes() {
		return this.document.getVisibleScopes(this.visibleSelection);
	}
	
	init() {
		this.foldedLineRows = this.getFoldedLineRowsToRender(view);
		
		let firstRow = this.foldedLineRows[0];
		let lastRow = this.foldedLineRows.at(-1);
		
		this.visibleSelection = s(
			c(firstRow.lineIndex, firstRow.lineRow.startOffset),
			c(lastRow.lineIndex, lastRow.lineRow.startOffset + lastRow.lineRow.string.length),
		);
		
		this.firstRow = firstRow;
		this.lastRow = lastRow;
	}
	
	private createRenderers() {
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
			new NormalSelectionRenderer(this, normalHilites, this.canvas.normalHilites),
			renderNormalSelection && new NormalSelectionRenderer(this, [normalSelection.sort()], this.canvas.normalSelection),
			
			ast && new AstSelectionRenderer(this, astSelection, this.canvas.astSelection),
			renderAstSelectionHilite && new AstSelectionRenderer(this, astSelectionHilite, this.canvas.astSelectionHilite),
			renderAstInsertionHilite && new AstInsertionHiliteRenderer(this),
			
			new FoldHiliteRenderer(this),
			new MarginRenderer(this),
			
			...this.getVisibleScopes().map(({scope, ranges, injectionRanges}) => {
				return new CodeRenderer(this, scope, ranges, injectionRanges)
			}),
			
			renderNormalCursor && new NormalCursorRenderer(this, normalSelection.end),
			renderInsertCursor && new NormalCursorRenderer(this, insertCursor),
		].filter(Boolean);
	}
	
	render(uiState: UiState): void {
		this.init();
		
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
		
		let renderers = this.createRenderers();
		
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
	
	private getFoldedLineRowsToRender() {
		let {sizes, measurements} = this.view;
		let foldedLineRows = [];
		let rowsToRender = Math.ceil(sizes.height / measurements.rowHeight) + 1;
		
		let {
			lineIndex: firstLineIndex,
			rowIndexInLine: firstLineRowIndex,
		} = view.canvasUtils.findFirstVisibleLine();
		
		let foldedLineRowGenerator = view.canvasUtils.generateLineRowsFolded(firstLineIndex);
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
}
