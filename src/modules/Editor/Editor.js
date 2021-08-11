let Evented = require("../../utils/Evented");
let bindFunctions = require("../../utils/bindFunctions");
let AstSelection = require("../utils/AstSelection");
let Selection = require("../utils/Selection");
let Cursor = require("../utils/Cursor");
let parsePlaceholdersInLines = require("../utils/parsePlaceholdersInLines");
let find = require("./find");
let normalMouse = require("./normalMouse");
let normalKeyboard = require("./normalKeyboard");
let astMouse = require("./astMouse");
let astKeyboard = require("./astKeyboard");

let {s: a} = AstSelection;
let {s} = Selection;
let {c} = Cursor;

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
		
		this.snippetSession = null;
		
		this.historyEntries = new WeakMap();
	}
	
	getAvailableAstManipulations() {
		return this.document.lang.astMode.getAvailableAstManipulations(
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
		let {startLineIndex, endLineIndex} = this.view.astSelection;
		
		let transformedLines = this.document.lang.astMode.astManipulations[code].apply(this.document, this.view.astSelection);
		
		let {
			lines: replacedLines,
			placeholders,
		} = parsePlaceholdersInLines(transformedLines, startLineIndex);
		
		let edit = document.lineEdit(startLineIndex, endLineIndex - startLineIndex, replacedLines);
		let newSelection = a(startLineIndex, startLineIndex + replacedLines.length);
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			astSelection: newSelection,
		});
		
		if (placeholders.length > 0) {
			this.startSnippetSession(placeholders);
		}
	}
	
	startSnippetSession(placeholders) {
		this.snippetSession = {
			index: -1,
			placeholders,
		};
		
		this.nextTabstop();
	}
	
	nextTabstop() {
		let {snippetSession} = this;
		
		snippetSession.index++;
		
		let {index, placeholders} = snippetSession;
		
		let placeholder = placeholders[index];
		
		let {
			lineIndex,
			offset,
			initialText,
		} = placeholder;
		
		this.setNormalSelection(s(c(lineIndex, offset), c(lineIndex, offset + initialText.length)));
		
		this.view.redraw();
		
		if (index === placeholders.length - 1) {
			this.clearSnippetSession();
		}
	}
	
	clearSnippetSession() {
		this.snippetSession = null;
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
		
		this.afterEdit();
		
		// TODO update hilites (e.g. find) on edit
		
		this.fire("edit");
	}
	
	afterEdit() {
		this.view.updateSizes();
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
		
		console.log(this.document.lines[selection.start.lineIndex]);
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
