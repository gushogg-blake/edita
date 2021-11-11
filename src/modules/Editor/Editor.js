let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let {removeInPlace} = require("utils/arrayMethods");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let lspClient = require("modules/lsp/lspClient");

let AstMode = require("./AstMode");
let normalMouse = require("./normalMouse");
let normalKeyboard = require("./normalKeyboard");
let astMouse = require("./astMouse");
let astKeyboard = require("./astKeyboard");
let commonKeyboard = require("./commonKeyboard");
let commonWheel = require("./commonWheel");
let modeSwitchKey = require("./modeSwitchKey");
let snippets = require("./snippets");
let find = require("./find");
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
		this.commonKeyboard = bindFunctions(this, commonKeyboard);
		this.commonWheel = bindFunctions(this, commonWheel);
		
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
			document.on("fileChanged", this.onDocumentFileChanged.bind(this)),
			view.on("focus", this.onFocus.bind(this)),
			view.on("blur", this.onBlur.bind(this)),
		];
	}
	
	getAvailableAstManipulations() {
		let {document, view, astSelection} = this;
		let {astMode} = view.lang;
		
		if (!astMode) {
			return [];
		}
		
		return Object.values(astMode.astManipulations).filter(function(manipulation) {
			return manipulation.isAvailable(document, astSelection);
		});
	}
	
	astManipulationIsAvailable(code) {
		let {document, view, astSelection} = this;
		let {astMode} = view.lang;
		
		return astMode?.astManipulation[code]?.isAvailable(document, astSelection);
	}
	
	doAstManipulation(code) {
		if (!this.astManipulationIsAvailable(code)) {
			return;
		}
		
		this.astMode.doLangManipulation(code);
	}
	
	insertSnippet(snippet, replaceWord=null) {
		snippets.insert(this, snippet, replaceWord);
	}
	
	createSnippetPositionsForLines(lines, baseLineIndex) {
		return snippets.createPositionsForLines(lines, baseLineIndex, this.document.fileDetails.newline);
	}
	
	nextTabstop() {
		let {session, position} = snippets.nextTabstop(this.snippetSession);
		
		if (position) {
			this.setNormalSelection(position.selection);
		}
		
		this.snippetSession = session;
	}
	
	prevTabstop() {
		
	}
	
	clearSnippetSession() {
		this.snippetSession = null;
	}
	
	adjustSnippetSession(edits) {
		return this.snippetSession && snippets.edit(this.snippetSession, edits);
	}
	
	updateSnippetExpressions() {
		let {snippetSession} = this;
		
		if (!snippetSession) {
			return;
		}
		
		let {
			positions,
			edits,
		} = snippets.computeExpressions(this.document, snippetSession.positions);
		
		if (edits.length > 0) {
			this.applyAndMergeWithLastHistoryEntry({
				edits,
				normalSelection: this.view.normalSelection,
				snippetSession: {...this.snippetSession, positions},
			});
		}
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
	
	async showCompletions() {
		if (!platform.getPref("completions")) {
			return;
		}
		
		let cursor = Selection.sort(this.normalSelection).start;
		let completions = await lspClient.getCompletions(this.document, cursor);
		
		console.log(completions);
		
		if (completions.length > 0) {
			this.completions = {
				completions,
				selectedCompletion: completions[0],
				cursor,
			};
		} else {
			this.completions = null;
		}
		
		this.view.setCompletions(this.completions);
	}
	
	clearCompletions() {
		this.completions = null;
		
		this.view.setCompletions(this.completions);
	}
	
	onDocumentEdit(edit) {
		let {selection: oldSelection, newSelection} = edit;
		let {view} = this;
		let {normalHilites} = view;
		
		view.startBatch();
		
		view.setNormalHilites(normalHilites.map(function(hilite) {
			return Selection.edit(hilite, oldSelection, newSelection);
		}).filter(Boolean));
		
		view.updateMarginSize();
		
		view.endBatch();
	}
	
	onDocumentSave() {
		this.view.updateWrappedLines();
		
		this.clearBatchState();
	}
	
	onDocumentFileChanged(updateEntry) {
		let {view} = this;
		
		view.startBatch();
		
		if (updateEntry) {
			this.historyEntries.set(updateEntry, {
				before: {
					normalSelection: this.mode === "normal" ? this.normalSelection : undefined,
					astSelection: this.mode === "ast" ? this.astSelection : undefined,
					snippetSession: this.snippetSession,
				},
				
				after: {
					normalSelection: this.normalSelection,
					astSelection: this.astSelection,
				},
			});
			
			this.applyHistoryEntry(updateEntry, "after");
		}
		
		view.updateWrappedLines();
		
		view.endBatch();
		
		this.clearBatchState();
	}
	
	applyHistoryEntry(entry, state) {
		let {
			normalSelection,
			astSelection,
			snippetSession,
		} = this.historyEntries.get(entry)[state];
		
		let {view} = this;
		
		view.startBatch();
		
		view.updateWrappedLines();
		
		if (normalSelection !== undefined) {
			this.setNormalSelection(normalSelection);
		}
		
		if (astSelection !== undefined) {
			this.setAstSelection(astSelection);
		}
		
		if (snippetSession !== undefined) {
			this.snippetSession = snippetSession;
		}
		
		view.endBatch();
		
		this.fire("edit");
	}
	
	applyAndAddHistoryEntry(edit) {
		let entry = this.document.applyAndAddHistoryEntry(edit.edits);
		
		this.historyEntries.set(entry, {
			before: {
				normalSelection: this.mode === "normal" ? this.normalSelection : undefined,
				astSelection: this.mode === "ast" ? this.astSelection : undefined,
				snippetSession: this.snippetSession,
			},
			
			after: {
				normalSelection: edit.normalSelection,
				astSelection: edit.astSelection,
				snippetSession: edit.snippetSession,
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
		
		let {view} = this;
		
		view.startBatch();
		
		view.updateSelectionEndCol();
		view.ensureSelectionIsOnScreen();
		view.startCursorBlink();
		
		view.endBatch();
	}
	
	redo() {
		let entry = this.document.redo();
		
		if (!entry) {
			return;
		}
		
		this.applyHistoryEntry(entry, "after");
		
		this.clearBatchState();
		
		let {view} = this;
		
		view.startBatch();
		
		view.updateSelectionEndCol();
		view.ensureSelectionIsOnScreen();
		view.startCursorBlink();
		
		view.endBatch();
	}
	
	willHandleNormalKeydown(key, keyCombo, isModified) {
		let lang = this.document.langFromCursor(this.normalSelection.start);
		
		return (
			platform.prefs.normalKeymap[keyCombo]
			|| key.length === 1 && !isModified
			|| platform.snippets.findByLangAndKeyCombo(lang, keyCombo)
		);
	}
	
	willHandleAstKeydown(keyCombo) {
		return platform.prefs.astKeymap[keyCombo];
	}
	
	willHandleCommonKeydown(keyCombo) {
		return platform.prefs.commonKeymap[keyCombo];
	}
	
	willHandleWheel(wheelCombo) {
		return platform.prefs.editorMouseMap[wheelCombo.wheelCombo];
	}
	
	async normalKeydown(key, keyCombo, isModified) {
		let lang = this.document.langFromCursor(this.normalSelection.start);
		let snippet = platform.snippets.findByLangAndKeyCombo(lang, keyCombo);
		
		let {view} = this;
		
		if (snippet) {
			view.startBatch();
			
			this.clearSnippetSession();
			this.insertSnippet(snippet);
			
			view.ensureSelectionIsOnScreen();
			view.startCursorBlink();
			
			view.endBatch();
			
			return;
		}
		
		let fnName = platform.prefs.normalKeymap[keyCombo];
		let flags;
		let str;
		
		if (fnName === "paste") {
			// read clipboard before startBatch to keep startBatch/endBatch pairs sync
			str = await platform.clipboard.read();
		}
		
		view.startBatch();
		
		if (fnName) {
			if (fnName === "paste") {
				flags = this.normalKeyboard.paste(str);
			} else {
				flags = this.normalKeyboard[fnName]();
			}
		} else {
			flags = this.normalKeyboard.insert(key);
		}
		
		flags = flags || [];
		
		if (!flags.includes("noScrollCursorIntoView")) {
			view.ensureSelectionIsOnScreen();
		}
		
		if (!flags.includes("noClearCompletions")) {
			this.clearCompletions();
		}
		
		view.startCursorBlink();
		
		view.endBatch();
	}
	
	astKeydown(keyCombo) {
		let fnName = platform.prefs.astKeymap[keyCombo];
		
		let {view} = this;
		
		view.startBatch();
		
		this.astKeyboard[fnName]();
		
		view.ensureSelectionIsOnScreen();
		
		view.endBatch();
	}
	
	commonKeydown(keyCombo) {
		let fnName = platform.prefs.commonKeymap[keyCombo];
		
		let {view} = this;
		
		view.startBatch();
		
		let flags = this.commonKeyboard[fnName]() || [];
		
		if (!flags.includes("noScrollCursorIntoView")) {
			view.ensureSelectionIsOnScreen();
		}
		
		view.endBatch();
	}
	
	handleWheel(wheelCombo, cursor) {
		let fnName = platform.prefs.editorMouseMap[wheelCombo.wheelCombo];
		
		this.commonWheel[fnName](wheelCombo, cursor);
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
		this.clearCompletions();
	}
	
	setNormalSelection(selection) {
		this.view.setNormalSelection(selection);
		
		// clear word completion session (word completion changes the selection,
		// so only clear it if something else changed the selection)
		if (!this.inWordComplete) {
			this.completeWordSession = null;
		}
		
		//console.log(this.document.lines[selection.start.lineIndex]);
		console.log(this.document.getNodesOnLine(selection.start.lineIndex));
	}
	
	setAstSelection(selection) {
		this.view.setAstSelection(selection);
	}
	
	//validateSelection() {
	//	this.view.setNormalSelection(this.normalSelection);
	//}
	
	adjustIndent(adjustment) {
		let selection = Selection.sort(this.normalSelection);
		let {start, end} = selection;
		let edits = [];
		
		for (let lineIndex = start.lineIndex; lineIndex <= end.lineIndex; lineIndex++) {
			let line = this.document.lines[lineIndex];
			let indentLevel = Math.max(0, line.indentLevel + adjustment);
			let indentationSelection = s(c(lineIndex, 0), c(lineIndex, line.indentOffset));
			
			edits.push(this.document.edit(indentationSelection, this.document.fileDetails.indentation.string.repeat(indentLevel)));
		}
		
		let newSelection = (
			Selection.isFull(selection)
			? s(c(start.lineIndex, 0), c(end.lineIndex, Infinity))
			: s(c(start.lineIndex, Math.max(0, start.offset + adjustment)))
		);
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
		});
	}
	
	updateSelectionEndCol() {
		this.view.updateSelectionEndCol();
	}
	
	indentSelection() {
		this.adjustIndent(1);
	}
	
	dedentSelection() {
		this.adjustIndent(-1);
	}
	
	switchToAstMode() {
		this.clearCompletions();
		this.view.switchToAstMode();
	}
	
	switchToNormalMode() {
		this.view.switchToNormalMode();
	}
	
	setMode(mode) {
		if (mode === "ast") {
			this.switchToAstMode();
		} else {
			this.switchToNormalMode();
		}
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
	}
	
	setLang(lang) {
		this.document.setLang(lang);
	}
	
	onFocus() {
		this.fire("focus");
	}
	
	onBlur() {
		this.fire("blur");
	}
	
	focusAsync() {
		setTimeout(() => {
			this.view.requestFocus();
		}, 0);
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
