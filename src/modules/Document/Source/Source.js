let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");

let Scope = require("./Scope");
let Range = require("./Range");
let Line = require("./Line");

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
		} else {
			this.rootScope = null;
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
	
	*generateNodesOnLine(lineIndex, lang=null) {
		if (!this.rootScope) {
			return;
		}
		
		yield* this.rootScope.generateNodesOnLine(lineIndex, lang);
	}
	
	*generateNodesWithScopeOnLine(lineIndex) {
		if (!this.rootScope) {
			return;
		}
		
		yield* this.rootScope.generateNodesWithScopeOnLine(lineIndex);
	}
	
	_findNodeWithRange(cursor, method) {
		if (!this.rootScope) {
			return null;
		}
		
		return this.rangeFromCharCursor(cursor)[method](cursor);
	}
	
	findFirstNodeOnOrAfterCursor(cursor) {
		return this._findNodeWithRange(cursor, "findFirstNodeOnOrAfterCursor");
	}
	
	findFirstNodeAfterCursor(cursor) {
		return this._findNodeWithRange(cursor, "findFirstNodeAfterCursor");
	}
	
	findSmallestNodeAtCursor(cursor) {
		return this._findNodeWithRange(cursor, "findSmallestNodeAtCursor");
	}
	
	getHeadersOnLine(lineIndex) {
		if (!this.rootScope) {
			return [];
		}
		
		let nodesWithScope = [...this.rootScope.generateNodesWithScopeOnLine(lineIndex)];
		
		return nodesWithScope.map(function({scope, node}) {
			return {
				header: node,
				footer: scope.lang.getFooter(node),
			};
		}).filter(r => r.footer);
	}
	
	getFootersOnLine(lineIndex) {
		if (!this.rootScope) {
			return [];
		}
		
		let nodesWithScope = [...this.rootScope.generateNodesWithScopeOnLine(lineIndex)];
		
		return nodesWithScope.map(function({scope, node}) {
			return {
				header: scope.lang.getHeader(node),
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
	
	scopeFromCursor(cursor) {
		return this.rootScope?.scopeFromCursor(cursor);
	}
	
	rangeFromCharCursor(cursor) {
		return this.rootScope?.rangeFromCharCursor(cursor);
	}
	
	langFromCursor(cursor) {
		return this.rootScope?.langFromCursor(cursor) || this.lang;
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
	
	selectAll() {
		return s(c(0, 0), this.cursorAtEnd());
	}
}
