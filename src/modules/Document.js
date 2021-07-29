let Evented = require("../utils/Evented");
let _typeof = require("../utils/typeof");
let Selection = require("./utils/Selection");
let Cursor = require("./utils/Cursor");
let find = require("./find");
let Line = require("./Line");

class Document extends Evented {
	constructor(code, fileDetails) {
		super();
		
		this.string = code;
		this.fileDetails = fileDetails;
		this.lang = fileDetails.lang;
		
		this.parse();
	}
	
	/*
	edit - accepts a starting line index, a number of lines to
	delete, and a string of code to add (which can contain newlines)
	
	returns a description of the edit (use apply() to actually perform the
	edit)
	*/
	
	edit(lineIndex, removeLinesCount, insertLines) {
		if (_typeof(insertLines) === "String") {
			insertLines = insertLines.split(this.fileDetails.newline);
		} else if (_typeof(insertLines) !== "Array") {
			insertLines = [];
		}
		
		let removeLines = this.lines.slice(lineIndex, lineIndex + removeLinesCount).map(line => line.string);
		
		return {
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
		
		this.fire("edit", {
			lineIndex,
			removedLines: removeLines,
			insertedLines: insertLines,
		});
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
		
		let edit = this.edit(
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
	
	/*
	NOTE some of these should probs be moved to Editor or an Editing util
	*/
	
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
		let {start, end} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		if (Selection.isFull(selection)) {
			return this.replaceSelection(selection, "");
		} else {
			let line = this.lines[lineIndex];
			
			if (offset === 0) {
				// deleting the newline, so join with the prev line if there is one
				
				if (lineIndex === 0) {
					return null;
				}
				
				let prevLineIndex = lineIndex - 1;
				let prevLineString = this.lines[prevLineIndex].string;
				
				return {
					edit: this.edit(lineIndex - 1, 2, prevLineString + line.string),
					newSelection: Selection.s([prevLineIndex, prevLineString.length]),
				};
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				return {
					edit: this.edit(
						lineIndex,
						1,
						string.substr(0, offset - 1) + string.substr(offset),
					),
					
					newSelection: Selection.s([lineIndex, offset - 1]),
				};
			}
		}
	}
	
	delete(selection) {
		let {start, end} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		if (Selection.isFull(selection)) {
			return this.replaceSelection(selection, "");
		} else {
			let line = this.lines[lineIndex];
			
			if (offset === line.string.length) {
				// deleting the newline, so join with the next line if there is one
				
				if (lineIndex === this.lines.length - 1) {
					return null;
				}
				
				let nextLineIndex = lineIndex + 1;
				let nextLineString = this.lines[nextLineIndex].string;
				
				return {
					edit: this.edit(lineIndex, 2, line.string + nextLineString),
					newSelection: Selection.s([lineIndex, line.string.length]),
				};
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				return {
					edit: this.edit(
						lineIndex,
						1,
						string.substr(0, offset) + string.substr(offset + 1),
					),
					
					newSelection: selection,
				};
			}
		}
	}
	
	insertNewline(selection) {
		let {start, end} = Selection.sort(selection);
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
	
	/*
	return a generator that yields find results with replace functions that
	modify the document
	
	the replacement is done in two stages, one that generates an edit and one
	that applies it and updates the underlying generator (this is needed to
	advance the search starting index to the end of the replacement)
	*/
	
	*findGenerator(search, type, caseMode, startIndex) {
		let generator = find(this.string, search, type, caseMode, startIndex);
		
		for (let {index, match, groups, replace} of generator) {
			let cursor = this.cursorFromIndex(index);
			
			let selection = {
				start: cursor,
				end: this.cursorFromIndex(index + match.length),
			};
			
			yield {
				index,
				cursor,
				selection,
				match,
				groups,
				
				getReplaceEdit(replaceWith) {
					return this.replaceSelection(selection, replaceWith);
				},
				
				replace(replaceWith, edit) {
					this.apply(edit);
					
					replace(replaceWith);
				},
			};
		}
	}
	
	find(search, type, caseMode, startCursor=[0, 0]) {
		let all = [...this.findGenerator(search, type, caseMode)];
		let startIndex = this.indexFromCursor(startCursor);
		
		return {
			all,
			generator: this.findGenerator(search, type, caseMode, startIndex),
		};
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
