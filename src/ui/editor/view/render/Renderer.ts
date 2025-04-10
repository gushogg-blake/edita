import {s, c} from "core";
import type {Document, Selection} from "core";

import type {View, Canvas, UiState, FoldedLineRow} from "ui/editor/view";

import CurrentLineHiliteRenderer from "./CurrentLineHiliteRenderer";
import NormalSelectionRenderer from "./NormalSelectionRenderer";
import AstSelectionRenderer from "./AstSelectionRenderer";
import AstInsertionHiliteRenderer from "./AstInsertionHiliteRenderer";
import MarginRenderer from "./MarginRenderer";
import FoldHiliteRenderer from "./FoldHiliteRenderer";
import CodeRenderer from "./CodeRenderer";
import NormalCursorRenderer from "./NormalCursorRenderer";

/*
LIFECYCLE per-render

code renderers have to be created per-render anyway, and keeping
instances around risks having stale state from previous renders,
so it's probably best to keep it like this. I am fairly sure from
looking at a bunch of profiles that this isn't a performance concern.
*/

export default class Renderer {
	view: View;
	document: Document;
	canvas: Canvas;
	uiState: UiState;
	
	private visibleSelection: Selection;
	private foldedLineRows: FoldedLineRow[];
	private firstRow: FoldedLineRow;
	private lastRow: FoldedLineRow;
	
	constructor(view: View, canvas: Canvas, uiState: UiState) {
		this.view = view;
		this.document = view.document;
		this.canvas = canvas;
		this.uiState = uiState;
	}
	
	render(): void {
		this.init();
		
		let renderers = this.createRenderers();
		
		let {lines} = this.view;
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
				
				renderer.renderBetweenLines(lastRow.viewLine.line, lineBelow, 0, lastRow.wrappedLine.lineRows.length - 1 - lastRow.rowIndexInLine);
			}
			
			renderer.flush();
		}
	}
	
	private getVisibleScopes() {
		return this.document.getVisibleScopes(this.visibleSelection);
	}
	
	private init() {
		this.foldedLineRows = this.getFoldedLineRowsToRender();
		
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
		
		let {windowHasFocus, isPeekingAstMode} = this.uiState;
		
		let normal = mode === "normal";
		let ast = mode === "ast";
		
		let renderNormalCursor = normal && cursorBlinkOn && focused && !insertCursor && windowHasFocus;
		let renderInsertCursor = normal && insertCursor;
		let renderNormalSelection = normal && normalSelection.isFull();
		let renderAstSelectionHilite = ast && astSelectionHilite && (isPeekingAstMode || !astSelection.equals(astSelectionHilite));
		let renderAstInsertionHilite = ast && astInsertionHilite;
		
		let {renderers: canvasRenderers} = this.canvas;
		
		return [
			normal && new CurrentLineHiliteRenderer(this),
			new NormalSelectionRenderer(this, normalHilites, canvasRenderers.normalHilites),
			renderNormalSelection && new NormalSelectionRenderer(this, [normalSelection.sort()], canvasRenderers.normalSelection),
			
			ast && new AstSelectionRenderer(this, astSelection, canvasRenderers.astSelection),
			renderAstSelectionHilite && new AstSelectionRenderer(this, astSelectionHilite, canvasRenderers.astSelectionHilite),
			renderAstInsertionHilite && new AstInsertionHiliteRenderer(this),
			
			new FoldHiliteRenderer(this),
			new MarginRenderer(this),
			
			...this.getVisibleScopes().map((visibleScope) => {
				return new CodeRenderer(this, visibleScope);
			}),
			
			renderNormalCursor && new NormalCursorRenderer(this, normalSelection.end),
			renderInsertCursor && new NormalCursorRenderer(this, insertCursor),
		].filter(Boolean);
	}
	
	private getFoldedLineRowsToRender() {
		let {sizes, measurements} = this.view;
		let foldedLineRows = [];
		let rowsToRender = Math.ceil(sizes.height / measurements.rowHeight) + 1;
		
		let {
			lineIndex: firstLineIndex,
			rowIndexInLine: firstLineRowIndex,
		} = this.view.canvasUtils.findFirstVisibleLine();
		
		let foldedLineRowGenerator = this.view.canvasUtils.generateLineRowsFolded(firstLineIndex);
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
