let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let Scope = require("./Scope");
let Range = require("./Range");
let Line = require("./Line");
let generateRenderCommandsForLine = require("./generateRenderCommandsForLine");

let {s} = Selection;
let {c} = Cursor;

module.exports = class {
	constructor(string, noParse) {
		this.string = string;
		this.noParse = noParse;
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
		
		if (!this.noParse && this.lang.code !== "plainText") {
			this.rootScope = new Scope(null, this.lang, this.string, [this.getContainingRange()]);
		}
	}
	
	edit(edit) {
		//console.time("edit");
		
		let {
			selection,
			string,
			replaceWith,
		} = edit;
		
		let index = this.indexFromCursor(Selection.sort(selection).start);
		
		this.string = this.string.substr(0, index) + replaceWith + this.string.substr(index + string.length);
		
		this.createLines();
		
		if (this.rootScope) {
			this.rootScope.edit(edit, index, [this.getContainingRange()], this.string);
		}
		
		//console.timeEnd("edit");
	}
	
	findFirstNodeToRender(lineIndex) {
		if (!this.rootScope) {
			return {};
		}
		
		return this.rootScope.findFirstNodeToRender(lineIndex);
	}
	
	getDecoratedLines(startLineIndex, endLineIndex) {
		let lines = this.lines.slice(startLineIndex, endLineIndex).map((line) => {
			return {
				line,
				renderHints: [],
			};
		});
		
		if (this.rootScope) {
			let {scope, range, node} = this.findFirstNodeToRender(startLineIndex);
			
			while (node && node.startPosition.row < endLineIndex) {
				if (node.startPosition.row >= startLineIndex) {
					let line = lines[node.startPosition.row - startLineIndex];
					
					line.renderHints.push(...scope.generateRenderHints(node));
				}
				
				({scope, range, node} = scope.next(node, range));
			}
		}
		
		for (let line of lines) {
			line.renderCommands = [...generateRenderCommandsForLine(line.line, line.renderHints)];
		}
		
		return lines;
	}
	
	getNodesOnLine(lineIndex) {
		if (!this.rootScope) {
			return [];
		}
		
		return [...this.rootScope.generateNodesOnLine(lineIndex)];
	}
	
	*generateNodesOnLine(lineIndex) {
		if (!this.rootScope) {
			return;
		}
		
		yield* this.rootScope.generateNodesOnLine(lineIndex);
	}
	
	*generateNodesOnLineWithLang(lineIndex) {
		if (!this.rootScope) {
			return;
		}
		
		let {
			scope,
			range,
			node,
		} = this.rootScope.findFirstNodeOnLine(lineIndex);
		
		while (node && node.startPosition.row === lineIndex) {
			yield {
				node,
				lang: scope.lang,
			};
			
			({
				scope,
				range,
				node,
			} = scope.next(node, range));
		}
	}
	
	getHeadersOnLine(lineIndex) {
		if (!this.rootScope) {
			return [];
		}
		
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({lang, node}) {
			return {
				header: node,
				footer: lang.getFooter(node),
			};
		}).filter(r => r.footer);
	}
	
	getFootersOnLine(lineIndex) {
		if (!this.rootScope) {
			return [];
		}
		
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({lang, node}) {
			return {
				header: lang.getHeader(node),
				footer: node,
			};
		}).filter(r => r.header);
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
		if (!this.rootScope) {
			return this.lang;
		}
		
		return this.rootScope.langFromCursor(cursor);
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
}
