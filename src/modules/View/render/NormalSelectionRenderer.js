let middle = require("utils/middle");
let Selection = require("modules/utils/Selection");
let LineRowRenderer = require("./LineRowRenderer");

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
		
		if (Selection.isOverlapping(visibleSelection, selection)) {
			first = index;
			endIndex = index;
		} else if (Selection.isBefore(selection, visibleSelection)) {
			startIndex = index + 1;
		} else {
			endIndex = index;
		}
	}
	
	return first;
}

module.exports = class extends LineRowRenderer {
	constructor(renderer, selections, canvasRenderer) {
		super(renderer);
		
		this.selections = selections;
		this.canvasRenderer = canvasRenderer;
		
		this.selectionIndex = null;
	}
	
	get selection() {
		return this.selectionIndex !== null ? this.selections[this.selectionIndex] : null;
	}
	
	get inSelection() {
		return this.selection && Selection.charIsWithinSelection(this.selection, this.cursor);
	}
	
	get nextSelectionStartCursor() {
		return this.selectionIndex !== null && this.selections[this.selectionIndex + 1]?.start;
	}
	
	init() {
		this.selectionIndex = findFirstVisibleSelectionIndex(this.renderer.visibleSelection, this.selections);
		
		if (this.inSelection) {
			this.canvasRenderer.enterSelection();
		}
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
		return this._offsetOrInfinity(this.selection?.start);
	}
	
	getCurrentSelectionEnd() {
		return this._offsetOrInfinity(this.selection?.end);
	}
	
	getNextSelectionStart() {
		return this._offsetOrInfinity(this.nextSelectionStartCursor);
	}
	
	step() {
		let done = false;
		
		if (this.variableWidthPart) {
			if (this.variableWidthPart.type === "string") {
				let currentSelectionStart = this.getCurrentSelectionStart();
				let currentSelectionEnd = this.getCurrentSelectionEnd();
				let nextSelectionStart = this.getNextSelectionStart();
				let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
				
				let renderTo = Math.min(
					currentSelectionStart,
					currentSelectionEnd,
					nextSelectionStart,
					partEnd,
				);
				
				let length = renderTo - this.offset;
				
				this.canvasRenderer.advance(length);
				
				this.offset += length;
				
				if (renderTo === partEnd) {
					this.nextVariableWidthPart();
				}
			} else {
				this.canvasRenderer.advance(this.variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
			}
		} else {
			done = true;
		}
		
		if (this.atSelectionEnd()) {
			this.canvasRenderer.leaveSelection();
			
			this.nextSelection();
		}
		
		if (this.atSelectionStart()) {
			this.canvasRenderer.enterSelection();
		}
		
		return done;
	}
	
	renderRow() {
		let i = 0;
		
		while (!this.step()) {
			if (++i === 1000) {
				console.log("infinite");
			}
			
			if (i === 1010) {
				break;
			}
		}
	}
}
