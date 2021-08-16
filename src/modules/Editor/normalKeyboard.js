let Selection = require("../utils/Selection");
let Cursor = require("../utils/Cursor");
let findWordCompletions = require("../utils/findWordCompletions");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	up() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.up());
	},
	
	down() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.down());
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
	},
	
	pageDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.pageDown());
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
	},
	
	expandOrContractSelectionDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractDown());
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
	},
	
	expandOrContractSelectionPageDown() {
		this.setSelectionFromNormalKeyboard(this.view.Selection.expandOrContractPageDown());
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
	},
	
	enter() {
		let {document} = this;
		let {newline} = document.fileDetails;
		let {normalSelection: selection} = this.view;
		let {start} = Selection.sort(selection);
		let {lineIndex} = start;
		let line = document.lines[lineIndex];
		let {indentLevel} = line;
		
		if (this.view.lang.codeIntel?.shouldIndentOnNewline(line, document.lines, lineIndex, start)) {
			indentLevel++;
		}
		
		let indent = document.fileDetails.indentation.string.repeat(indentLevel);
		
		let {
			edit,
			newSelection,
		} = document.replaceSelection(selection, newline + indent);
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
		this.clearBatchState();
	},
	
	enterNoAutoIndent() {
		
	},
	
	backspace() {
		let selection = Selection.sort(this.view.normalSelection);
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
		
		let apply = {
			edits: [edit],
			normalSelection: newSelection,
		};
		
		if (this.batchState === "backspace" && newBatchState === "backspace") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		this.setBatchState(newBatchState);
	},
	
	delete() {
		let selection = Selection.sort(this.view.normalSelection);
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
		
		let apply = {
			edits: [edit],
			normalSelection: newSelection,
		};
		
		if (this.batchState === "delete" && newBatchState === "delete") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		this.setBatchState(newBatchState);
	},
	
	tab() {
		// TODO setSelectionFromNormalKeyboard (to update selection clipboard etc)
		if (this.view.Selection.isMultiline()) {
			// TODO indent/dedent selection
		} else if (this.snippetSession) {
			// snippet
			
			this.nextTabstop();
		} else {
			// tab
			
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
	},
	
	shiftTab() {
		// TODO
	},
	
	completeWord() {
		if (this.view.Selection.isFull()) {
			return;
		}
		
		this.inWordComplete = true;
		
		let {normalSelection} = this.view;
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
			
			this.applyAndAddHistoryEntry({
				edits: [edit],
				normalSelection: newSelection,
			});
			
			this.completeWordSession = {
				...this.completeWordSession,
				currentWord: nextWord,
				selection: s(selection.start, c(lineIndex, offset + nextWord.length)),
				index: newIndex,
			};
		} else {
			let index = this.document.indexFromCursor(cursor);
			let wordAtCursor = this.document.wordAtCursor(cursor);
			let words = findWordCompletions(this.document.string, wordAtCursor, index);
			
			if (words.length > 0) {
				let currentWord = words[0];
				let selection = s(c(lineIndex, offset - wordAtCursor.length), cursor);
				
				let {
					edit,
					newSelection,
				} = this.document.replaceSelection(selection, currentWord);
				
				this.applyAndAddHistoryEntry({
					edits: [edit],
					normalSelection: newSelection,
				});
				
				this.completeWordSession = {
					originalWord: wordAtCursor,
					currentWord,
					selection: s(selection.start, c(lineIndex, selection.start.offset + currentWord.length)),
					words,
					index: 0,
				};
			}
		}
		
		this.inWordComplete = false;
	},
	
	async cut() {
		// TODO line if not full selection?
		if (!this.view.Selection.isFull()) {
			return;
		}
		
		await platform.clipboard.write(this.getSelectedText());
		
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(this.view.normalSelection, "");
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
		this.clearBatchState();
	},
	
	async copy() {
		// TODO line if not full selection?
		if (!this.view.Selection.isFull()) {
			return;
		}
		
		await platform.clipboard.write(this.getSelectedText());
	},
	
	async paste() {
		let {
			edit,
			newSelection,
		} = this.document.replaceSelection(this.view.normalSelection, await platform.clipboard.read());
		
		this.applyAndAddHistoryEntry({
			edits: [edit],
			normalSelection: newSelection,
		});
		
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
		
		let apply = {
			edits: [edit],
			normalSelection: newSelection,
		};
		
		if (this.batchState === "typing") {
			this.applyAndMergeWithLastHistoryEntry(apply);
		} else {
			this.applyAndAddHistoryEntry(apply);
		}
		
		let line = document.lines[lineIndex];
		
		let indentAdjustment = this.view.lang.codeIntel?.indentAdjustmentAfterInsertion(line, document.lines, lineIndex) || 0;
		
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
		
		this.setBatchState(newBatchState);
	},
};
