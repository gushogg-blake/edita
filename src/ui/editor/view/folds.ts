import {Evented} from "utils";
import type {View} from "ui/editor/view";

export type Folds = Record<string, number>;

export class Folding extends Evented<{
	
}> {
	// TYPE not clear what this is but it's a map of header line index to footer line index
	// might be better as a map, and possibly with explicit types for the numbers -- not
	// sure about that yet as a pattern, but would obvs extend to line numbers, offsets, etc
	// might be worth doing, as there is always gonna be ambiguity -- would allow us to
	// distinguish between line indexes and line positions (where a position can be
	// array.length, whereas an index can't)
	folds: Folds = {};
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	
	setFolds(folds): void {
		this.folds = folds;
		
		// TODO validate selection
		
		this.scheduleRedraw();
	}
	
	toggleFoldHeader(lineIndex: number): void {
		let {document} = this;
		let footerLineIndex = getFooterLineIndex(document, lineIndex);
		
		if (lineIndex in this.folds) {
			delete this.folds[lineIndex];
			
			return;
		}
		
		if (footerLineIndex === null) {
			return;
		}
		
		this.folds[lineIndex] = footerLineIndex + 1;
		
		this.scheduleRedraw();
	}
	
	adjustFoldsForEdit(edit: Edit): void {
		let {selection, newSelection} = edit;
		let origEndLineIndex = selection.end.lineIndex;
		let newEndLineIndex = newSelection.end.lineIndex;
		let diff = newEndLineIndex - origEndLineIndex;
		
		this.folds = mapArrayToObject(Object.entries(this.folds), function([lineIndex, foldTo]) {
			lineIndex = Number(lineIndex);
			
			if (lineIndex > origEndLineIndex) {
				lineIndex += diff;
				foldTo += diff;
			}
			
			return [lineIndex, foldTo];
		});
	}
	
}
