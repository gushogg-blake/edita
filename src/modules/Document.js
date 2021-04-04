let wrapLine = require("./wrapLine/wrapLine");

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
	
	edit(lineIndex, removeLines, addCode) {
		
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
