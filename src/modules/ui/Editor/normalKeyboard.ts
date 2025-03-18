import _typeof from "utils/typeof";
import Selection, {s} from "modules/core/Selection";
import Cursor, {c} from "modules/core/Cursor";
import normaliseNewlines from "modules/utils/normaliseNewlines";

export default {
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
		
		return ["noScrollCursorIntoView"];
	},
	
	enter() {
		let {document, normalSelection: selection} = this;
		let {newline, indentation} = document.format;
		let {left} = selection;
		let {lineIndex} = left;
		let line = document.lines[lineIndex];
		let {indent, indentLevel} = line;
		let indentIntel = this.view.lang.codeIntel?.indentOnNewline(document, line, left);
		
		if (indentIntel) {
			if (_typeof(indentIntel) === "String") { // absolute
				indent = indentIntel;
			} else if (_typeof(indentIntel) === "Number") { // relative
				indent = indentation.string.repeat(indentLevel + indentIntel);
			} else { // true, add one
				indent = indentation.string.repeat(indentLevel + 1);
			}
		}
		
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
		let {newline, indentation} = document.format;
		let {lineIndex} = normalSelection.left;
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
		let {newline, indentation} = document.format;
		let {lineIndex} = normalSelection.left;
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
		let selection = this.normalSelection.sort();
		let {start} = selection;
		let {lineIndex, offset} = start;
		let isFull = selection.isFull();
		
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
		let selection = this.normalSelection.sort();
		let {start} = selection;
		let {lineIndex, offset} = start;
		let isFull = selection.isFull();
		
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
	
	deleteWordLeft() {
		let isFull = this.normalSelection.isFull();
		let selection = isFull ? this.normalSelection : this.view.Selection.expandOrContractWordLeft();
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(selection, "");
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	deleteWordRight() {
		let isFull = this.normalSelection.isFull();
		let selection = isFull ? this.normalSelection : this.view.Selection.expandOrContractWordRight();
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(selection, "");
		
		let edits = [edit];
		
		this.applyAndAddHistoryEntry({
			edits,
			normalSelection: newSelection,
			snippetSession: this.adjustSnippetSession(edits),
		});
		
		this.updateSnippetExpressions();
		this.clearBatchState();
	},
	
	tab() {
		let flags;
		let {document, normalSelection} = this;
		let {start} = normalSelection;
		let snippet = null;
		
		if (!normalSelection.isFull()) {
			let {left} = document.wordAtCursor(start);
			
			if (left) {
				snippet = platform.snippets.findByLangAndName(document.langFromCursor(start), left);
			}
		}
		
		if (this.snippetSession && !this.snippetSessionHasMoreTabstops()) {
			this.clearSnippetSession();
		}
		
		let insertSnippet = false;
		
		if (snippet && !this.completions) {
			if (this.snippetSession) {
				let {insertNestedSnippets} = base.prefs;
				
				insertSnippet = (
					insertNestedSnippets === "always"
					|| (
						insertNestedSnippets === "blankLines"
						&& document.lines[start.lineIndex].trimmed === snippet.name
					)
				);
			} else {
				insertSnippet = true;
			}
		}
		
		if (insertSnippet) {
			this.insertSnippet(snippet, snippet.name);
		} else if (this.completions) {
			this.acceptSelectedCompletion();
		} else if (this.snippetSession) {
			this.nextTabstop();
		} else if (this.astMode.multiStepCommandWaitingForReturnToAstMode) {
			this.astMode.multiStepCommandReturnToAstMode();
		} else if (this.normalSelection.isMultiline()) {
			this.indentSelection();
			
			flags = ["noScrollCursorIntoView"];
		} else {
			this.insertTab();
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
		this.wordCompletion.completeWord();
	},
	
	completeWordPrevious() {
		this.wordCompletion.previous();
	},
	
	cut() {
		// TODO line if not full selection
		if (!this.normalSelection.isFull()) {
			return;
		}
		
		let str = this.getSelectedText();
		
		platform.clipboard.write(str);
		
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
		
		this.fire("cut", str);
	},
	
	copy() {
		let str;
		
		if (this.normalSelection.isFull()) {
			str = this.getSelectedText();
		} else {
			if (base.getPref("copyLineIfSelectionNotFull")) {
				str = this.document.lines[this.normalSelection.start.lineIndex].string;
			} else {
				return;
			}
		}
		
		platform.clipboard.write(str);
		
		this.fire("copy", str);
		
		return ["noScrollCursorIntoView"];
	},
	
	paste(str) {
		str = normaliseNewlines(str, this.document.format.newline);
		
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
	
	pasteAndIndent(str) {
		//let {document} = this;
		//let {newline} = document.format;
		//
		//str = normaliseNewlines(str, newline);
		//
		//let lines = 
		//let {indentLevel} = this.document.lines[this.view.normalSelection.start.lineIndex];
		//
		
		// TODO use LSP for this
	},
	
	insert(key) {
		let newBatchState = this.normalSelection.isFull() ? null : "typing";
		
		let {document} = this;
		let {normalSelection: selection} = this.view;
		let {lineIndex} = selection.left;
		
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
		
		let indentAdjustment = this.view.lang.codeIntel?.indentAdjustmentAfterInsertion(document, line, newSelection.start) || 0;
		
		if (indentAdjustment !== 0) {
			let {string: indentStr} = document.format.indentation;
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
		
		this.setSelectionFromNormalKeyboard(positions.at(-1).selection);
		this.clearSnippetSession();
	},
	
	wrap() {
		this.astMode.commands.wrap();
	},
	
	unwrap() {
		this.doAstManipulation("unwrap");
	},
	
	clearHilites() {
		this.view.setNormalHilites([]);
		
		return ["noScrollCursorIntoView"];
	},
};
