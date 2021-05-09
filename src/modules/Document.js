let Evented = require("../utils/Evented");
let Selection = require("./utils/Selection");
let countRows = require("./utils/countRows");
let wrapLine = require("./wrapLine/wrapLine");
let unwrapLine = require("./wrapLine/unwrapLine");

function createLine(string) {
	return {
		string,
		endState: null,
		lastUsedCacheKey: null,
		cachedCommands: {},
		width: undefined,
		height: undefined,
		wrappedLines: undefined,
		wrapIndentCols: undefined,
	};
}

function createLines(code, newline) {
	return code.split(newline).map(createLine);
}

class Document extends Evented {
	constructor(code, fileDetails) {
		super();
		
		this.lang = fileDetails.lang;
		this.fileDetails = fileDetails;
		
		this.lines = createLines(code, fileDetails.newline);
		
		this.renderedUpTo = 0;
	}
	
	/*
	edit - accepts a starting line index, a number of lines to
	delete, and a string of code to add (which can contain newlines)
	*/
	
	edit(lineIndex, removeLines, insertString) {
		let insertLines = insertString.split(this.fileDetails.newline).map(createLine);
		
		let removedLines = this.lines.slice(lineIndex, lineIndex + removeLines);
		
		this.lines.splice(lineIndex, removeLines, ...insertLines);
		
		this.fire("edit", {
			lineIndex,
			removeLines,
			insertString,
			insertLines,
		});
		
		return {
			removedLines,
			insertedLines: insertLines,
		};
	}
	
	replaceSelection(selection, string) {
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		let {insertedLines} = this.edit(
			startLineIndex,
			endLineIndex - startLineIndex + 1,
			prefix + string + suffix,
		);
		
		let newEndLineIndex = startLineIndex + insertedLines.length - 1;
		let lastLine = insertedLines[insertedLines.length - 1];
		
		return Selection.s([newEndLineIndex, lastLine.string.length - suffix.length]);
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
					return selection;
				}
				
				let prevLineIndex = lineIndex - 1;
				let prevLineString = this.lines[prevLineIndex].string;
				
				this.edit(lineIndex - 1, 2, prevLineString + line.string);
				
				return Selection.s([prevLineIndex, prevLineString.length]);
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				this.edit(
					lineIndex,
					1,
					string.substr(0, offset - 1) + string.substr(offset),
				);
				
				return Selection.s([lineIndex, offset - 1]);
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
					return selection;
				}
				
				let nextLineIndex = lineIndex + 1;
				let nextLineString = this.lines[nextLineIndex].string;
				
				this.edit(lineIndex, 2, line.string + nextLineString);
				
				return Selection.s([lineIndex, line.string.length]);
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				this.edit(
					lineIndex,
					1,
					string.substr(0, offset) + string.substr(offset + 1),
				);
				
				return selection;
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
			&& this.lang.codeIntel.getOpenersAndClosersOnLine(line).openers.length > 0
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
	
	parse(prefs) {
		this.lang.parse(this.lines, prefs, this.fileDetails);
	}
	
	wrapLines(measurements, screenWidth) {
		for (let line of this.lines) {
			wrapLine(line, measurements, screenWidth);
		}
	}
	
	unwrapLines() {
		for (let line of this.lines) {
			unwrapLine(line);
		}
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
		return this.lines.map(line => line.string).join(this.fileDetails.newline);
	}
}

module.exports = Document;
