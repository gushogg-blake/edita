let wrapLine = require("./wrapLine/wrapLine");
let sortSelection = require("./utils/sortSelection");

function createLine(string) {
	return {
		string,
		endState: null,
		lastUsedCacheKey: null,
		cachedCommands: {},
		height: 1,
	};
}

function createLines(code) {
	return code.split("\n").map(createLine);
}

class Document {
	constructor(code, lang) {
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
		
		this.parse({
			indentWidth: 4,
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
			//console.log((this.lines.indexOf(line) + 1 ) + " " + line.string);
			wrapLine(line, measurements, screenWidth);
		}
	}
}

module.exports = Document;
