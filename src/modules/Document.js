let Evented = require("../utils/Evented");
let _typeof = require("../utils/typeof");
let Selection = require("./utils/Selection");
let countRows = require("./utils/countRows");
let wrapLine = require("./wrapLine/wrapLine");
let unwrapLine = require("./wrapLine/unwrapLine");

function createLine(string) {
	return {
		string,
		trimmed: undefined,
		commands: [],
		endState: null,
		lastUsedCacheKey: null,
		cachedCommands: {},
		width: undefined,
		height: undefined,
		indentLevel: 0,
		indentOffset: 0,
		wrappedLines: undefined,
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
		
		//this.parsedUpTo = 0;
	}
	
	/*
	edit - accepts a starting line index, a number of lines to
	delete, and a string of code to add (which can contain newlines)
	*/
	
	edit(lineIndex, removeLines, insertLines) {
		if (_typeof(insertLines) === "String") {
			insertLines = insertLines.split(this.fileDetails.newline);
		} else if (_typeof(insertLines) !== "Array") {
			insertLines = [];
		}
		
		let insertedLines = insertLines;
		let removedLines = this.lines.slice(lineIndex, lineIndex + removeLines).map(line => line.string);
		
		this.lines.splice(lineIndex, removeLines, ...insertLines.map(createLine));
		
		this.fire("edit", {
			lineIndex,
			removedLines,
			insertedLines,
		});
		
		return {
			removedLines,
			insertedLines,
		};
	}
	
	replaceSelection(selection, string) {
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		let {
			removedLines,
			insertedLines,
		} = this.edit(
			startLineIndex,
			endLineIndex - startLineIndex + 1,
			prefix + string + suffix,
		);
		
		let newEndLineIndex = startLineIndex + insertedLines.length - 1;
		let lastLine = insertedLines[insertedLines.length - 1];
		let newSelection = Selection.s([newEndLineIndex, lastLine.length - suffix.length]);
		
		return {
			lineIndex: startLineIndex,
			removedLines,
			insertedLines,
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
				
				let {
					removedLines,
					insertedLines,
				} = this.edit(lineIndex - 1, 2, prevLineString + line.string);
				
				return {
					removedLines,
					insertedLines,
					newSelection: Selection.s([prevLineIndex, prevLineString.length]),
				};
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				let {
					removedLines,
					insertedLines,
				} = this.edit(
					lineIndex,
					1,
					string.substr(0, offset - 1) + string.substr(offset),
				);
				
				return {
					lineIndex,
					removedLines,
					insertedLines,
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
				
				let {
					insertedLines,
					removedLines,
				} = this.edit(lineIndex, 2, line.string + nextLineString);
				
				return {
					lineIndex,
					insertedLines,
					removedLines,
					newSelection: Selection.s([lineIndex, line.string.length]),
				};
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				let {
					insertedLines,
					removedLines,
				} = this.edit(
					lineIndex,
					1,
					string.substr(0, offset) + string.substr(offset + 1),
				);
				
				return {
					lineIndex,
					insertedLines,
					removedLines,
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
	
	//getSelectedLines(astSelection) {
	//	let [startLineIndex, endLineIndex] = astSelection;
	//	
	//	return this.lines.slice(startLineIndex, endLineIndex).map(line => line.string);
	//}
	
	parse(prefs) {
		this.lang.parse(this.lines, prefs, this.fileDetails);
	}
	
	wrapLines(measurements, screenWidth) {
		for (let line of this.lines) {
			wrapLine(line, this.fileDetails.indentation, measurements, screenWidth);
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
