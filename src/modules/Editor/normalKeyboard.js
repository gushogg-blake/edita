let Selection = require("../utils/Selection");
let Cursor = require("../utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

module.exports = {
	up() {
		this.setNormalSelection(this.view.Selection.up());
	},
	
	down() {
		this.setNormalSelection(this.view.Selection.down());
	},
	
	left() {
		this.setNormalSelection(this.view.Selection.left());
		this.view.updateSelectionEndCol();
	},
	
	right() {
		this.setNormalSelection(this.view.Selection.right());
		this.view.updateSelectionEndCol();
	},
	
	pageUp() {
		this.setNormalSelection(this.view.Selection.pageUp());
	},
	
	pageDown() {
		this.setNormalSelection(this.view.Selection.pageDown());
	},
	
	end() {
		this.setNormalSelection(this.view.Selection.end());
		this.view.updateSelectionEndCol();
	},
	
	home() {
		this.setNormalSelection(this.view.Selection.home());
		this.view.updateSelectionEndCol();
	},
	
	wordLeft() {
		this.setNormalSelection(this.view.Selection.wordLeft());
		this.view.updateSelectionEndCol();
	},
	
	wordRight() {
		this.setNormalSelection(this.view.Selection.wordRight());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionUp() {
		this.setNormalSelection(this.view.Selection.expandOrContractUp());
	},
	
	expandOrContractSelectionDown() {
		this.setNormalSelection(this.view.Selection.expandOrContractDown());
	},
	
	expandOrContractSelectionLeft() {
		this.setNormalSelection(this.view.Selection.expandOrContractLeft());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionRight() {
		this.setNormalSelection(this.view.Selection.expandOrContractRight());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionPageUp() {
		this.setNormalSelection(this.view.Selection.expandOrContractPageUp());
	},
	
	expandOrContractSelectionPageDown() {
		this.setNormalSelection(this.view.Selection.expandOrContractPageDown());
	},
	
	expandOrContractSelectionEnd() {
		this.setNormalSelection(this.view.Selection.expandOrContractEnd());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionHome() {
		this.setNormalSelection(this.view.Selection.expandOrContractHome());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionWordLeft() {
		this.setNormalSelection(this.view.Selection.expandOrContractWordLeft());
		this.view.updateSelectionEndCol();
	},
	
	expandOrContractSelectionWordRight() {
		this.setNormalSelection(this.view.Selection.expandOrContractWordRight());
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
		
		if (document.lang.codeIntel?.shouldIndentOnNewline(line, document.lines, lineIndex, start)) {
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
	
	/*
	NOTE backspace and delete are identical except for backspace/delete
	and the offset check for newBatchState
	*/
	
	backspace() {
		let {offset} = this.view.normalSelection.start;
		
		let newBatchState = (
			this.view.Selection.isFull()
			|| offset === 0
		) ? null : "backspace";
		
		let result = this.document.backspace(this.view.normalSelection);
		
		if (result) {
			let {
				edit,
				newSelection,
			} = result;
			
			let apply = {
				edits: [edit],
				normalSelection: newSelection,
			};
			
			if (this.batchState === "backspace" && newBatchState === "backspace") {
				this.applyAndMergeWithLastHistoryEntry(apply);
			} else {
				this.applyAndAddHistoryEntry(apply);
			}
		}
		
		this.setBatchState(newBatchState);
	},
	
	delete() {
		let {lineIndex, offset} = this.view.normalSelection.start;
		
		let newBatchState = (
			this.view.Selection.isFull()
			|| offset === this.document.lines[lineIndex].string.length
		) ? null : "delete";
		
		let result = this.document.delete(this.view.normalSelection);
		
		if (result) {
			let {
				edit,
				newSelection,
			} = result;
			
			let apply = {
				edits: [edit],
				normalSelection: newSelection,
			};
			
			if (this.batchState === "delete" && newBatchState === "delete") {
				this.applyAndMergeWithLastHistoryEntry(apply);
			} else {
				this.applyAndAddHistoryEntry(apply);
			}
		}
		
		this.setBatchState(newBatchState);
	},
	
	tab() {
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
		
		let indentAdjustment = document.lang.codeIntel?.shouldAdjustIndentAfterInsertion(line, document.lines, lineIndex);
		
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
