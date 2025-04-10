import middle from "utils/middle";
import {Selection, s} from "core";
import type {NormalSelectionCanvasRenderer} from "ui/editor/view";
import LineRowRenderer from "./LineRowRenderer";
import type Renderer from "./Renderer";

export default class extends LineRowRenderer {
	private selections: Selection[];
	private selectionIndex?: number = null;
	private inSelection: boolean = false;
	
	declare protected canvasRenderer: NormalSelectionCanvasRenderer;
	
	constructor(renderer: Renderer, selections: Selection[], canvasRenderer: NormalSelectionCanvasRenderer) {
		super(renderer);
		
		this.selections = selections;
		this.canvasRenderer = canvasRenderer;
	}
	
	get selection() {
		return this.selectionIndex !== null ? this.selections[this.selectionIndex] : null;
	}
	
	get nextSelectionStartCursor() {
		return this.selectionIndex !== null && this.selections[this.selectionIndex + 1]?.start;
	}
	
	init(row) {
		super.init(row);
		
		this.selectionIndex = findFirstVisibleSelectionIndex(this.renderer.visibleSelection, this.selections);
		this.inSelection = this.selection?.containsCharCursor(this.cursor);
		
		if (this.inSelection) {
			this.canvasRenderer.enterSelection();
		}
	}
	
	endRow() {
		this.canvasRenderer.endRow(this.isLastRow);
	}
	
	nextSelection() {
		this.selectionIndex++;
	}
	
	atSelectionStart() {
		return this.atCursor(this.selection?.start);
	}
	
	atSelectionEnd() {
		return this.atCursor(this.selection?.end);
	}
	
	getCurrentSelectionStart() {
		return this._offsetOrInfinity(!this.inSelection && this.selection?.start);
	}
	
	getCurrentSelectionEnd() {
		return this._offsetOrInfinity(this.inSelection && this.selection.end);
	}
	
	getNextSelectionStart() {
		return this._offsetOrInfinity(this.nextSelectionStartCursor);
	}
	
	step() {
		let {variableWidthPart} = this;
		let currentSelectionStart = this.getCurrentSelectionStart();
		let currentSelectionEnd = this.getCurrentSelectionEnd();
		let nextSelectionStart = this.getNextSelectionStart();
		let partEnd = variableWidthPart.offset + variableWidthPart.string.length;
		
		let renderTo = Math.min(
			currentSelectionStart,
			currentSelectionEnd,
			nextSelectionStart,
			partEnd,
		);
		
		let length = renderTo - this.offset;
		
		if (variableWidthPart.type === "string") {
			this.canvasRenderer.advance(length);
			
			this.offset += length;
			
			if (renderTo === partEnd) {
				this.nextVariableWidthPart();
			}
		} else {
			if (length === 1) {
				this.canvasRenderer.advance(variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
			}
		}
		
		if (this.atSelectionStart()) {
			this.inSelection = true;
			
			this.canvasRenderer.enterSelection();
		}
		
		if (this.inSelection && this.atSelectionEnd()) {
			this.inSelection = false;
			
			this.canvasRenderer.leaveSelection();
			
			this.nextSelection();
		}
	}
	
	renderRow() {
		while (this.variableWidthPart && `spincheck=${100000}`) {
			this.step();
		}
	}
}

function findFirstVisibleSelectionIndex(
	visibleSelection: Selection,
	selections: Selection[],
): number | null {
	let startIndex = 0;
	let endIndex = selections.length;
	let first = null;
	
	while (`spincheck=${100}`) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let selection = selections[index];
		
		if (selection.overlaps(visibleSelection)) {
			first = index;
			endIndex = index;
		} else if (selection.isBefore(visibleSelection)) {
			startIndex = index + 1;
		} else {
			endIndex = index;
		}
	}
	
	return first;
}
