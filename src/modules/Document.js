let Evented = require("../utils/Evented");
let _typeof = require("../utils/typeof");
let Selection = require("./utils/Selection");
let Cursor = require("./utils/Cursor");
let Line = require("./Line");

/*
Editing

editing is a two-step process: generating an edit and then applying it.

There are two ways to generate an edit, linewise (lineEdit()) and stringwise
(stringEdit()).  The edit objects created by each have the same fields, but
string edits are more fine-grained in that they can describe exact edits within
a line.
*/

class Document extends Evented {
	constructor(code, path, fileDetails) {
		super();
		
		this.string = code;
		this.path = path;
		this.fileDetails = fileDetails;
		this.lang = fileDetails.lang;
		
		this.history = [];
		this.historyIndex = 0;
		this.modified = false;
		this.historyIndexAtSave = 0;
		
		this.parse();
	}
	
	/*
	edit - accepts a starting line index, a number of lines to
	delete, and a string of code to add (which can contain newlines)
	
	returns a description of the edit (use apply() to actually perform the
	edit)
	*/
	
	lineEdit(lineIndex, removeLinesCount, insertLines) {
		let {newline} = this.fileDetails;
		
		if (_typeof(insertLines) === "String") {
			insertLines = insertLines.split(newline);
		} else if (_typeof(insertLines) !== "Array") {
			insertLines = [];
		}
		
		let removeLines = this.lines.slice(lineIndex, lineIndex + removeLinesCount).map(line => line.string);
		
		let index = this.indexFromCursor([lineIndex, 0]);
		let removeString = removeLines.join(newline);
		let insertString = insertLines.join(newline);
		let hasLineEnding = this.string.substr(index + removeString.length, newline.length) === newline;
		
		if (hasLineEnding) {
			removeString += newline;
		}
		
		if (hasLineEnding || removeLinesCount === 0) {
			insertString += newline;
		}
		
		return {
			index,
			removeString,
			insertString,
			lineIndex,
			removeLines,
			insertLines,
		};
	}
	
	stringEdit(selection, replaceWith) {
		let index = this.indexFromCursor(cursor);
		
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		let removeLines = this.lines.slice(startLineIndex, endLineIndex - startLineIndex + 1).map(line => line.string);
		let insertLines = (prefix + replaceWith + suffix).split(this.fileDetails.newline);
		
		return {
			index,
			removeString,
			insertString,
			lineIndex,
			removeLines,
			insertLines,
		};
	}
	
	apply(edit) {
		let {
			lineIndex,
			removeLines,
			insertLines,
		} = edit;
		
		// NOTE splicing/joining lines may not be most efficient way of editing
		// doesn't seem too bad though and manipulating the string manually is
		// surprisingly complex (4d3eb5 seems to work but messes up the undo
		// history)
		
		let {newline} = this.fileDetails;
		
		let lineStrings = this.lines.map(l => l.string);
		
		lineStrings.splice(lineIndex, removeLines.length, ...insertLines);
		
		this.string = lineStrings.join(newline);
		
		this.parse();
		
		this.modified = true;
		
		this.fire("edit");
	}
	
	reverse(edit) {
		let {
			lineIndex,
			removeLines,
			insertLines,
		} = edit;
		
		return {
			lineIndex,
			removeLines: insertLines,
			insertLines: removeLines,
		};
	}
	
	applyEdits(edits) {
		for (let edit of edits) {
			this.apply(edit);
		}
	}
	
