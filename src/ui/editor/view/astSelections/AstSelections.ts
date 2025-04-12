import {Evented} from "utils";
import type {AstSelection} from "core";
import type {View} from "ui/editor/view";

export default class AstSelections extends Evented<{
	
}> {
	astSelection: AstSelection | null = null;
	
	// appears when you hover over an element
	astSelectionHilite: AstSelection | null = null;
	
	// appears to indicate where a dropped element will go
	astInsertionHilite: AstSelection | null = null;
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	static validate(astSelection: AstSelection): AstSelection {
		let {lines} = this.view.document;
		
		return a(Math.min(selection.startLineIndex, lines.length - 1), Math.min(selection.endLineIndex, lines.length));
	}
}
