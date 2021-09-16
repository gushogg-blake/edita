let AstSelection = require("modules/utils/AstSelection");
let astCommon = require("modules/langs/common/astMode");

module.exports = {
	setSelection(selection) {
		this.view.setAstSelection(selection);
		this.view.redraw();
	},
	
	setSelectionHilite(selection) {
		this.view.astSelectionHilite = selection;
		
		this.view.showPickOptionsFor(selection);
		
		this.view.redraw();
	},
	
	setInsertionHilite(selection) {
		this.view.astInsertionHilite = selection;
	},
	
	drop(
		fromSelection,
		toSelection,
		lines,
		move,
		option,
		target,
	) {
		if (
			fromSelection
			&& toSelection
			&& !AstSelection.isFull(toSelection)
			&& AstSelection.isAdjacent(fromSelection, toSelection)
		) {
			this.astMouse.invalidDrop();
			
			return;
		}
		
		this.view.clearDropTargets();
		this.astMouse.setInsertionHilite(null);
		
		let {astMode} = this.document.langFromAstSelection(fromSelection || toSelection);
		
		let {
			edits,
			snippetEdit,
			newSelection,
		} = astCommon.drop(
			astMode,
			this.document,
			fromSelection,
			toSelection,
			lines,
			move,
			option,
			target,
		);
		
		if (edits.length > 0) {
			this.applyAndAddHistoryEntry({
				edits,
				astSelection: newSelection,
			});
		}
		
		if (snippetEdit) {
			
		}
	},
	
	invalidDrop() {
		this.view.clearDropTargets();
		this.astMouse.setInsertionHilite(null);
		this.view.redraw();
	},
};
