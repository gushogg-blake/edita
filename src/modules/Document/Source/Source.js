let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let Scope = require("./Scope");
let Range = require("./Range");
let Line = require("./Line");
let generateRenderCommandsForLine = require("./generateRenderCommandsForLine");

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
	
	parse() {
		this.createLines();
		
		if (this.lang.code !== "plainText") {
			try {
				this.rootScope = new Scope(null, this.lang, this.string, [this.getContainingRange()]);
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
			this.rootScope.edit(edit, index, [this.getContainingRange()], null, this.string);
		}
		
		console.timeEnd("edit");
	}
	
	findFirstNodeToRender(lineIndex) {
		return this.rootScope.findFirstNodeToRender(lineIndex);
	}
	
	getDecoratedLines(startLineIndex, endLineIndex) {
		let lines = this.lines.slice(startLineIndex, endLineIndex).map((line) => {
			return {
				line,
				renderHints: [],
			};
		});
		
		if (this.lang.code !== "plainText") {
			let {scope, range, node} = this.findFirstNodeToRender(startLineIndex);
			
			while (true) {
				if (node.startPosition.row >= endLineIndex) {
					break;
				}
				
				if (node.startPosition.row >= startLineIndex) {
					let line = lines[node.startPosition.row - startLineIndex];
					
					line.renderHints.push(...scope.getRenderHints(node));
				}
				
				({scope, range, node} = scope.next(node, range));
				
				if (!node) {
					break;
				}
			}
		}
		
		for (let line of lines) {
			line.renderCommands = [...generateRenderCommandsForLine(line.line, line.renderHints)];
		}
		
		return lines;
	}
	
	getNodesOnLine(lineIndex) {
		return [...this.rootScope.generateNodesOnLine(lineIndex)];
	}
	
	getContainingRange() {
		return new Range(null, 0, this.string.length, s(c(0, 0), this.cursorAtEnd()));
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
	
	langFromCursor(cursor, scope=this.rootScope) {
		if (this.lang.code === "plainText") {
			return this.lang;
		}
		
		return this.rootScope.langFromCursor(cursor);
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
}
