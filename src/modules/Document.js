let Evented = require("../utils/Evented");
let Selection = require("./utils/Selection");
let countRows = require("./utils/countRows");
let wrapLine = require("./wrapLine/wrapLine");

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

function createLines(code) {
	return code.split("\n").map(createLine);
}

class Document extends Evented {
	constructor(code, lang) {
		super();
		
		this.lang = lang;
		
		this.lines = createLines(code);
		
		this.renderedUpTo = 0;
	}
	
	/*
	edit - accepts a starting line index, a number of lines to
	delete, and a string of code to add (which can contain newlines)
	*/
	
	edit(lineIndex, removeLines, insertString) {
		let insertLines = insertString.split("\n").map(createLine);
		
		this.lines.splice(lineIndex, removeLines, ...insertLines);
		
		this.fire("edit", {
			lineIndex,
			removeLines,
			insertString,
			insertLines,
		});
	}
	
	replaceSelection(selection, string) {
		let {start, end} = Selection.sort(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		this.edit(startLineIndex, endLineIndex - startLineIndex + 1, prefix + string + suffix);
	}
	
	insertCharacter(selection, ch) {
		let {start, end} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		this.replaceSelection(selection, ch);
		
		return {
			start: [lineIndex, offset + 1],
			end: [lineIndex, offset + 1],
		};
	}
	
	backspace(selection) {
		let {start, end} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		if (Selection.isFull(selection)) {
			this.replaceSelection(selection, "");
			
			return {
				start: [lineIndex, offset],
				end: [lineIndex, offset],
			};
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
				
				return {
					start: [prevLineIndex, prevLineString.length],
					end: [prevLineIndex, prevLineString.length],
				};
			} else {
				// deleting a character within the line
				
				let {string} = line;
				
				this.edit(
					lineIndex,
					1,
					string.substr(0, offset - 1) + string.substr(offset),
				);
				
				return {
					start: [lineIndex, offset - 1],
					end: [lineIndex, offset - 1],
				};
			}
		}
	}
	
	delete(selection) {
		let {start, end} = Selection.sort(selection);
		let [lineIndex, offset] = start;
		
		if (Selection.isFull(selection)) {
			this.replaceSelection(selection, "");
			
			return {
				start: [lineIndex, offset],
				end: [lineIndex, offset],
			};
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
				
				return {
					start: [lineIndex, line.string.length],
					end: [lineIndex, line.string.length],
				};
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
		
		this.replaceSelection(selection, "\n");
		
		return {
			start: [lineIndex + 1, 0],
			end: [lineIndex + 1, 0],
		};
	}
	
	parse(prefs) {
		this.lang.parse(prefs, this.lines);
	}
	
	wrapLines(prefs, measurements, screenWidth) {
		for (let line of this.lines) {
			wrapLine(prefs.wrap, line, measurements, screenWidth);
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
}

module.exports = Document;
