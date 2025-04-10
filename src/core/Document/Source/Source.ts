import {c} from "core";
import type {Cursor, Selection, Document, Lang} from "core";
import type {AppliedEdit} from "core/Document";
import Scope from "./Scope";
import Range, {type VisibleScope} from "./Range";

export default class {
	rootScope: Scope;
	
	private document: Document;
	
	constructor(document: Document) {
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
	
	parse(): void {
		this.rootScope = new Scope(this, null, this.lang, [this.getContainingRange()]);
	}
	
	edit(appliedEdit: AppliedEdit): void {
		this.rootScope.edit(appliedEdit, [this.getContainingRange()]);
	}
	
	getVisibleScopes(selection: Selection): VisibleScope[] {
		return this.rootScope.getVisibleScopes(selection);
	}
	
	generateNodesStartingOnLine(lineIndex: number, lang: Lang = null) {
		return this.rootScope.generateNodesStartingOnLine(lineIndex, lang);
	}
	
	getNodeAtCursor(cursor: Cursor): Node | null {
		let range = this.rangeFromCharCursor(cursor);
		
		if (range) {
			return range.scope.findSmallestNodeAtCharCursor(cursor);
		} else {
			return this.rootScope.tree?.root || null;
		}
	}
	
	getContainingRange(): Range {
		return new Range(0, this.string.length, this.document.selectAll());
	}
	
	indexFromCursor(cursor: Cursor): number {
		let {lineIndex, offset} = cursor;
		let index = 0;
		
		for (let i = 0; i < lineIndex; i++) {
			index += this.lines[i].string.length + this.format.newline.length;
		}
		
		index += offset;
		
		return index;
	}
	
	cursorFromIndex(index: number): Cursor {
		let lineIndex = 0;
		
		for (let line of this.lines) {
			if (index <= line.string.length) {
				return c(lineIndex, index);
			}
			
			lineIndex++;
			index -= line.string.length + this.format.newline.length;
		}
	}
	
	_rangeFromCursor(cursor: Cursor, _char: boolean, scope: Scope = this.rootScope): Range | null {
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
	
	rangeFromCursor(cursor: Cursor): Range | null {
		return this._rangeFromCursor(cursor, false);
	}
	
	rangeFromCharCursor(cursor: Cursor): Range | null {
		return this._rangeFromCursor(cursor, true);
	}
	
	langFromCursor(cursor: Cursor): Lang | null {
		return this.rangeFromCursor(cursor)?.lang || null;
	}
	
	get scopes(): Scope[] {
		return [this.rootScope, ...this.rootScope.allScopes()];
	}
}
