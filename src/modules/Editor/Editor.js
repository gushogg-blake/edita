let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let {removeInPlace} = require("utils/arrayMethods");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let find = require("./find");
let AstMode = require("./AstMode");
let normalMouse = require("./normalMouse");
let normalKeyboard = require("./normalKeyboard");
let astMouse = require("./astMouse");
let astKeyboard = require("./astKeyboard");
let modeSwitchKey = require("./modeSwitchKey");
let SnippetSession = require("./SnippetSession");
let api = require("./api");

let {s: a} = AstSelection;
let {s} = Selection;
let {c} = Cursor;

class Editor extends Evented {
	constructor(document, view) {
		super();
		
		this.document = document;
		this.view = view;
		
		this.astMode = new AstMode(this);
		
		this.normalMouse = bindFunctions(this, normalMouse);
		this.normalKeyboard = bindFunctions(this, normalKeyboard);
		this.astMouse = bindFunctions(this, astMouse);
		this.astKeyboard = bindFunctions(this, astKeyboard);
		
		this.modeSwitchKey = modeSwitchKey(this);
		
		this.mouseIsDown = false;
		
		this.find = find(this);
		
		this.snippetSession = null;
		
		this.historyEntries = new WeakMap();
		
		this.batchState = null;
		
		this.api = bindFunctions(this, api);
		
		this.teardownCallbacks = [
			document.on("edit", this.onDocumentEdit.bind(this)),
			document.on("save", this.onDocumentSave.bind(this)),
		];
	}
	
