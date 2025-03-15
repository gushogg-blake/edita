import Selection from "modules/Selection";
import Cursor from "modules/Cursor";
import Scope from "./Scope";
import Range from "./Range";

let {s} = Selection;
let {c} = Cursor;

export default class {
	constructor(document) {
		this.document = document;
	}
	
	get string() {
		return this.document.string;
	}
	
	get lines() {
		return this.document.lines;
	}
	
	get format() {
		return this.document.format;
	}
	
	get lang() {
		return this.format.lang;
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
	
	generateNodesStartingOnLine(lineIndex, lang=null) {
		return this.rootScope.generateNodesStartingOnLine(lineIndex, lang);
	}
	
	getNodeAtCursor(cursor) {
		let range = this.rangeFromCharCursor(cursor);
		
		if (range) {
			return range.scope.findSmallestNodeAtCharCursor(cursor);
		} else {
			return this.rootScope.tree?.root || null;
		}
	}
	
	getContainingRange() {
		return new Range(0, this.string.length, this.document.selectAll());
	}
	
	indexFromCursor(cursor) {
		let {lineIndex, offset} = cursor;
		let index = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			index += this.lines[i].string.length + this.format.newline.length;
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
			index -= line.string.length + this.format.newline.length;
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
	
	get scopes() {
		return [this.rootScope, ...this.rootScope.allScopes()];
	}
}
