import {Evented} from "utils";
import {Selection, s, Cursor, c, AstSelection, a} from "core";

import {
	getPickOptions,
	getDropTargets,
	type PickOption,
	type DropTarget,
} from "modules/astIntel";

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
	
	showPickOptionsFor(lineIndex: number) {
		let {document} = this.view;
		let {astMode} = document.langFromAstSelection(a(lineIndex));
		
		this.pickOptionsByLine = [{
			lineIndex,
			pickOptions: getPickOptions(astMode, document, lineIndex),
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
			
			let {astMode} = document.langFromLineIndex(lineIndex);
			
			if (!astMode) {
				lineIndex++;
				rowsRenderedOrSkipped += wrappedLine.height;
				
				continue;
			}
			
			byLineIndex.set(lineIndex, getDropTargets(
				astMode,
				document,
				lineIndex,
			).map(function(target) {
				return {
					lineIndex,
					target,
				};
			}));
			
			rowsRenderedOrSkipped += wrappedLine.height;
			
			if (rowsRenderedOrSkipped >= rowsToRender) {
				break;
			}
			
			lineIndex++;
		}
		
		this.dropTargetsByLine = [...byLineIndex.entries()].map(([lineIndex, targets]) => {
			return {
				lineIndex,
				dropTargets: targets.map(({target}) => target),
			};
		});
		
		this.fire("updateDropTargets");
	}
	
	clearDropTargets() {
		this.dropTargetsByLine = [];
		
		this.fire("updateDropTargets");
	}
}
