import {Evented} from "utils";
import {type Selection, s, c} from "core";
import type {View} from "ui/editor/view";

export default class NormalSelections extends Evented<{
	
}> {
	normalSelection: Selection = s(c(0, 0));
	
	// for remembering the intended col when moving a cursor up/down to a line
	// that doesn't have as many cols as the cursor
	selectionEndCol: number = 0;
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	setNormalSelection(selection: Selection) {
		this.normalSelections.setNormalSelection(this.validate(selection));
		
		this.needToUpdateAstSelection = true;
		
		// TODO validate for folds
		
		this.scheduleRedraw();
	}
	
	validate(selection: Selection): Selection {
		let {lines} = this.document;
		let {start, end} = selection;
		let {lineIndex: startLineIndex, offset: startOffset} = start;
		let {lineIndex: endLineIndex, offset: endOffset} = end;
		
		startLineIndex = Math.min(startLineIndex, lines.length - 1);
		startOffset = Math.min(startOffset, lines[startLineIndex].string.length);
		endLineIndex = Math.min(endLineIndex, lines.length - 1);
		endOffset = Math.min(endOffset, lines[endLineIndex].string.length);
		
		return s(c(startLineIndex, startOffset), c(endLineIndex, endOffset));
	}
	
	fromAstSelection(astSelection: AstSelection): AstSelection {
		let {lines} = this.document;
		
		let endLineIndex = Math.max(astSelection.startLineIndex, astSelection.endLineIndex - 1);
		
		return s(c(astSelection.startLineIndex, 0), c(endLineIndex, lines[endLineIndex].string.length));
	}
	
	
}
