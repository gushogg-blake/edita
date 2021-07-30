let Evented = require("../../utils/Evented");
let bindFunctions = require("../../utils/bindFunctions");
let find = require("./find");
let normalMouse = require("./normalMouse");
let normalKeyboard = require("./normalKeyboard");
let astMouse = require("./astMouse");
let astKeyboard = require("./astKeyboard");

class Editor extends Evented {
	constructor(document, view) {
		super();
		
		this.document = document;
		this.view = view;
		
		this.normalMouse = bindFunctions(this, normalMouse);
		this.normalKeyboard = bindFunctions(this, normalKeyboard);
		this.astMouse = bindFunctions(this, astMouse);
		this.astKeyboard = bindFunctions(this, astKeyboard);
		
		this.find = find(this);
		
		this.history = [];
		this.historyIndex = 0;
	}
	
	applyEdit(edit) {
		let {
			edits,
			normalSelection,
			astSelection,
		} = edit;
		
		for (let edit of edits) {
			this.document.apply(edit);
		}
		
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
		let {
			normalSelection,
			astSelection,
		} = this.view;
		
		let undo = {
			normalSelection,
			astSelection,
			edits: [...edit.edits].reverse().map(e => this.document.reverse(e)),
		};
		
		this.applyEdit(edit);
		
		let entry = {
			undo,
			redo: edit,
		};
		
		if (this.historyIndex < this.history.length) {
			this.history.splice(this.historyIndex, this.history.length - this.historyIndex);
		}
		
		this.history.push(entry);
		
		this.historyIndex = this.history.length;
	}
	
	get lastHistoryEntry() {
		return this.history[this.history.length - 1];
	}
	
	undo() {
		if (this.historyIndex === 0) {
			return;
		}
		
		this.historyIndex--;
		
		this.applyEdit(this.history[this.historyIndex].undo);
		
		this.view.updateSelectionEndCol();
		this.view.ensureSelectionIsOnScreen();
		this.view.startCursorBlink();
		this.view.redraw();
	}
	
	redo() {
		if (this.historyIndex === this.history.length) {
			return;
		}
		
		this.applyEdit(this.history[this.historyIndex].redo);
		
		this.historyIndex++;
		
		this.view.updateSelectionEndCol();
		this.view.ensureSelectionIsOnScreen();
		this.view.startCursorBlink();
		this.view.redraw();
	}
	
	afterEdit() {
		
	}
	
	willHandleNormalKeydown(key, keyCombo, isModified) {
		return app.prefs.normalKeymap[keyCombo] || key.length === 1 && !isModified;
	}
	
	willHandleAstKeydown(keyCombo) {
		return app.prefs.astKeymap[keyCombo];
	}
	
	async normalKeydown(key, keyCombo, isModified) {
		let fnName = app.prefs.normalKeymap[keyCombo];
		
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
		let fnName = app.prefs.astKeymap[keyCombo];
		
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
	
	setBatchState(state) {
		this.batchState = state;
	}
	
	clearBatchState() {
		this.batchState = null;
	}
	
	afterEdit() {
		this.fire("afterEdit");
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
