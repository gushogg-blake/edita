function createLine(string) {
	return {
		string,
		endState: null,
		cacheKey: null,
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
}

module.exports = Document;
