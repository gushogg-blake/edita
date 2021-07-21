let Evented = require("../utils/Evented");
let _typeof = require("../utils/typeof");
let Selection = require("./utils/Selection");
let countRows = require("./utils/countRows");
let wrapLine = require("./wrapLine/wrapLine");
let unwrapLine = require("./wrapLine/unwrapLine");

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
		
		let removeString = removeLines.join(this.fileDetails.newline);
		let insertString = insertLines.join(this.fileDetails.newline);
		
		let start = removeLines.length > 0 ? removeLines[0].startIndex : this.string.length;
		let end = start + removeString.length;
		
		this.string = this.string.substr(0, start) + insertString + this.string.substr(end);
		
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
	
	insertCharacter(selection, ch) {
		return this.replaceSelection(selection, ch);
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
	
	parse() {
		console.time("parse");
		
		this.lines = this.lang.parse(this.string, this.fileDetails);
		
		console.timeEnd("parse");
	}
	
	wrapLines(measurements, screenWidth) {
		//for (let line of this.lines) {
		//	wrapLine(line, this.fileDetails.indentation, measurements, screenWidth);
		//}
	}
	
	unwrapLines() {
		//for (let line of this.lines) {
		//	unwrapLine(line);
		//}
	}
	
	countRows() {
		return countRows(this.lines);
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
