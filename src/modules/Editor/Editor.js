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
		
		this.teardownCallbacks = [
			document.on("edit", this.onDocumentEdit.bind(this)),
		];
	}
	
	getAvailableAstManipulations() {
		let {astMode} = this.view.lang;
		
		if (!astMode) {
			return;
		}
		
		return astMode.getAvailableAstManipulations(
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
		let {astMode} = this.view.lang;
		
		let transformedLines = astMode.astManipulations[code].apply(document, this.view.astSelection);
		
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
		
		let {selection} = placeholder;
		
		this.setNormalSelection(selection);
		
		this.view.redraw();
		
		if (index === placeholders.length - 1) {
			this.clearSnippetSession();
		}
	}
	
	clearSnippetSession() {
		this.snippetSession = null;
	}
	
	onDocumentEdit(edit) {
		let {selection: oldSelection, newSelection} = edit;
		let {normalHilites} = this.view;
		
		this.view.normalHilites = normalHilites.map(function(hilite) {
			return Selection.add(Selection.subtract(hilite, oldSelection), newSelection);
		});
		
		if (this.snippetSession) {
			let {index, placeholders} = this.snippetSession;
			
			for (let i = index; i < placeholders.length; i++) {
				let placeholder = placeholders[i];
				
				placeholder.selection = Selection.add(Selection.subtract(placeholder.selection, oldSelection), newSelection);
			}
		}
		
		this.view.updateMarginSize();
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
			await this.normalKeyboard[fnName]();
		} else if (!isModified && key.length === 1) {
			this.normalKeyboard.insert(key);
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
		this.setNormalSelection(selection);
		
		if (Selection.isFull(selection)) {
			platform.clipboard.writeSelection(this.document.getSelectedText(selection));
		}
		
		this.clearBatchState();
	}
	
	setSelectionFromNormalMouse(selection) {
		this.view.setNormalSelection(selection);
		this.view.updateSelectionEndCol();
		
		this.clearSnippetSession();
		this.clearBatchState();
	}
	
	setNormalSelection(selection) {
		this.view.setNormalSelection(selection);
		
		// clear word completion session (word completion changes the selection,
		// so only clear it if something else changed the selection)
		if (!this.inWordComplete) {
			this.completeWordSession = null;
		}
		
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
	
	teardown() {
		this.view.teardown();
		
		for (let fn of this.teardownCallbacks) {
			fn();
		}
	}
}

module.exports = Editor;
