export function c(lineIndex, offset) {
	return new Cursor(lineIndex, offset);
}

export default class Cursor {
	lineIndex: number;
	offset: number;
	
	constructor(lineIndex, offset) {
		this.lineIndex = lineIndex;
		this.offset = offset;
	}
	
	equals(cursor) {
		return this.lineIndex === cursor.lineIndex && this.offset === cursor.offset;
	}
	
	isAfter(cursor) {
		return (
			this.lineIndex > cursor.lineIndex
			|| this.lineIndex === cursor.lineIndex && this.offset > cursor.offset
		);
	}
	
	isBefore(cursor) {
		return (
			this.lineIndex < cursor.lineIndex
			|| this.lineIndex === cursor.lineIndex && this.offset < cursor.offset
		);
	}
	
	isOnOrBefore(cursor) {
		return this.isBefore(cursor) || this.equals(cursor);
	}
	
	isOnOrAfter(cursor) {
		return this.isAfter(cursor) || this.equals(cursor);
	}
	
	/*
	char mode is more permissive - it returns true for the selection's
	start cursor, whereas otherwise the cursor has to be fully within
	the selection
	*/
	
	_isWithin(selection, _char) {
		let {left, right} = selection;
		let {lineIndex, offset} = this;
		
		let isBeforeStart = _char ? offset < left.offset : offset <= left.offset;
		
		if (
			lineIndex < left.lineIndex
			|| lineIndex > right.lineIndex
			|| lineIndex === left.lineIndex && isBeforeStart
			|| lineIndex === right.lineIndex && offset >= right.offset
		) {
			return false;
		}
		
		return true;
	}
	
	isWithin(selection) {
		return this._isWithin(selection, false);
	}
	
	charIsWithin(selection) {
		return this._isWithin(selection, true);
	}
	
	isNextTo(selection) {
		return this.equals(selection.start) || this.equals(selection.end);
	}
	
	isWithinOrNextTo(selection) {
		return this.isWithin(selection) || this.isNextTo(selection);
	}
	
	static startOfLine(lineIndex) {
		return c(lineIndex, 0);
	}
	
	static max(a, b) {
		return a.isBefore(b) ? b : a;
	}
	
	static min(a, b) {
		return a.isBefore(b) ? a : b;
	}
	
	static start() {
		return c(0, 0);
	}
}
