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
		
		this.maxLineLength = 0;
		
		for (let lineString of lineStrings) {
			this.lines.push(new Line(lineString, fileDetails, lineStartIndex));
			
			lineStartIndex += lineString.length + fileDetails.newline.length;
			
			if (lineString.length > this.maxLineLength) {
				this.maxLineLength = lineString.length;
			}
		}
	}
	
	parse() {
		this.createLines();
		
		this.rootScope = new Scope(this, null, this.lang, this.string, [this.getContainingRange()]);
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
		
		this.rootScope.edit(edit, index, [this.getContainingRange()], this.string);
		
		//console.timeEnd("edit");
	}
	
	getVisibleScopes(selection) {
		return this.rootScope.getVisibleScopes(selection);
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this.rootScope.generateNodesOnLine(lineIndex, lang);
	}
	
	generateNodesOnLineWithLang(lineIndex, lang=null) {
		return this.rootScope.generateNodesOnLineWithLang(lineIndex, lang);
	}
	
	getHeadersOnLine(lineIndex) {
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({node, lang}) {
			return {
				header: node,
				footer: lang.getFooter(node),
			};
		}).filter(r => r.footer);
	}
	
	getFootersOnLine(lineIndex) {
		let nodesWithLang = [...this.rootScope.generateNodesOnLineWithLang(lineIndex)];
		
		return nodesWithLang.map(function({node, lang}) {
			return {
				header: lang.getHeader(node),
				footer: node,
			};
		}).filter(r => r.header);
	}
	
	getContainingRange() {
		return new Range(0, this.string.length, s(c(0, 0), this.cursorAtEnd()));
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
	
	_rangeFromCursor(cursor, _char, scope=this.rootScope) {
		let range = _char ? scope.rangeFromCharCursor(cursor) : scope.rangeFromCursor(cursor);
		
		if (!range) {
			return null;
		}
		
		for (let childScope of scope.scopes) {
			let rangeFromChild = this._rangeFromCursor(cursor, _char, childScope);
			
			if (rangeFromChild) {
				return rangeFromChild;
			}
		}
		
		return range;
	}
	
	rangeFromCursor(cursor) {
		return this._rangeFromCursor(cursor, false);
	}
	
	rangeFromCharCursor(cursor) {
		return this._rangeFromCursor(cursor, true);
	}
	
	langFromCursor(cursor) {
		return this.rangeFromCursor(cursor).lang;
	}
	
	getScopes(parent) {
		return [
			...parent.scopes,
			...parent.scopes.reduce((scopes, scope) => [...scopes, ...this.getScopes(scope)], []),
		];
	}
	
	get scopes() {
		return [this.rootScope, ...this.getScopes(this.rootScope)];
	}
	
	cursorAtEnd() {
		return c(this.lines.length - 1, this.lines[this.lines.length - 1].string.length);
	}
	
	selectAll() {
		return s(c(0, 0), this.cursorAtEnd());
	}
}
