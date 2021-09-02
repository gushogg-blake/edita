let LangRange = require("./LangRange");
let Line = require("./Line");
let generateRenderCommandsForLine = require("./generateRenderCommandsForLine");

module.exports = class {
	constructor(string) {
		this.string = string;
	}
	
	init(lang, newline) {
		this.newline = newline;
		this.lang = lang;
		
		this.parse();
	}
	
	createLines() {
		this.lines = [];
		
		let {fileDetails} = this;
		let lineStrings = this.string.split(fileDetails.newline);
		let lineStartIndex = 0;
		
		for (let lineString of lineStrings) {
			this.lines.push(new Line(lineString, fileDetails, lineStartIndex));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
		}
	}
	
	decorateLines() {
		this.rootLangRange.decorateLines(this.lines);
		
		for (let line of this.lines) {
			line.renderCommands = [...generateRenderCommandsForLine(line)];
		}
	}
	
	parse() {
		console.time("parse");
		
		this.createLines();
		
		try {
			this.rootLangRange = new LangRange(this.lang, this.string, {
				startIndex: 0,
				endIndex: this.string.length,
				selection: s(c(0, 0), this.cursorAtEnd()),
			});
		} catch (e) {
			console.error("Parse error");
			console.error(e);
		}
		
		this.decorateLines();
		
		console.timeEnd("parse");
	}
	
	edit(edit) {
		console.time("edit");
		
		let {
			selection,
			string,
			replaceWith,
		} = edit;
		
		let index = this.indexFromCursor(Selection.sort(selection).start);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		this.createLines();
		
		this.rootLangRange.edit(edit, index, this.string);
		
		this.decorateLines();
		
		console.timeEnd("edit");
	}
	
	createRange() {
		
	}
	
	indexFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
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
				return c(lineIndex, index);
			}
			
			lineIndex++;
			index -= line.string.length + this.fileDetails.newline.length;
		}
	}
	
	langFromCursor(cursor, langRange=this.mainLangRange) {
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return this.mainLang;
		}
		
		let {selection} = langRange.range;
		
		if (!Selection.charIsWithinSelection(selection, cursor)) {
			return null;
		}
		
		for (let childLangRange of langRange.children) {
			let langFromChild = this.langFromCursor(cursor, childLangRange);
			
			if (langFromChild) {
				return langFromChild;
			}
		}
		
		return langRange.lang;
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
}
