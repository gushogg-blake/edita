let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let LangRange = require("./LangRange");
let Line = require("./Line");
let generateRenderCommandsForLine = require("./generateRenderCommandsForLine");

let findFirstNodeToRender = require("./utils/treeSitter/findFirstNodeToRender");

let {s} = Selection;
let {c} = Cursor;

module.exports = class {
	constructor(string) {
		this.string = string;
	}
	
	init(fileDetails) {
		this.fileDetails = fileDetails;
		this.lang = fileDetails.lang;
		
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
		console.time("decorateLines");
		
		this.rootLangRange.decorateLines(this.lines);
		
		console.timeEnd("decorateLines");
	}
	
	setRenderCommands() {
		console.time("setRenderCommands");
		
		for (let line of this.lines) {
			line.renderCommands = [...generateRenderCommandsForLine(line)];
		}
		
		console.timeEnd("setRenderCommands");
	}
	
	parse() {
		this.createLines();
		
		if (this.lang.code !== "plainText") {
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
			
			//this.decorateLines();
		}
		
		this.setRenderCommands();
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
		
		if (this.lang.code !== "plainText") {
			this.rootLangRange.edit(edit, index, {
				startIndex: 0,
				endIndex: this.string.length,
				selection: s(c(0, 0), this.cursorAtEnd()),
			}, this.string);
			
			//this.decorateLines();
		}
		
		this.setRenderCommands();
		
		console.timeEnd("edit");
		
		console.time("find");
		
		let n = findFirstNodeToRender(this.rootLangRange.tree, 400);
		
		console.log(n);
		
		console.timeEnd("find");
		
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
	
	langFromCursor(cursor, langRange=this.rootLangRange) {
		if (this.lang.code === "plainText") {
			return this.lang;
		}
		
		if (Cursor.equals(cursor, this.cursorAtEnd())) {
			return this.lang;
		}
		
		let {selection} = langRange.range;
		
		if (!Selection.charIsWithinSelection(selection, cursor)) {
			return null;
		}
		
		for (let childLangRange of langRange.langRanges) {
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
