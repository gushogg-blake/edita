let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let LangRange = require("./LangRange");
let Line = require("./Line");
let generateRenderCommandsForLine = require("./generateRenderCommandsForLine");

let {s} = Selection;
let {c} = Cursor;

/*

			renderCommands: [],
			nodes: [],
			renderHints: [],
			openers: [],
			closers: [],
*/

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
	
	parse() {
		this.createLines();
		
		if (this.lang.code !== "plainText") {
			try {
				this.rootLangRange = new LangRange(null, null, this.lang, this.string, {
					startIndex: 0,
					endIndex: this.string.length,
					selection: s(c(0, 0), this.cursorAtEnd()),
				});
			} catch (e) {
				console.error("Parse error");
				console.error(e);
			}
		}
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
			}, null, this.string);
		}
		
		console.timeEnd("edit");
	}
	
	findFirstNodeToRender(lineIndex) {
		return this.rootLangRange.findFirstNodeToRender(lineIndex);
	}
	
	getDecoratedLines(startLineIndex, endLineIndex) {
		let lines = this.lines.slice(startLineIndex, endLineIndex).map((line) => {
			return {
				line,
				renderHints: [],
			};
		});
		
		//console.log(lines);
		
		if (this.lang.code !== "plainText") {
			let {langRange, node} = this.findFirstNodeToRender(startLineIndex);
			
			//console.log(langRange, node);
			
			while (true) {
				if (node.startPosition.row >= endLineIndex) {
					break;
				}
				
				//console.log(node.startPosition.row);
				//console.log(startLineIndex);
				
					console.log(node);
				if (node.startPosition.row >= startLineIndex) {
					let line = lines[node.startPosition.row - startLineIndex];
					
					console.log(node);
					
					line.renderHints.push(...langRange.getRenderHints(node));
				}
				
				({langRange, node} = langRange.next(node));
				
				if (!node) {
					break;
				}
			}
		}
		
		for (let line of lines) {
			line.renderCommands = [...generateRenderCommandsForLine(line.line, line.renderHints)];
			//line.renderCommands = [];
		}
		
		return lines;
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
