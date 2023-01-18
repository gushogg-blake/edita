let Selection = require("modules/Selection");
let AstSelection = require("modules/AstSelection");
let astCommon = require("modules/astCommon");

module.exports = {
	setSelection(selection) {
		this.view.setAstSelection(selection);
	},
	
	setSelectionHilite(selection, showPickOptions=true) {
		let {view} = this;
		
		view.startBatch();
		
		view.setAstSelectionHilite(selection);
		
		if (showPickOptions) {
			view.showPickOptionsFor(selection);
		}
		
		view.endBatch();
	},
	
	setInsertionHilite(selection) {
		this.view.setAstInsertionHilite(selection);
	},
	
	drop(
		fromSelection,
		toSelection,
		lines,
		move,
		pickOptionType,
		dropTargetType,
	) {
		if (fromSelection && toSelection && (
			!toSelection.isFull() && fromSelection.isNextTo(toSelection)
			|| fromSelection.equals(toSelection)
		)) {
			this.astMouse.invalidDrop();
			
			return;
		}
		
		this.astMouse.setInsertionHilite(null);
		
		let {document, view} = this;
		let {astMode} = document.langFromAstSelection(fromSelection || toSelection);
		
		view.startBatch();
		
		view.clearDropTargets();
		
		let {
			edits,
			snippetEdit,
			newSelection,
		} = astCommon.drop(
			astMode,
			document,
			fromSelection,
			toSelection,
			lines,
			move,
			pickOptionType,
			dropTargetType,
		);
		
		let normalSelection;
		let snippetSession = null;
		
		if (snippetEdit) {
			let {
				insertIndex,
				removeLines,
				insertLines,
			} = snippetEdit;
			
			let {
				replacedLines,
				positions,
			} = this.createSnippetPositionsForLines(insertLines, insertIndex);
			
			edits.push({
				lineIndex: insertIndex,
				removeLinesCount: removeLines,
				insertLines: replacedLines,
			});
			
			this.astSelectionAfterSnippet = newSelection;
			
			newSelection = undefined;
			normalSelection = positions[0].selection;
			
			this.switchToNormalMode();
			
			snippetSession = {
				index: 0,
				positions,
			};
		}
		
		if (edits.length > 0) {
			if (!toSelection) {
				normalSelection = Selection.startOfLine(fromSelection.startLineIndex);
			}
			
			let {lineIndex, removeLinesCount, insertLines} = edits[0];
			
			this.applyAndAddHistoryEntry({
				edits: [document.lineEdit(lineIndex, removeLinesCount, insertLines)],
				astSelection: newSelection,
				normalSelection,
				snippetSession,
			});
			
			for (let {lineIndex, removeLinesCount, insertLines} of edits.slice(1)) {
				this.applyAndMergeWithLastHistoryEntry({
					edits: [document.lineEdit(lineIndex, removeLinesCount, insertLines)],
					astSelection: newSelection,
					normalSelection,
					snippetSession,
				});
			}
		}
		
		view.endBatch();
	},
	
	invalidDrop() {
		let {view} = this;
		
		view.startBatch();
		
		view.clearDropTargets();
		
		this.astMouse.setInsertionHilite(null);
		
		view.endBatch();
	},
};
