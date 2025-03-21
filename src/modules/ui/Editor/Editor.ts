import {Evented, throttle, removeInPlace} from "utils";
import bindFunctions from "utils/bindFunctions";

import astCommon from "modules/astCommon";
import AstSelection, {a} from "modules/core/AstSelection";
import Selection, {s} from "modules/core/Selection";
import Cursor, {c} from "modules/core/Cursor";

import AstMode from "./AstMode";
import normalMouse from "./normalMouse";
import normalKeyboard from "./normalKeyboard";
import astMouse from "./astMouse";
import astKeyboard from "./astKeyboard";
import commonKeyboard from "./commonKeyboard";
import WordCompletion from "./WordCompletion";
import commonWheel from "./commonWheel";
import modeSwitchKey from "./modeSwitchKey";
import snippets from "./snippets";
import api from "./api";

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
		
		this.wordCompletion = new WordCompletion(this);
		
		this.modeSwitchKey = modeSwitchKey(this);
		
		this.mouseIsDown = false;
		
		this.snippetSession = null;
		
		this.historyEntries = new WeakMap();
		
		this.batchState = null;
		
		this.api = bindFunctions(this, api);
		
		this.throttledBackup = throttle(() => {
			platform.backup(this.document);
		}, 15000);
		
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
		
		let astManipulations = {
			...astCommon.astManipulations,
			...view.lang.astMode?.astManipulations,
		};
		
		return Object.values(astManipulations).filter(function(manipulation) {
			return astCommon.astManipulationIsAvailable(manipulation, document, astSelection);
		});
	}
	
	doAstManipulation(code) {
		let {document, view, astSelection} = this;
		
		let astManipulations = {
			...astCommon.astManipulations,
			...view.lang.astMode?.astManipulations,
		};
		
		let manipulation;
		
		if (code[0] === "$") {
			manipulation = Object.values(astManipulations).reverse().find(m => m.group === code && astCommon.astManipulationIsAvailable(m, document, astSelection));
			
			if (!manipulation) {
				return;
			}
		} else {
			manipulation = astManipulations[code];
			
			if (!manipulation || !astCommon.astManipulationIsAvailable(manipulation, document, astSelection)) {
				return;
			}
		}
		
		this.astMode.doAstManipulation(manipulation);
	}
	
	insertSnippet(snippet, replaceWord=null) {
		snippets.insert(this, snippet, replaceWord);
	}
	
	createSnippetPositionsForLines(lines, baseLineIndex) {
		return snippets.createPositionsForLines(lines, baseLineIndex, this.document.format.newline);
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
			let selection = this.normalSelection;
			
			for (let edit of edits) {
				if (edit.selection.isBefore(selection)) {
					selection = selection.adjustForEarlierEdit(edit.selection, edit.newSelection);
				}
			}
			
			this.applyAndMergeWithLastHistoryEntry({
				edits,
				normalSelection: selection,
				snippetSession: {...this.snippetSession, positions},
			});
		}
	}
	
	snippetSessionHasMoreTabstops() {
		let {index, positions} = this.snippetSession;
		
		for (let i = index + 1; i < positions.length; i++) {
			if (positions[i].placeholder.type === "tabstop" && positions[i].selection) {
				return true;
			}
		}
		
		return false;
	}
	
	async showCompletions() {
		if (!base.getPref("completions")) {
			return;
		}
		
		let cursor = this.normalSelection.left;
		
		let completions = await this.document.lsp.getCompletions(cursor) || [];
		
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
	
	acceptSelectedCompletion() {
		//let {
		//	edit,
		//	newSelection,
		//} = this.document.replaceSelection(selection, nextWord);
		//
		//let edits = [edit];
		//
		//this.applyAndAddHistoryEntry({
		//	edits,
		//	normalSelection: newSelection,
		//	snippetSession: this.adjustSnippetSession(edits),
		//});
		//
		//this.updateSnippetExpressions();
	}
	
	getExternalWordCompletionCandidates() {
		let candidates = [];
		
		this.fire("requestWordCompletionCandidates", function(words) {
			candidates = [...candidates, words];
		});
		
		return candidates;
	}
	
	async goToDefinitionFromCursor(cursor) {
		let word = this.wordUnderCursor(cursor);
		
		let results = await this.document.lsp.getDefinitions(cursor) || [];
		
		if (results.length === 0) {
			return;
		}
		
		// TODO if multiple, bring up a list
		
		this.fire("requestGoToDefinition", results[0]);
	}
	
	async findReferencesFromCursor(cursor) {
		let word = this.wordUnderCursor(cursor);
		
		let results = await this.document.lsp.findReferences(cursor) || [];
		
		if (results.length === 0) {
			return;
		}
		
		console.log(results);
		
		this.fire("requestShowReferences", results);
	}
	
	wordUnderCursor(cursor) {
		let wordSelection = this.view.Selection.wordUnderCursor(cursor);
		let str = this.document.getSelectedText(wordSelection);
		
		if (!str.match(/^\w+$/)) {
			return null;
		}
		
		return str;
	}
	
	onDocumentEdit(edits) {
		let {view} = this;
		
		view.startBatch();
		
		for (let edit of edits) {
			view.setNormalHilites(view.normalHilites.map(function(hilite) {
				if (hilite.overlaps(edit.selection)) {
					return null;
				}
				
				return hilite.edit(edit);
			}).filter(Boolean));
			
			view.adjustFoldsForEdit(edit);
		}
		
		view.updateMarginSize();
		
		view.endBatch();
		
		this.throttledBackup();
	}
	
	onDocumentSave() {
		this.view.updateWrappedLines();
		
		this.clearBatchState();
	}
	
	onDocumentFileChanged(updateEntry) {
		if (!updateEntry) {
		}
		
		let {view} = this;
		
		view.startBatch();
		
		this.applyExistingDocumentEntry(updateEntry);
		
		view.updateWrappedLines();
		
		view.ensureScrollIsWithinBounds();
		
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
	
	applyExistingDocumentEntry(entry, newSelection=null) {
		this.historyEntries.set(entry, {
			before: {
				normalSelection: this.mode === "normal" ? this.normalSelection : undefined,
				astSelection: this.mode === "ast" ? this.astSelection : undefined,
				snippetSession: this.snippetSession,
			},
			
			after: {
				normalSelection: newSelection || this.normalSelection,
				astSelection: this.astSelection,
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
		
		this.setSelectionClipboard();
		
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
		
		this.setSelectionClipboard();
		
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
			base.prefs.normalKeymap[keyCombo]
			|| key.length === 1 && !isModified
			|| platform.snippets.findByLangAndKeyCombo(lang, keyCombo)
		);
	}
	
	willHandleAstKeydown(keyCombo) {
		let {astKeymap, astManipulationKeymap} = base.prefs;
		let lang = this.document.langFromAstSelection(this.astSelection);
		
		return astManipulationKeymap[lang.code]?.[keyCombo] || astManipulationKeymap.common[keyCombo] || astKeymap[keyCombo];
	}
	
	willHandleCommonKeydown(keyCombo) {
		return base.prefs.commonKeymap[keyCombo];
	}
	
	willHandleWheel(wheelCombo) {
		return base.prefs.editorMouseMap[wheelCombo.wheelCombo];
	}
	
	async normalKeydown(key, keyCombo, isModified) {
		if (this.snippetSession && !this.snippetSessionHasMoreTabstops()) {
			this.clearSnippetSession();
		}
		
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
		
		let fnName = base.prefs.normalKeymap[keyCombo];
		let flags;
		let str;
		let isPaste = ["paste", "pasteAndIndent"].includes(fnName);
		
		if (isPaste) {
			// read clipboard before startBatch to keep startBatch/endBatch pairs sync
			str = await platform.clipboard.read();
		}
		
		view.startBatch();
		
		if (fnName) {
			if (isPaste) {
				flags = this.normalKeyboard[fnName](str);
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
		let {view} = this;
		let {astKeymap, astManipulationKeymap} = base.prefs;
		let lang = this.document.langFromAstSelection(this.astSelection);
		let astManipulationCode = astManipulationKeymap[lang.code]?.[keyCombo] || astManipulationKeymap.common[keyCombo];
		
		view.startBatch();
		
		if (astManipulationCode) {
			this.doAstManipulation(astManipulationCode);
		} else {
			this.astKeyboard[astKeymap[keyCombo]]();
		}
		
		view.ensureSelectionIsOnScreen();
		
		view.endBatch();
	}
	
	commonKeydown(keyCombo) {
		let fnName = base.prefs.commonKeymap[keyCombo];
		
		let {view} = this;
		
		view.startBatch();
		
		let flags = this.commonKeyboard[fnName]() || [];
		
		if (!flags.includes("noScrollCursorIntoView")) {
			view.ensureSelectionIsOnScreen();
		}
		
		view.endBatch();
	}
	
	keyup() {
		if (this.needToUpdateAstSelection) {
			this.view.updateAstSelectionFromNormalSelection();
			
			this.needToUpdateAstSelection = false;
		}
	}
	
	handleWheel(wheelCombo, cursor) {
		let fnName = base.prefs.editorMouseMap[wheelCombo.wheelCombo];
		
		this.commonWheel[fnName](wheelCombo, cursor);
	}
	
	marginMousedown(lineIndex) {
		this.view.toggleFoldHeader(lineIndex);
		
		this.view.redraw();
	}
	
	setSelectionFromNormalKeyboard(selection) {
		this.setNormalSelection(selection, false);
		this.setSelectionClipboard();
		
		this.clearBatchState();
		this.astMode.clearMultiStepCommand();
		
		this.needToUpdateAstSelection = true;
		
		this.fire("normalSelectionChangedByMouseOrKeyboard", selection);
	}
	
	setSelectionFromNormalMouse(selection) {
		this.setNormalSelection(selection);
		this.setSelectionClipboard();
		this.view.updateSelectionEndCol();
		
		this.clearSnippetSession();
		this.clearBatchState();
		this.astMode.clearMultiStepCommand();
		this.clearCompletions();
		
		this.fire("normalSelectionChangedByMouseOrKeyboard", selection);
	}
	
	setNormalSelection(selection, updateAstSelection=true) {
		this.view.setNormalSelection(selection, updateAstSelection);
		
		this.wordCompletion.selectionChanged();
		
		if (base.getPref("dev.logNodes")) {
			//console.log(this.document.lines[selection.start.lineIndex]);
			console.log(this.document.getNodesOnLine(selection.start.lineIndex));
		}
	}
	
	setAstSelection(selection) {
		this.view.setAstSelection(selection);
	}
	
	setSelectionClipboard() {
		if (this.normalSelection.isFull()) {
			platform.clipboard.writeSelection(this.getSelectedText());
		}
	}
	
	adjustIndent(adjustment) {
		let selection = this.normalSelection.sort();
		let {start, end} = selection;
		let edits = [];
		
		for (let lineIndex = start.lineIndex; lineIndex <= end.lineIndex; lineIndex++) {
			let line = this.document.lines[lineIndex];
			let indentLevel = Math.max(0, line.indentLevel + adjustment);
			let indentationSelection = s(c(lineIndex, 0), c(lineIndex, line.indentOffset));
			
			edits.push(this.document.edit(indentationSelection, this.document.format.indentation.string.repeat(indentLevel)));
		}
		
		let newSelection = (
			selection.isFull()
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
	
	insertTab() {
		let {document, normalSelection} = this;
		let {indentation} = document.format;
		
		let str;
		
		if (indentation.type === "tab") {
			str = "\t";
		} else {
			let {left} = normalSelection;
			let {colsPerIndent} = indentation;
			let insertCols = colsPerIndent - left.offset % colsPerIndent;
			
			str = " ".repeat(insertCols);
		}
		
		let {
			edit,
			newSelection,
		} = document.replaceSelection(normalSelection, str);
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
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
	
	getValue() {
		return this.document.string;
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
	
	get string() {
		return this.document.string;
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

export default Editor;
