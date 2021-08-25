let Evented = require("utils/Evented");
let _typeof = require("utils/typeof");
let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let Line = require("./Line");

let {s} = Selection;
let {c} = Cursor;

class Document extends Evented {
	constructor(code, path) {
		super();
		
		this.string = code;
		this.path = path;
		this.updateFileDetails();
		
		this.history = [];
		this.historyIndex = 0;
		this.modified = false;
		this.historyIndexAtSave = 0;
		
		this.parse();
	}
	
	edit(selection, replaceWith) {
		let currentStr = this.getSelectedText(selection);
		
		let {start, end} = Selection.sort(selection);
		
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
		let removeLines = this.lines.slice(lineIndex, endLineIndex);
		
		let insertString = insertLines.join(newline);
		let start;
		let end;
		
		/*
		removing/inserting at the last line needs special handling as the
		last line doesn't end with a newline
		*/
		
		if (lineIndex === this.lines.length) {
			start = c(lineIndex - 1, this.lines[this.lines.length - 1].string.length);
			
			insertString = newline + insertString;
		} else {
			start = c(lineIndex, 0);
		}
		
		if (endLineIndex === this.lines.length) {
			end = c(endLineIndex - 1, this.lines[endLineIndex - 1].string.length);
		} else {
			end = c(endLineIndex, 0);
			
			if (insertString) {
				insertString += newline;
			}
		}
		
		return this.edit(s(start, end), insertString);
	}
	
	apply(edit) {
		let {
			selection,
			string,
			replaceWith,
		} = edit;
		
		let {start} = Selection.sort(selection);
		let index = this.indexFromCursor(start);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		this.parse();
		
		this.modified = true;
		
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
	
	/*
	apply later edits first so that selections don't need adjusting
	*/
	
	sortEdits(edits) {
		return [...edits].sort(function(a, b) {
			if (Selection.isBefore(a.selection, b.selection)) {
				return 1;
			} else {
				return -1;
			}
		});
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
		edits = this.sortEdits(edits);
		
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
		edits = this.sortEdits(edits);
		
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
	
	updateFileDetails() {
		this.fileDetails = base.getFileDetails(this.string, this.path);
		this.mainLang = this.fileDetails.lang;
	}
	
	async save() {
		await platform.save(this.path, this.toString());
		
		this.updateFileDetails();
		this.modified = false;
		this.historyIndexAtSave = this.historyIndex;
		
		this.fire("save");
	}
	
	saveAs(path) {
		this.path = path;
		
		return this.save();
	}
	
	parse() {
		console.time("parse");
		
		this.lines = [];
		
		let {fileDetails} = this;
		let lineStrings = this.string.split(fileDetails.newline);
		let lineStartIndex = 0;
		
		for (let lineString of lineStrings) {
			this.lines.push(new Line(lineString, fileDetails, lineStartIndex));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
		}
		
		let lastIndex = this.lines.length - 1;
		let lastLine = this.lines[lastIndex];
		
		this.mainLangRange = {
			lang: this.mainLang,
			
			range: {
				startIndex: 0,
				endIndex: this.string.length,
				selection: s(c(0, 0), c(lastIndex, lastLine.string.length)),
			},
			
			children: [],
		};
		
		try {
			this.mainLang.parse(this.string, this.lines, this.mainLangRange);
		} catch (e) {
			console.error("Parse error");
			console.error(e);
		}
		
		console.timeEnd("parse");
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
		
		return {
			edits: [remove, insert],
			newSelection,
		};
	}
	
	langFromCursor(cursor, langRange=this.mainLangRange) {
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return this.mainLang;
		}
		
		let {selection} = langRange.range;
		
		if (!Selection.charIsWithinSelection(selection, cursor)) {
			return null;
		}
		
		for (let childLangRange of langRange.children) {
			let langFromChild = this.langFromCursor(cursor, childLangRange);
			
			if (langFromChild) {
				return langFromChild;
			}
		}
		
		return langRange.lang;
	}
	
	langFromLineIndex(lineIndex) {
		let line = this.lines[lineIndex];
		
		return this.langFromCursor(c(lineIndex, line.indentOffset));
	}
	
	langFromAstSelection(astSelection) {
		let {startLineIndex} = astSelection;
		let line = this.lines[startLineIndex];
		
		return this.langFromCursor(c(startLineIndex, line.indentOffset));
	}
	
	indexFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let index = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			index += this.lines[i].string.length + this.fileDetails.newline.length;
		}
		
		index += offset;
		
		return index;
	}
	
	cursorFromIndex(index) {
		let lineIndex = 0;
		
		for (let line of this.lines) {
			if (index <= line.string.length) {
				return c(lineIndex, index);
			}
			
			lineIndex++;
			index -= line.string.length + this.fileDetails.newline.length;
		}
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
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
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
	
	toString() {
		return this.string;
	}
}

module.exports = Document;