	applyAndAddHistoryEntry(edits) {
		// sort by line index descending so that line indexes don't need adjusting
		edits = [...edits].sort(function(a, b) {
			if (a.lineIndex > b.lineIndex) {
				return -1;
			} else if (b.lineIndex > a.lineIndex) {
				return 1;
			} else {
				return 0;
			}
		});
		
		let undo = [...edits].reverse().map(e => this.reverse(e));
		
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
	
	// NOTE only works with same-line changes e.g. typing/deleting within a line
	
	applyAndMergeWithLastHistoryEntry(edits) {
		let entry = this.lastHistoryEntry;
		
		this.applyEdits(edits);
		
		entry.redo = edits;
		
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
	
	async save() {
		await platform.save(this.path, this.toString());
		
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
		
		try {
			this.lang.parse(this.string, this.lines, this.fileDetails);
		} catch (e) {
			console.error("Parse error");
			console.error(e);
		}
		
		console.timeEnd("parse");
	}
	
	replaceSelection(selection, string) {
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		let edit = this.stringEdit(
			startLineIndex,
			endLineIndex - startLineIndex + 1,
			prefix + string + suffix,
		);
		
		let {
			removeLines,
			insertLines,
		} = edit;
		
		let newEndLineIndex = startLineIndex + insertLines.length - 1;
		let lastLine = insertLines[insertLines.length - 1];
		let newSelection = Selection.s([newEndLineIndex, lastLine.length - suffix.length]);
		
		return {
			edit,
			newSelection,
		};
	}
	
	insert(selection, ch) {
		return this.replaceSelection(selection, ch);
	}
	
	move(fromSelection, toCursor) {
		let {start, end} = Selection.sort(fromSelection);
		let [fromStartLineIndex, fromStartOffset] = start;
		let [fromEndLineIndex, fromEndOffset] = end;
		let [toLineIndex, toOffset] = toCursor;
		
		if (toLineIndex === fromStartLineIndex || toLineIndex === fromEndLineIndex) {
			if (fromStartLineIndex === fromEndLineIndex) {
				// moving single line onto same line - single edit
				
				let {string} = this.lines[toLineIndex];
				let selectedText = string.substring(fromStartOffset, fromEndOffset);
				let withSelectionRemoved = string.substr(0, fromStartOffset) + string.substr(fromEndOffset);
				let length = fromEndOffset - fromStartOffset;
				let insertOffset = toOffset > fromEndOffset ? toOffset - length : toOffset;
				let newString = withSelectionRemoved.substr(0, insertOffset) + selectedText + withSelectionRemoved.substr(insertOffset);
				
				return {
					edits: [this.edit(toLineIndex, 1, newString)],
					
					newSelection: {
						start: [toLineIndex, insertOffset],
						end: [toLineIndex, insertOffset + length],
					},
				};
			} else {
				// moving multiline onto same line - header & footer edits
				// (moving a string from the header to the footer or vice versa)
				
				let moveFromFooterToHeader = "";
				
				let header = this.lines[fromStartLineIndex].string;
				let footer = this.lines[fromEndLineIndex].string;
				
				if (toOffset < fromStartOffset) {
					let diff = -(toOffset - fromStartOffset);
					let moveStr = header.substr(toOffset, diff);
					let newHeader = header.substr(0, toOffset) + header.substr(toOffset + diff);
					let newFooter = footer.substr(0, fromEndOffset) + moveStr + footer.substr(fromEndOffset);
					
					return {
						edits: [
							this.edit(fromStartLineIndex, 1, newHeader),
							this.edit(fromEndLineIndex, 1, newFooter),
						],
						
						newSelection: {
							start: [fromStartLineIndex, toOffset],
							end: [fromEndLineIndex, fromEndOffset],
						},
					};
				} else {
					let diff = toOffset - fromEndOffset;
					let moveStr = footer.substr(fromEndOffset, diff);
					let newHeader = header.substr(0, fromStartOffset) + moveStr + header.substr(fromStartOffset);
					let newFooter = footer.substr(0, fromEndOffset) + footer.substr(fromEndOffset + diff);
					
					return {
						edits: [
							this.edit(fromStartLineIndex, 1, newHeader),
							this.edit(fromEndLineIndex, 1, newFooter),
						],
						
						newSelection: {
							start: [fromStartLineIndex, fromStartOffset + diff],
							end: [fromEndLineIndex, fromEndOffset],
						},
					};
				}
			}
		} else {
			// moving single line/multiline somewhere else
			
			let toCursorAdjusted = toCursor;
			
			if (toLineIndex > fromEndLineIndex) {
				toCursorAdjusted = [toLineIndex - (fromEndLineIndex - fromStartLineIndex), toOffset];
			}
			
			let newSelectionStart = toCursorAdjusted;
			let [newSelectionStartLineIndex, newSelectionStartOffset] = newSelectionStart;
			let newSelectionEndLineIndex = newSelectionStartLineIndex + (fromEndLineIndex - fromStartLineIndex);
			let newSelectionEndOffset;
			
			if (fromStartLineIndex === fromEndLineIndex) {
				newSelectionEndOffset = newSelectionStartOffset + (fromEndOffset - fromStartOffset);
			} else {
				newSelectionEndOffset = fromEndOffset;
			}
			
			let insertEdit = this.insert(Selection.s(toCursor), this.getSelectedText(fromSelection)).edit;
			let [toLineIndexAdjusted] = toCursorAdjusted;
			
			insertEdit.lineIndex = toLineIndexAdjusted;
			
			return {
				edits: [
					this.delete(fromSelection).edit,
					insertEdit,
				],
				
				newSelection: {
					start: newSelectionStart,
					end: [newSelectionEndLineIndex, newSelectionEndOffset],
				},
			};
		}
	}
	
	backspace(selection) {
		if (Selection.isFull(selection)) {
			return this.replaceSelection(selection, "");
		}
		
		let {start} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		if (lineIndex === 0 && offset === 0) {
			return null;
		}
		
		let end;
		
		if (offset === 0) {
			end = [lineIndex - 1, this.lines[lineIndex - 1].string.length];
		} else {
			end = [lineIndex, offset - 1];
		}
		
		return {
			edit: this.stringEdit(Selection.s(start, end), ""),
			newSelection: Selection.s(end),
		};
	}
	
	delete(selection) {
		if (Selection.isFull(selection)) {
			return this.replaceSelection(selection, "");
		}
		
		let {start} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		let line = this.lines[lineIndex];
		
		if (lineIndex === this.lines.length - 1 && offset === line.string.length) {
			return null;
		}
		
		let end;
		
		if (offset === line.string.length) {
			end = [lineIndex + 1, 0];
		} else {
			end = [lineIndex, offset + 1];
		}
		
		return {
			edit: this.stringEdit(Selection.s(start, end), ""),
			newSelection: Selection.s(end),
		};
	}
	
	insertNewline(selection) {
		let {start} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		let line = this.lines[lineIndex];
		
		let indentLevel = line.indentLevel;
		
		if (
			offset === line.string.length
			&& line.openers.length > 0
		) {
			indentLevel++;
		}
		
		let indent = this.fileDetails.indentation.string.repeat(indentLevel);
		
		return this.replaceSelection(selection, this.fileDetails.newline + indent);
	}
	
	indexFromCursor(cursor) {
		let [lineIndex, offset] = cursor;
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
				return [lineIndex, index];
			}
			
			lineIndex++;
			index -= line.string.length + this.fileDetails.newline.length;
		}
	}
	
	getSelectedText(selection) {
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		let lines = this.lines.slice(startLineIndex, endLineIndex + 1);
		
		let str = lines.map(line => line.string).join(this.fileDetails.newline);
		let trimLeft = startOffset;
		let trimRight = lines[lines.length - 1].string.length - endOffset;
		
		return str.substring(trimLeft, str.length - trimRight);
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
