let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let findWordCompletions = require("modules/utils/findWordCompletions");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	up() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.up());
		this.clearSnippetSession();
	},
	
	down() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.down());
		this.clearSnippetSession();
	},
	
	left() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.left());
		this.view.updateSelectionEndCol();
	},
	
	right() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.right());
		this.view.updateSelectionEndCol();
	},
	
	pageUp() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.pageUp());
		this.clearSnippetSession();
	},
	
	pageDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.pageDown());
		this.clearSnippetSession();
	},
	
	end() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.end());
		this.view.updateSelectionEndCol();
	},
	
	home() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.home());
		this.view.updateSelectionEndCol();
	},
	
	wordLeft() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.wordLeft());
		this.view.updateSelectionEndCol();
	},
	
	wordRight() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.wordRight());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionUp() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractUp());
		this.clearSnippetSession();
	},
	
	expandOrContractSelectionDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractDown());
		this.clearSnippetSession();
	},
	
	expandOrContractSelectionLeft() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractLeft());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionRight() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractRight());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionPageUp() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractPageUp());
		this.clearSnippetSession();
	},
	
	expandOrContractSelectionPageDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractPageDown());
		this.clearSnippetSession();
	},
	
	expandOrContractSelectionEnd() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractEnd());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionHome() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractHome());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionWordLeft() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractWordLeft());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionWordRight() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractWordRight());
		this.view.updateSelectionEndCol();
	},
	
	selectAll() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.all());
		this.view.updateSelectionEndCol();
		this.clearSnippetSession();
	},
	
	enter() {
		let {document, normalSelection: selection} = this;
		let {newline, indentation} = document.fileDetails;
		let {start} = Selection.sort(selection);
		let {lineIndex} = start;
		let line = document.lines[lineIndex];
		let {indentLevel} = line;
		
		if (this.view.lang.codeIntel?.shouldIndentOnNewline(document, line, lineIndex, start)) {
			indentLevel++;
		}
		
		let indent = indentation.string.repeat(indentLevel);
		
		let {
			edit,
			newSelection,
		} = document.replaceSelection(selection, newline + indent);
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	enterNoAutoIndent() {
		
	},
	
	newLineBeforeSelection() {
		let {document, normalSelection} = this;
		let {newline, indentation} = document.fileDetails;
		let {lineIndex} = Selection.sort(normalSelection).start;
		let {indentLevel} = document.lines[lineIndex];
		
		let selection = s(c(lineIndex, 0));
		let newSelection = s(c(lineIndex, Infinity));
		let indent = indentation.string.repeat(indentLevel);
		
		let {
			edit,
		} = document.replaceSelection(selection, indent + newline);
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	newLineAfterSelection() {
		let {document, normalSelection} = this;
		let {newline, indentation} = document.fileDetails;
		let {lineIndex} = Selection.sort(normalSelection).start;
		let line = document.lines[lineIndex];
		
		let selection = s(c(lineIndex, line.string.length));
		let newSelection = s(c(lineIndex + 1, Infinity));
		let indent = indentation.string.repeat(line.indentLevel);
		
		let {
			edit,
		} = document.replaceSelection(selection, newline + indent);
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	backspace() {
		let selection = Selection.sort(this.normalSelection);
		let {start} = selection;
		let {lineIndex, offset} = start;
		let isFull = this.view.Selection.isFull();
		
		let newBatchState = isFull || offset === 0 ? null : "backspace";
		
		let edit;
		let newSelection;
		
		if (isFull) {
			({
				edit,
				newSelection,
			} = this.document.replaceSelection(selection, ""));
		} else {
			if (lineIndex === 0 && offset === 0) {
				return;
			}
			
			let end;
			
			if (offset === 0) {
				end = c(lineIndex - 1, this.document.lines[lineIndex - 1].string.length);
			} else {
				end = c(lineIndex, offset - 1);
			}
			
			edit = this.document.edit(s(start, end), ""),
			newSelection = s(end);
		}
		
		let edits = [edit];
		
		let apply = {
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		};
		
		if (this.batchState === "backspace" && newBatchState === "backspace") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		this.updateSnippetExpressions();
		this.setBatchState(newBatchState);
	},
	
	delete() {
		let selection = Selection.sort(this.normalSelection);
		let {start} = selection;
		let {lineIndex, offset} = start;
		let isFull = this.view.Selection.isFull();
		
		let newBatchState = (
			isFull || offset === this.document.lines[lineIndex].string.length
			? null
			: "delete"
		);
		
		let edit;
		let newSelection;
		
		if (isFull) {
			({
				edit,
				newSelection,
			} = this.document.replaceSelection(selection, ""));
		} else {
			let line = this.document.lines[lineIndex];
			
			if (lineIndex === this.document.lines.length - 1 && offset === line.string.length) {
				return;
			}
				
			let end;
			
			if (offset === line.string.length) {
				end = c(lineIndex + 1, 0);
			} else {
				end = c(lineIndex, offset + 1);
			}
			
			edit = this.document.edit(s(start, end), ""),
			newSelection = s(start);
		}
		
		let edits = [edit];
		
		let apply = {
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		};
		
		if (this.batchState === "delete" && newBatchState === "delete") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		this.updateSnippetExpressions();
		this.setBatchState(newBatchState);
	},
	
	tab() {
		let flags;
		let {start} = this.normalSelection;
		let snippet = null;
		
		if (!this.view.Selection.isFull()) {
			let wordAtCursor = this.document.wordAtCursor(start);
			
			if (wordAtCursor) {
				snippet = platform.snippets.findByLangAndName(this.document.langFromCursor(start), wordAtCursor);
			}
		}
		
		if (this.snippetSession && !this.snippetSessionHasMoreTabstops()) {
			this.clearSnippetSession();
		}
		
		if (this.completions) {
			
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
		} else if (snippet) {
			this.insertSnippet(snippet, snippet.name);
		} else if (this.snippetSession) {
			this.nextTabstop();
		} else if (this.astMode.multiStepCommandWaitingForReturnToAstMode) {
			this.astMode.multiStepCommandReturnToAstMode();
		} else if (this.view.Selection.isMultiline()) {
			this.indentSelection();
			
			flags = ["noScrollCursorIntoView"];
		} else {
			// insert tab
			
			let {indentation} = this.document.fileDetails;
			let {normalSelection} = this.view;
			
			let str;
			
			if (indentation.type === "tab") {
				str = "\t";
			} else {
				let {start} = Selection.sort(normalSelection);
				let {colsPerIndent} = indentation;
				let insertCols = colsPerIndent - start.offset % colsPerIndent;
				
				str = " ".repeat(insertCols);
			}
			
			let {
				edit,
				newSelection,
			} = this.document.replaceSelection(this.view.normalSelection, str);
			
			this.applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
		}
		
		this.clearBatchState();
		
		return flags;
	},
	
	shiftTab() {
		let flags;
		
		if (this.snippetSession) {
			this.prevTabstop();
		} else {
			this.dedentSelection();
			
			flags = ["noScrollCursorIntoView"];
		}
		
		this.clearBatchState();
		
		return flags;
	},
	
	completeWord() {
		if (this.view.Selection.isFull()) {
			return;
		}
		
		this.inWordComplete = true;
		
		let {normalSelection} = this;
		let cursor = Selection.sort(normalSelection).start;
		let {lineIndex, offset} = cursor;
		
		if (this.completeWordSession) {
			let {
				words,
				index,
				selection,
				originalWord,
			} = this.completeWordSession;
			
			let {lineIndex, offset} = selection.start;
			
			let newIndex = index + 1;
			
			if (newIndex === words.length) {
				newIndex = -1;
			}
			
			let nextWord;
			
			if (newIndex === -1) {
				nextWord = originalWord;
			} else {
				nextWord = words[newIndex];
			}
			
			let {
				edit,
				newSelection,
			} = this.document.replaceSelection(selection, nextWord);
			
			let edits = [edit];
			
			this.applyAndAddHistoryEntry({
				edits,
				normalSelection: newSelection,
				snippetSession: this.adjustSnippetSession(edits),
			});
			
			this.updateSnippetExpressions();
			
			this.completeWordSession = {
				...this.completeWordSession,
				currentWord: nextWord,
				selection: s(selection.start, c(lineIndex, offset + nextWord.length)),
				index: newIndex,
			};
		} else {
			let wordAtCursor = this.document.wordAtCursor(cursor);
			
			if (wordAtCursor) {
				let {path} = this.document;
				let index = this.document.indexFromCursor(cursor);
				let extraWords = [path && platform.fs(path).basename].filter(Boolean);
				let words = findWordCompletions(this.document.string, wordAtCursor, index, extraWords);
				
				if (words.length > 0) {
					let currentWord = words[0];
					let selection = s(c(lineIndex, offset - wordAtCursor.length), cursor);
					
					let {
						edit,
						newSelection,
					} = this.document.replaceSelection(selection, currentWord);
					
					let edits = [edit];
					
					this.applyAndAddHistoryEntry({
						edits,
						normalSelection: newSelection,
						snippetSession: this.adjustSnippetSession(edits),
					});
					
					this.updateSnippetExpressions();
					
					this.completeWordSession = {
						originalWord: wordAtCursor,
						currentWord,
						selection: s(selection.start, c(lineIndex, selection.start.offset + currentWord.length)),
						words,
						index: 0,
					};
				}
			}
		}
		
		this.inWordComplete = false;
	},
	
	cut() {
		// TODO line if not full selection
		if (!this.view.Selection.isFull()) {
			return;
		}
		
		platform.clipboard.write(this.getSelectedText());
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(this.view.normalSelection, "");
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	copy() {
		if (this.view.Selection.isFull()) {
			platform.clipboard.write(this.getSelectedText());
		} else if (platform.getPref("copyLineIfSelectionNotFull")) {
			platform.clipboard.write(this.document.lines[this.normalSelection.start.lineIndex].string);
		}
		
		return ["noScrollCursorIntoView"];
	},
	
	paste(str) {
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(this.view.normalSelection, str);
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	insert(key) {
		let newBatchState = this.view.Selection.isFull() ? null : "typing";
		
		let {document} = this;
		let {normalSelection: selection} = this.view;
		let {start} = Selection.sort(selection);
		let {lineIndex} = start;
		
		let {
			edit,
			newSelection,
		} = document.insert(selection, key);
		
		let edits = [edit];
		
		let apply = {
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		};
		
		if (this.batchState === "typing") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		let line = document.lines[lineIndex];
		
		let indentAdjustment = this.view.lang.codeIntel?.indentAdjustmentAfterInsertion(document, line, lineIndex) || 0;
		
		if (indentAdjustment !== 0) {
			let {string: indentStr} = document.fileDetails.indentation;
			let {indentLevel} = line;
			let newIndentLevel = indentLevel + indentAdjustment;
			let oldIndentStr = indentStr.repeat(indentLevel);
			let newIndentStr = indentStr.repeat(newIndentLevel);
			
			let {
				edit,
			} = document.replaceSelection(s(c(lineIndex, 0), c(lineIndex, oldIndentStr.length)), newIndentStr);
			
			let apply = {
				edits: [edit],
				normalSelection: s(c(newSelection.start.lineIndex, newSelection.start.offset + (newIndentStr.length - oldIndentStr.length))),
			};
			
			this.applyAndAddHistoryEntry(apply);
			
			newBatchState = null;
		}
		
		this.view.updateSelectionEndCol();
		
		this.showCompletions();
		this.updateSnippetExpressions();
		this.setBatchState(newBatchState);
		
		return ["noClearCompletions"];
	},
	
	insertAstClipboard() {
		this.astMode.pasteFromNormalMode();
		
		this.updateSnippetExpressions();
	},
	
	cursorAfterSnippet() {
		if (!this.snippetSession) {
			return;
		}
		
		let {positions} = this.snippetSession;
		
		this.setSelectionFromNormalKeyboard(positions[positions.length - 1].selection);
		this.clearSnippetSession();
	},
	
	wrap() {
		this.astMode.commands.wrap();
	},
	
	unwrap() {
		this.astMode.commands.unwrap();
	},
	
	clearHilites() {
		this.find.clearHilites();
		
		return ["noScrollCursorIntoView"];
	},
};
