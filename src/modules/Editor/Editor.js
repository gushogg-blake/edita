let Evented = require("../../utils/Evented");
let bindFunctions = require("../../utils/bindFunctions");
let find = require("./find");
let normalMouse = require("./normalMouse");
let normalKeyboard = require("./normalKeyboard");
let astMouse = require("./astMouse");
let astKeyboard = require("./astKeyboard");

class Editor extends Evented {
	constructor(app, document, view) {
		super();
		
		this.app = app;
		this.document = document;
		this.view = view;
		
		this.normalMouse = bindFunctions(this, normalMouse);
		this.normalKeyboard = bindFunctions(this, normalKeyboard);
		this.astMouse = bindFunctions(this, astMouse);
		this.astKeyboard = bindFunctions(this, astKeyboard);
		
		this.find = find(this);
		
		this.historyEntries = new WeakMap();
	}
	
	getAvailableAstManipulations() {
		return this.document.lang.codeIntel.getAvailableAstManipulations(
			this.document.lines,
			this.view.astSelection,
		);
	}
	
	/*
	[init:let ][name:] = {
		[selection]
	};
	
	- replace the selection with the template
	- apply spacing rules to new selection (e.g. space if converting unspaced variable declarations to object)
	- fill template
	*/
	
	doAstManipulation(code) {
		let {document} = this;
		let {lines} = document;
		
		let snippet = this.document.lang.codeIntel.astManipulations[code].apply(this.document, this.view.astSelection);
		
		console.log(snippet);
	}
	
	applyHistoryEntry(entry, state) {
		let {
			normalSelection,
			astSelection,
		} = this.historyEntries.get(entry)[state];
		
		this.view.updateWrappedLines();
		
		if (normalSelection) {
			this.setNormalSelection(normalSelection);
		} else if (astSelection) {
			this.setAstSelection(astSelection);
		}
		
		// TODO update hilites (e.g. find) on edit
		
		this.fire("edit");
	}
	
	applyAndAddHistoryEntry(edit) {
		let entry = this.document.applyAndAddHistoryEntry(edit.edits);
		
		this.historyEntries.set(entry, {
			before: {
				normalSelection: this.view.normalSelection,
				astSelection: this.view.astSelection,
			},
			
			after: {
				normalSelection: edit.normalSelection,
				astSelection: edit.astSelection,
			},
		});
		
		this.applyHistoryEntry(entry, "after");
	}
	
	applyAndMergeWithLastHistoryEntry(edit) {
		let entry = this.document.applyAndMergeWithLastHistoryEntry(edit.edits);
		
		this.historyEntries.get(entry).after = {
			normalSelection: edit.normalSelection,
			astSelection: edit.astSelection,
		};
		
		this.applyHistoryEntry(entry, "after");
	}
	
	undo() {
		let entry = this.document.undo();
		
		if (!entry) {
			return;
		}
		
		this.applyHistoryEntry(entry, "before");
		
		this.clearBatchState();
		
		this.view.updateSelectionEndCol();
		this.view.ensureSelectionIsOnScreen();
		this.view.startCursorBlink();
		this.view.redraw();
	}
	
	redo() {
		let entry = this.document.redo();
		
		if (!entry) {
			return;
		}
		
		this.applyHistoryEntry(entry, "after");
		
		this.clearBatchState();
		
		this.view.updateSelectionEndCol();
		this.view.ensureSelectionIsOnScreen();
		this.view.startCursorBlink();
		this.view.redraw();
	}
	
	willHandleNormalKeydown(key, keyCombo, isModified) {
		return base.prefs.normalKeymap[keyCombo] || key.length === 1 && !isModified;
	}
	
	willHandleAstKeydown(keyCombo) {
		return base.prefs.astKeymap[keyCombo];
	}
	
	async normalKeydown(key, keyCombo, isModified) {
		let fnName = base.prefs.normalKeymap[keyCombo];
		
		if (fnName) {
			await this.normalKeyboard[fnName](this);
		} else if (!isModified && key.length === 1) {
			this.normalKeyboard.insert(key, this);
		} else {
			return;
		}
		
		this.view.ensureSelectionIsOnScreen();
		this.view.startCursorBlink();
		
		console.time("redraw");
		this.view.redraw();
		console.timeEnd("redraw");
	}
	
	async astKeydown(keyCombo) {
		let handled = false;
		let fnName = base.prefs.astKeymap[keyCombo];
		
		if (!fnName) {
			return;
		}
		
		await this.astKeyboard[fnName]();
		
		this.view.ensureSelectionIsOnScreen();
		this.view.redraw();
	}
	
	setSelectionFromNormalKeyboard(selection) {
		this.view.setNormalSelection(selection);
		
		if (Selection.isFull(selection)) {
			platform.clipboard.writeSelection(document.getSelectedText(selection));
		}
		
		this.clearBatchState();
	}
	
	setNormalSelection(selection) {
		this.view.setNormalSelection(selection);
	}
	
	setAstSelection(selection) {
		this.view.setAstSelection(selection);
	}
	
	setBatchState(state) {
		this.batchState = state;
	}
	
	clearBatchState() {
		this.batchState = null;
	}
	
	getSelectedText() {
		return this.document.getSelectedText(this.view.normalSelection);
	}
	
	get normalSelection() {
		return this.view.normalSelection;
	}
	
	get selectionEndCol() {
		return this.view.selectionEndCol;
	}
	
	get wrappedLines() {
		return this.view.wrappedLines;
	}
	
	get astSelection() {
		return this.view.astSelection;
	}
}

module.exports = Editor;
