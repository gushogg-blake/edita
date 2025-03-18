import middle from "utils/middle";
import Selection, {s} from "modules/core/Selection";
import LineRowRenderer from "./LineRowRenderer";

function findFirstVisibleSelectionIndex(visibleSelection, selections) {
	let startIndex = 0;
	let endIndex = selections.length;
	let first = null;
	
	while (true) {
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

export default class extends LineRowRenderer {
	constructor(renderer, selections, canvasRenderer) {
		super(renderer);
		
		this.selections = selections;
		this.canvasRenderer = canvasRenderer;
		
		this.selectionIndex = null;
		this.inSelection = false;
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
		let i = 0;
		
		while (this.variableWidthPart) {
			this.step();
			
			if (++i === 1000) {
				console.log("infinite");
			}
			
			if (i === 1010) {
				break;
			}
		}
	}
}
