import {Evented} from "utils";
import {Selection, s, Cursor, c, AstSelection, a} from "core";

import {
	getAvailablePickOptionTypes,
	getAvailableDropTargetTypes,
} from "modules/astIntel";

import {PickOption, DropTarget} from "ui/editor";
import type View from "./View";

/*
splitting this out to reduce size of View

could move some more stuff here probably
*/

export default class extends Evented<{
	updatePickOptions: void;
	updateDropTargets: void;
}> {
	pickOptionsByLine: {lineIndex: number; pickOptions: PickOption[]}[] = [];
	dropTargetsByLine: {lineIndex: number; dropTargets: DropTarget[]}[] = [];
	
	private view: View;
	
	constructor(view: View) {
		super();
		
		this.view = view;
	}
	
	showPickOptionsFor(lineIndex: number): void {
		let {document} = this.view;
		let {astIntel} = document.langFromAstSelection(a(lineIndex));
		let types = getAvailablePickOptionTypes(astIntel, document, lineIndex);
		
		this.pickOptionsByLine = [{
			lineIndex,
			pickOptions: types.map(type => new PickOption(lineIndex, type)),
		}];
		
		this.fire("updatePickOptions");
	}
	
	clearPickOptions() {
		this.pickOptionsByLine = [];
		
		this.fire("updatePickOptions");
	}
	
	showDropTargets() {
		let byLineIndex = new Map();
		
		let {
			document,
			wrappedLines,
			astSelection,
			astSelectionHilite,
			measurements: {
				rowHeight,
			},
			sizes: {
				height,
			},
		} = this.view;
		
		let {lineIndex} = this.view.canvasUtils.findFirstVisibleLine();
		
		let rowsToRender = height / rowHeight;
		let rowsRenderedOrSkipped = 0;
		
		while (lineIndex < wrappedLines.length) {
			let wrappedLine = wrappedLines[lineIndex];
			let {line} = wrappedLine;
			
			if (
				astSelection.containsLineIndex(lineIndex)
				|| astSelectionHilite?.containsLineIndex(lineIndex)
			) {
				lineIndex++;
				
				continue;
			}
			
			let {astIntel} = document.langFromLineIndex(lineIndex);
			
			if (!astIntel) {
				lineIndex++;
				rowsRenderedOrSkipped += wrappedLine.height;
				
				continue;
			}
			
			byLineIndex.set(lineIndex, getAvailableDropTargetTypes(
				astIntel,
				document,
				lineIndex,
			).map(type => new DropTarget(lineIndex, type)));
			
			rowsRenderedOrSkipped += wrappedLine.height;
			
			if (rowsRenderedOrSkipped >= rowsToRender) {
				break;
			}
			
			lineIndex++;
		}
		
		this.dropTargetsByLine = [...byLineIndex.entries()].map(([lineIndex, dropTargets]) => {
			return {lineIndex, dropTargets};
		});
		
		this.fire("updateDropTargets");
	}
	
	clearDropTargets() {
		this.dropTargetsByLine = [];
		
		this.fire("updateDropTargets");
	}
}
