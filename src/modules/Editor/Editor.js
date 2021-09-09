let Evented = require("utils/Evented");
let bindFunctions = require("utils/bindFunctions");
let {removeInPlace} = require("utils/arrayMethods");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let parsePlaceholdersInLines = require("modules/utils/parsePlaceholdersInLines");
let stringToLineTuples = require("modules/utils/stringToLineTuples");
let lineTuplesToStrings = require("modules/utils/lineTuplesToStrings");
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
			document.on("save", this.onDocumentSave.bind(this)),
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
		
		let snippetSession = placeholders.length > 0 ? {
			index: 0,
			placeholders,
		} : null;
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			astSelection: newSelection,
			snippetSession,
		});
	}
	
	insertSnippet(snippet, replaceWord=null) {
		let {start} = this.view.normalSelection;
		let {lineIndex, offset} = start;
		let {indentLevel} = this.document.lines[lineIndex];
		let indentStr = this.document.fileDetails.indentation.string;
		let lineTuples = stringToLineTuples(snippet.text);
		let lineStrings = lineTuplesToStrings(lineTuples, indentStr, indentLevel, true);
		
		let selection = (
			replaceWord
			? s(c(lineIndex, offset - replaceWord.length), start)
			: this.view.normalSelection
		);
		
		let {
			lines: replacedLines,
			placeholders,
		} = parsePlaceholdersInLines(lineStrings, lineIndex, selection.start.offset);
		
		let str = replacedLines.join(this.document.fileDetails.newline);
		let {end: cursor} = this.document.getSelectionContainingString(selection.start, str);
		let edit = this.document.edit(selection, str);
		let newSelection = s(cursor);
		let snippetSession = null;
		
		if (placeholders.length > 0) {
			snippetSession = {
				index: 0,
				placeholders,
			};
			
			newSelection = placeholders[0].selection;
		}
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
			snippetSession,
		});
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
	
	prevTabstop() {
		
	}
	
	clearSnippetSession() {
		this.snippetSession = null;
	}
	
	adjustSnippetSession(edits) {
		let {index, placeholders} = this.snippetSession;
		
		placeholders = placeholders.map(function(placeholder, i) {
			let {selection} = placeholder;
			
			for (let edit of edits) {
				let {
					selection: oldSelection,
					string,
					newSelection,
				} = edit;
				
				if (Selection.isBefore(oldSelection, selection)) {
					selection = Selection.adjustForEarlierEdit(selection, oldSelection, newSelection);
				} else if (i === index && string === "" && Cursor.equals(oldSelection.start, selection.end)) {
					selection = Selection.expand(selection, newSelection);
				} else if (Selection.isOverlapping(selection, oldSelection)) {
					selection = Selection.edit(selection, oldSelection, newSelection);
				}
			}
			
			return selection ? {
				...placeholder,
				selection,
			} : null;
		}).filter(Boolean);
		
		return {
			index,
			placeholders,
		};
	}
	
	onDocumentEdit(edit) {
		let {selection: oldSelection, newSelection} = edit;
		let {normalHilites} = this.view;
		
		this.view.normalHilites = normalHilites.map(function(hilite) {
			return Selection.adjustForEarlierEdit(hilite, oldSelection, newSelection);
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
		let {after} = this.historyEntries.get(entry);
		
		after.normalSelection = edit.normalSelection;
		
		if (this.snippetSession) {
			after.snippetSession = this.adjustSnippetSession(edit.edits);
		}
		
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
