let Evented = require("utils/Evented");
let AstSelection = require("modules/utils/AstSelection");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

class Base extends Evented {
	constructor() {
		super();
		
		this.history = [];
		this.historyIndex = 0;
		this.historyIndexAtSave = 0;
		this.modified = false;
	}
	
	get lang() {
		return this.fileDetails.lang;
	}
	
	get string() {
		return this.source.string;
	}
	
	get lines() {
		return this.source.lines;
	}
	
	edit(selection, replaceWith) {
		selection = Selection.sort(selection);
		
		let currentStr = this.getSelectedText(selection);
		let {start, end} = selection;
		
		let prefix = this.lines[start.lineIndex].string.substr(0, start.offset);
		let suffix = this.lines[end.lineIndex].string.substr(end.offset);
		
		let insertLines = replaceWith.split(this.fileDetails.newline);
		
		insertLines[0] = prefix + insertLines[0];
		insertLines[insertLines.length - 1] += suffix;
		
		let newEndLineIndex = start.lineIndex + insertLines.length - 1;
		let lastLine = insertLines[insertLines.length - 1];
		let newSelection = s(start, c(newEndLineIndex, lastLine.length - suffix.length));
		
		return {
			selection,
			string: currentStr,
			replaceWith,
			newSelection,
		};
	}
	
	lineEdit(lineIndex, removeLinesCount, insertLines) {
		let {newline} = this.fileDetails;
		
		let endLineIndex = lineIndex + removeLinesCount;
		let insertString = insertLines.join(newline);
		let start;
		let end;
		
		/*
		removing/inserting at the last line needs special handling as the
		last line doesn't end with a newline
		*/
		
		if (lineIndex === this.lines.length) {
			start = c(lineIndex - 1, this.lines[this.lines.length - 1].string.length);
			
			if (insertLines.length > 0) {
				insertString = newline + insertString;
			}
		} else {
			start = c(lineIndex, 0);
		}
		
		if (endLineIndex === this.lines.length) {
			end = c(endLineIndex - 1, this.lines[endLineIndex - 1].string.length);
		} else {
			end = c(endLineIndex, 0);
			
			if (insertLines.length > 0) {
				insertString += newline;
			}
		}
		
		return this.edit(s(start, end), insertString);
	}
	
	astEdit(astSelection, insertLines) {
		let {startLineIndex, endLineIndex} = astSelection;
		
		return this.lineEdit(startLineIndex, endLineIndex - startLineIndex, insertLines);
	}
	
	apply(edit) {
		this.source.edit(edit);
		
		this.modified = true;
		
		this.throttledBackup();
		
		this.fire("edit", edit);
	}
	
	reverse(edit) {
		let {
			selection,
			string,
			newSelection,
			replaceWith,
		} = edit;
		
		return {
			selection: newSelection,
			string: replaceWith,
			newSelection: selection,
			replaceWith: string,
		};
	}
	
	reverseEdits(edits) {
		return [...edits].reverse().map(e => this.reverse(e));
	}
	
	applyEdits(edits) {
		for (let edit of edits) {
			this.apply(edit);
		}
	}
	
	applyAndAddHistoryEntry(edits) {
		let undo = this.reverseEdits(edits);
		
		this.applyEdits(edits);
		
		let entry = {
			undo,
			redo: edits,
		};
		
		if (this.historyIndex < this.history.length) {
			this.history.splice(this.historyIndex, this.history.length - this.historyIndex);
		}
		
		this.history.push(entry);
		this.historyIndex = this.history.length;
		
		return entry;
	}
	
	applyAndMergeWithLastHistoryEntry(edits) {
		let entry = this.lastHistoryEntry;
		
		this.applyEdits(edits);
		
		entry.redo = [...entry.redo, ...edits];
		entry.undo = [...this.reverseEdits(edits), ...entry.undo];
		
		return entry;
	}
	
	get lastHistoryEntry() {
		return this.history[this.history.length - 1];
	}
	
	undo() {
		if (this.historyIndex === 0) {
			return null;
		}
		
		let entry = this.history[this.historyIndex - 1];
		
		this.historyIndex--;
		this.applyEdits(entry.undo);
		
		if (this.historyIndex === this.historyIndexAtSave) {
			this.modified = false;
		}
		
		this.fire("undo", entry);
		
		return entry;
	}
	
	redo() {
		if (this.historyIndex === this.history.length) {
			return null;
		}
		
		let entry = this.history[this.historyIndex];
		
		this.historyIndex++;
		this.applyEdits(entry.redo);
		
		if (this.historyIndex === this.historyIndexAtSave) {
			this.modified = false;
		}
		
		this.fire("redo", entry);
		
		return entry;
	}
	
	replaceSelection(selection, string) {
		let edit = this.edit(selection, string);
		let newSelection = s(edit.newSelection.end);
		
		return {
			edit,
			newSelection,
		};
	}
	
	insert(selection, ch) {
		return this.replaceSelection(selection, ch);
	}
	
	move(fromSelection, toCursor) {
		let str = this.getSelectedText(fromSelection);
		let remove = this.edit(fromSelection, "");
		let insert = this.edit(s(toCursor), str);
		
		let newSelection = this.getSelectionContainingString(toCursor, str);
		
		newSelection = Selection.subtractEarlierSelection(newSelection, fromSelection);
		
		let edits;
		
		if (Cursor.isBefore(toCursor, fromSelection.start)) {
			edits = [remove, insert];
		} else {
			edits = [insert, remove];
		}
		
		return {
			edits,
			newSelection,
		};
	}
	
	indexFromCursor(cursor) {
		return this.source.indexFromCursor(cursor);
	}
	
	cursorFromIndex(index) {
		return this.source.cursorFromIndex(index);
	}
	
	getSelectedLines(astSelection) {
		return AstSelection.getSelectedLines(this.lines, astSelection);
	}
	
	getAstSelection(astSelection) {
		return AstSelection.linesToSelectionLines(this.getSelectedLines(astSelection));
	}
	
	getSelectedText(selection) {
		let {start, end} = Selection.sort(selection);
		let lines = this.lines.slice(start.lineIndex, end.lineIndex + 1);
		
		let str = lines.map(line => line.string).join(this.fileDetails.newline);
		let trimLeft = start.offset;
		let trimRight = lines[lines.length - 1].string.length - end.offset;
		
		return str.substring(trimLeft, str.length - trimRight);
	}
	
	getSelectionContainingString(cursor, str) {
		return Selection.containString(cursor, str, this.fileDetails.newline);
	}
	
	wordAtCursor(cursor) {
		let {lineIndex, offset} = cursor;
		
		if (offset === 0) {
			return null;
		}
		
		let line = this.lines[lineIndex];
		let stringToCursor = line.string.substr(0, offset).split("").reverse().join("");
		let match = stringToCursor.match(/^(\w+)/);
		
		return match?.[0].split("").reverse().join("") || null;
	}
	
	getLongestLineWidth() {
		let width = 0;
		
		for (let line of this.lines) {
			if (line.width > width) {
				width = line.width;
			}
		}
		
		return width;
	}
	
	cursorAtEnd() {
		return this.source.cursorAtEnd();
	}
	
	toString() {
		return this.string;
	}
}

module.exports = Base;
