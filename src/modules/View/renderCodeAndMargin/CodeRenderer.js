let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let getLineage = require("modules/utils/treeSitter/getLineage");
let next = require("modules/utils/treeSitter/next");

let {c} = Cursor;

function *generateVariableWidthParts(lineRow) {
	let offset = lineRow.startOffset;
	
	for (let part of lineRow.variableWidthParts) {
		yield {...part, offset};
		
		offset += part.type === "tab" ? 1 : part.string.length;
	}
}

class CodeRenderer {
	constructor(renderer, scope, ranges, injectionRanges) {
		this.renderer = renderer;
		this.scope = scope;
		this.ranges = ranges;
		this.injectionRanges = injectionRanges;
		this.view = renderer.view;
		this.document = this.view.document;
		this.canvasCodeRenderer = renderer.canvas.createCodeRenderer();
		//this.foldedLineRows = renderer.foldedLineRows;
		
		this.foldedLineRowGenerator = renderer.generateFoldedLineRows();
		
		this.rangeIndex = 0;
		this.injectionRangeIndex = 0;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
		this.nextNodeToEnter = null;
		
		this.nextFoldedLineRow();
		this.startRow();
		this.initNodeStack();
	}
	
	get range() {
		return this.ranges[this.rangeIndex];
	}
	
	get injectionRange() {
		return this.injectionRanges[this.injectionRangeIndex] || null;
	}
	
	get nextRangeToEnter() {
		return this.inRange() ? this.ranges[this.rangeIndex + 1] || null : this.ranges[this.rangeIndex];
	}
	
	get nextInjectionRangeToEnter() {
		return this.inInjectionRange() ? this.injectionRanges[this.injectionRangeIndex + 1] || null : this.injectionRanges[this.injectionRangeIndex] || null;
	}
	
	get lineIndex() {
		return this.foldedLineRow?.lineIndex;
	}
	
	get rowIndexInLine() {
		return this.foldedLineRow?.rowIndexInLine;
	}
	
	get line() {
		return this.foldedLineRow?.line;
	}
	
	get lineRow() {
		return this.foldedLineRow?.lineRow;
	}
	
	get cursor() {
		return c(this.lineIndex, this.offset);
	}
	
	get node() {
		return this.nodeStack[this.nodeStack.length - 1] || null;
	}
	
	get nodeStartCursor() {
		return this.node && treeSitterPointToCursor(nodeGetters.startPosition(this.node));
	}
	
	get nodeEndCursor() {
		return this.node && treeSitterPointToCursor(nodeGetters.endPosition(this.node));
	}
	
	get nextNodeStartCursor() {
		let next = this.nextNodeToEnter;
		
		return next && treeSitterPointToCursor(nodeGetters.startPosition(next));
	}
	
	inRange() {
		return this.range?.containsCharCursor(this.cursor);
	}
	
	inInjectionRange() {
		return this.injectionRange?.containsCharCursor(this.cursor);
	}
	
	nextFoldedLineRow() {
		this.foldedLineRow = this.foldedLineRowGenerator.next().value;
		
		if (!this.foldedLineRow) {
			return;
		}
		
		this.variableWidthPartGenerator = generateVariableWidthParts(this.lineRow);
		this.nextVariableWidthPart();
		
		this.offset = this.lineRow.startOffset;
	}
	
	nextVariableWidthPart() {
		this.variableWidthPart = this.variableWidthPartGenerator.next().value;
	}
	
	initNodeStack() {
		let node = this.scope.findSmallestNodeAtCharCursor(this.cursor);
		
		this.nodeStack = node ? getLineage(node) : [];
		this.nextNodeToEnter = this.scope.findFirstNodeOnOrAfterCursor(this.cursor);
		
		this.setColor();
	}
	
	nextNode() {
		this.nodeStack = this.nextNodeToEnter ? getLineage(this.nextNodeToEnter) : [];
		this.nextNodeToEnter = this.node && next(this.node);
		
		this.setColor();
	}
	
	nextRange() {
		this.rangeIndex++;
	}
	