	getAvailableAstManipulations() {
		let {astMode} = this.view.lang;
		
		if (!astMode) {
			return;
		}
		
		return astMode.getAvailableAstManipulations(
			this.document,
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
		this.astMode.doLangManipulation(code);
	}
	
	insertSnippet(snippet, replaceWord=null) {
		SnippetSession.insert(this, this.document, this.view.normalSelection, snippet, replaceWord);
	}
	
	createSnippetPositionsForLines(lines, baseLineIndex) {
		return SnippetSession.createPositionsForLines(lines, baseLineIndex, this.document.fileDetails.newline);
	}
	
	nextTabstop() {
		let {session, position} = SnippetSession.nextTabstop(this.snippetSession);
		
		if (position) {
			this.setNormalSelection(position.selection);
			this.view.redraw();
		}
		
		this.snippetSession = session;
	}
	
	prevTabstop() {
		
	}
	
	clearSnippetSession() {
		this.snippetSession = null;
	}
	
	adjustSnippetSession(edits) {
		return this.snippetSession && SnippetSession.edit(this.snippetSession, edits);
	}
	
	snippetSessionHasMoreTabstops() {
		let {index, positions} = this.snippetSession;
		
		for (let i = index + 1; i < positions.length; i++) {
			if (positions[i].placeholder.type === "tabstop") {
				return true;
			}
		}
		
		return false;
	}
	
	onDocumentEdit(edit) {
		let {selection: oldSelection, newSelection} = edit;
		let {normalHilites} = this.view;
		
		this.view.normalHilites = normalHilites.map(function(hilite) {
			return Selection.edit(hilite, oldSelection, newSelection);
		}).filter(Boolean);
		
		this.view.updateMarginSize();
	}
	
	onDocumentSave() {
		this.clearBatchState();
	}
	
	applyHistoryEntry(entry, state) {
		let {
			normalSelection,
			astSelection,
			snippetSession,
		} = this.historyEntries.get(entry)[state];
		
		this.view.updateWrappedLines();
		
		if (normalSelection !== undefined) {
			this.setNormalSelection(normalSelection);
		}
		
		if (astSelection !== undefined) {
			this.setAstSelection(astSelection);
		}
		
		if (snippetSession !== undefined) {
			this.snippetSession = snippetSession;
		}
		
		this.fire("edit");
	}
	
	applyAndAddHistoryEntry(edit) {
		let entry = this.document.applyAndAddHistoryEntry(edit.edits);
		
		let newSnippetSession = null;
		
		if (this.snippetSession) {
			newSnippetSession = this.adjustSnippetSession(edit.edits);
		}
		
		this.historyEntries.set(entry, {
			before: {
				normalSelection: this.view.mode === "normal" ? this.view.normalSelection : undefined,
				astSelection: this.view.mode === "ast" ? this.view.astSelection : undefined,
				snippetSession: this.snippetSession,
			},
			
			after: {
				normalSelection: edit.normalSelection,
				astSelection: edit.astSelection,
				snippetSession: edit.snippetSession || newSnippetSession || null,
			},
		});
		
		this.applyHistoryEntry(entry, "after");
	}
	
	applyAndMergeWithLastHistoryEntry(edit) {
		let entry = this.document.applyAndMergeWithLastHistoryEntry(edit.edits);
		let states = this.historyEntries.get(entry);
		
		let {
			normalSelection,
			astSelection,
			snippetSession,
		} = edit;
		
		states.after = {
			...states.after,
			normalSelection,
			astSelection,
			snippetSession,
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
	
	async save() {
		let {document} = this;
		
		if (!document.path) {
			return this.saveAs();
		}
		
		await document.save();
		
		this.onSave();
		
		return document.path;
	}
	
	async saveAs() {
		let {document} = this;
		let path = await platform.saveAs();
		
		if (path) {
			await document.saveAs(path);
		}
		
		this.onSave();
		
		return document.path;
	}
	
	onSave() {
		this.view.updateWrappedLines();
		this.view.redraw();
	}
	
	willHandleNormalKeydown(key, keyCombo, isModified) {
		return platform.prefs.normalKeymap[keyCombo] || key.length === 1 && !isModified;
	}
	
	willHandleAstKeydown(keyCombo) {
		return platform.prefs.astKeymap[keyCombo];
	}
	
	async normalKeydown(key, keyCombo, isModified) {
		let fnName = platform.prefs.normalKeymap[keyCombo];
		
		if (fnName) {
			await this.normalKeyboard[fnName]();
		} else if (!isModified && key.length === 1) {
			this.normalKeyboard.insert(key);
		} else {
			return;
		}
		
		if (![
			"copy",
		].includes(fnName)) {
			this.view.ensureSelectionIsOnScreen();
		}
		
		this.view.startCursorBlink();
		
		console.time("redraw");
		this.view.redraw();
		console.timeEnd("redraw");
	}
	
	async astKeydown(keyCombo) {
		let handled = false;
		let fnName = platform.prefs.astKeymap[keyCombo];
		
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
		this.astMode.clearMultiStepCommand();
	}
	
	setSelectionFromNormalMouse(selection) {
		this.setNormalSelection(selection);
		this.view.updateSelectionEndCol();
		
		this.clearSnippetSession();
		this.clearBatchState();
		this.astMode.clearMultiStepCommand();
	}
	
	setNormalSelection(selection) {
		this.view.setNormalSelection(selection);
		
		// clear word completion session (word completion changes the selection,
		// so only clear it if something else changed the selection)
		if (!this.inWordComplete) {
			this.completeWordSession = null;
		}
		
		console.log(this.document.lines[selection.start.lineIndex]);
		console.log(this.document.getNodesOnLine(selection.start.lineIndex));
	}
	
	setAstSelection(selection) {
		this.view.setAstSelection(selection);
	}
	
	adjustIndent(adjustment) {
		let {start, end} = Selection.sort(this.normalSelection);
		let edits = [];
		
		for (let lineIndex = start.lineIndex; lineIndex <= end.lineIndex; lineIndex++) {
			let line = this.document.lines[lineIndex];
			let indentLevel = Math.max(0, line.indentLevel + adjustment);
			let indentationSelection = s(c(lineIndex, 0), c(lineIndex, line.indentOffset));
			
			edits.push(this.document.edit(indentationSelection, this.document.fileDetails.indentation.string.repeat(indentLevel)));
		}
		
		let newSelection = s(c(start.lineIndex, 0), c(end.lineIndex, this.document.lines[end.lineIndex].string.length + adjustment));
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
	}
	
	indentSelection() {
		this.adjustIndent(1);
	}
	
	dedentSelection() {
		this.adjustIndent(-1);
	}
	
	switchToAstMode() {
		this.view.switchToAstMode();
	}
	
	switchToNormalMode() {
		this.view.switchToNormalMode();
	}
	
	setMode(mode) {
		this.view.setMode(mode);
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
	
	setValue(value) {
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(this.view.Selection.all(), value);
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: s(newSelection.end),
		});
		
		this.view.redraw();
	}
	
	mousedown() {
		this.modeSwitchKey.mousedown();
	}
	
	mouseup() {
		this.modeSwitchKey.mouseup();
	}
	
	get mode() {
		return this.view.mode;
	}
	
	get astSelection() {
		return this.view.astSelection;
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
