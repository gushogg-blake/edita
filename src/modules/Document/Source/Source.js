let Selection = require("modules/Selection");
let Cursor = require("modules/Cursor");
let Scope = require("./Scope");
let Range = require("./Range");

let {s} = Selection;
let {c} = Cursor;

module.exports = class {
	constructor(document) {
		this.document = document;
	}
	
	get string() {
		return this.document.string;
	}
	
	get lines() {
		return this.document.lines;
	}
	
	get fileDetails() {
		return this.document.fileDetails;
	}
	
	get lang() {
		return this.fileDetails.lang;
	}
	
	parse() {
		this.rootScope = new Scope(this, null, this.lang, [this.getContainingRange()]);
	}
	
	edit(edit, index) {
		this.rootScope.edit(edit, index, [this.getContainingRange()]);
	}
	
	getVisibleScopes(selection) {
		return this.rootScope.getVisibleScopes(selection);
	}
	
	generateNodesOnLine(lineIndex, lang=null) {
		return this.rootScope.generateNodesOnLine(lineIndex, lang);
	}
	
	getNodeAtCursor(cursor) {
		let range = this.rangeFromCharCursor(cursor);
		
		if (range) {
			return range.scope.findSmallestNodeAtCharCursor(cursor);
		} else {
			return this.rootScope.tree.root;
		}
	}
	
	getContainingRange() {
		return new Range(0, this.string.length, this.document.selectAll());
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
}