	nextInjectionRange() {
		this.injectionRangeIndex++;
	}
	
	_setColor(node) {
		let {lang} = this.scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node);
		
		if (!hiliteClass) {
			return false;
		}
		
		this.canvasCodeRenderer.setColor(colors[hiliteClass]);
		
		return true;
	}
	
	setColor() {
		for (let i = this.nodeStack.length - 1; i >= 0; i--) {
			let node = this.nodeStack[i];
			
			if (this._setColor(node)) {
				break;
			}
		}
	}
	
	startRow() {
		this.canvasCodeRenderer.startRow(this.rowIndexInLine === 0 ? 0 : this.line.indentCols);
	}
	
	getCurrentRangeEnd() {
		return this.range?.selection.end.lineIndex === this.lineIndex ? this.range.selection.end.offset : Infinity;
	}
	
	getNextRangeStart() {
		return this.nextRangeToEnter?.selection.start.lineIndex === this.lineIndex ? this.nextRangeToEnter.selection.start.offset : Infinity;
	}
	
	getCurrentNodeEnd() {
		return this.nodeEndCursor?.lineIndex === this.lineIndex ? this.nodeEndCursor.offset : Infinity;
	}
	
	getNextNodeStart() {
		return this.nextNodeStartCursor?.lineIndex === this.lineIndex ? this.nextNodeStartCursor.offset : Infinity;
	}
	
	getNextInjectionRangeStart() {
		return this.nextInjectionRangeToEnter?.selection.start.lineIndex === this.lineIndex ? this.nextInjectionRangeToEnter.selection.start.offset : Infinity;
	}
	
	getCurrentInjectionRangeEnd() {
		return this.inInjectionRange() && this.injectionRange.selection.end.lineIndex === this.lineIndex ? this.injectionRange.selection.end.offset : Infinity;
	}
	
	step() {
		if (this.variableWidthPart) {
			if (this.variableWidthPart.type === "string") {
				let currentNodeEnd = this.getCurrentNodeEnd();
				let nextNodeStart = this.getNextNodeStart();
				let currentRangeEnd = this.getCurrentRangeEnd();
				let nextRangeStart = this.getNextRangeStart();
				let currentInjectionRangeEnd = this.getCurrentRangeEnd();
				let nextInjectionRangeStart = this.getNextInjectionRangeStart();
				let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
				
				let renderTo = Math.min(
					currentRangeEnd,
					nextRangeStart,
					currentNodeEnd,
					nextNodeStart,
					currentInjectionRangeEnd,
					nextInjectionRangeStart,
					partEnd,
				);
				
				let length = renderTo - this.offset;
				
				let {string, offset} = this.variableWidthPart;
				
				this.canvasCodeRenderer.drawText(string.substring(this.offset - offset, renderTo - offset), !this.inRange() || this.inInjectionRange());
				
				this.offset += length;
				
				if (renderTo === partEnd) {
					this.nextVariableWidthPart();
				}
			} else {
				this.canvasCodeRenderer.drawTab(this.variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
			}
		} else {
			this.canvasCodeRenderer.endRow();
			
			this.nextFoldedLineRow();
			
			if (!this.foldedLineRow) {
				return true;
			}
			
			this.startRow();
		}
		
		while (this.node && Cursor.equals(this.cursor, this.nodeEndCursor)) {
			this.nodeStack.pop();
		}
		
		this.setColor();
		
		if (this.nextNodeStartCursor && Cursor.equals(this.cursor, this.nextNodeStartCursor)) {
			this.nextNode();
		}
		
		if (this.range && Cursor.equals(this.cursor, this.range.selection.end)) {
			this.nextRange();
		}
		
		if (this.injectionRange && Cursor.equals(this.cursor, this.injectionRange.selection.end)) {
			this.nextInjectionRange();
		}
		
		return false;
	}
	
	render() {
		let iterations = 0;
		
		while (!this.step()) {
			if (iterations === 2000) {
				console.log("infinite");
				
				break;
			}
			
			iterations++;
		}
	}
}

module.exports = CodeRenderer;
