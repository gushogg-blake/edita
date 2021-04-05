let Evented = require("../utils/Evented");
let wrapLine = require("./wrapLine/wrapLine");
let sortSelection = require("./utils/sortSelection");

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
		let {start, end} = sortSelection(selection);
		let [startLineIndex, startOffset] = start;
		let [endLineIndex, endOffset] = end;
		
		let prefix = this.lines[startLineIndex].string.substr(0, startOffset);
		let suffix = this.lines[endLineIndex].string.substr(endOffset);
		
		this.edit(startLineIndex, endLineIndex - startLineIndex + 1, prefix + string + suffix);
	}
	
	parse(prefs) {
		this.lang.parse(prefs, this.lines);
	}
	
	wrapLines(measurements, screenWidth) {
		for (let line of this.lines) {
			wrapLine(line, measurements, screenWidth);
		}
	}
}

module.exports = Document;
