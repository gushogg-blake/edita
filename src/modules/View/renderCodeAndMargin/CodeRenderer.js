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
	constructor(renderer, scope, ranges) {
		this.renderer = renderer;
		this.scope = scope;
		this.ranges = ranges;
		this.view = renderer.view;
		this.document = this.view.document;
		this.canvasCodeRenderer = renderer.canvas.createCodeRenderer();
		//this.foldedLineRows = renderer.foldedLineRows;
		
		this.foldedLineRowGenerator = renderer.generateFoldedLineRows();
		
		this.rangeIndex = null;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
		this.nextNodeToEnter = null;
	}
	
	get range() {
		let range = this.ranges[this.rangeIndex];
		
		return range?.containsCharCursor(this.cursor) ? range : null;
	}
	
	get nextRangeToEnter() {
		return this.range ? this.ranges[this.rangeIndex + 1] || null : this.ranges[this.rangeIndex];
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
		return treeSitterPointToCursor(nodeGetters.startPosition(this.node));
	}
	
	get nodeEndCursor() {
		return treeSitterPointToCursor(nodeGetters.endPosition(this.node));
	}
	
	get nextNodeStartCursor() {
		let next = this.nextNodeToEnter;
		
		return next && treeSitterPointToCursor(nodeGetters.startPosition(next));
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
		this.nextNodeToEnter = node ? next(node) : this.scope.findFirstNodeInRange(this.ranges[0]);
		
		for (let i = this.nodeStack.length - 1; i >= 0; i--) {
			let node = this.nodeStack[i];
			
			if (this.setColor(node)) {
				break;
			}
		}
	}
	
	_nextNode() {
		if (!this.node) {
			this.nodeStack = this.nextNodeToEnter ? getLineage(this.nextNodeToEnter) : [];
			
			return;
		}
		
		let firstChild = nodeGetters.firstChild(this.node);
		
		if (firstChild) {
			this.nodeStack.push(firstChild);
			
			return;
		}
		
		while (this.node) {
			let nextSibling = nodeGetters.nextSibling(this.node);
			
			this.nodeStack.pop();
			
			if (nextSibling) {
				this.nodeStack.push(nextSibling);
				
				break;
			}
		}
	}
	
	nextNode() {
		this._nextNode();
		
		this.nextNodeToEnter = this.node && next(this.node);
	}
	
	nextRange() {
		this.rangeIndex++;
	}
	
	setColor(node=this.node) {
		if (!node) {
			return false;
		}
		
		let {lang} = this.scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node);
		
		if (!hiliteClass) {
			return false;
		}
		
		this.canvasCodeRenderer.setColor(colors[hiliteClass]);
		
		return true;
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
	
	render() {
		this.nextFoldedLineRow();
		this.startRow();
		this.initNodeStack();
		
		let iterations = 0;
		
		while (true) {
			if (iterations === 2000) {
				console.log("infinite");
				
				break;
			}
			
			iterations++;
			
			if (this.variableWidthPart) {
				if (this.variableWidthPart.type === "string") {
					let currentNodeEnd = this.getCurrentNodeEnd();
					let nextNodeStart = this.getNextNodeStart();
					let currentRangeEnd = this.getCurrentRangeEnd();
					let nextRangeStart = this.getNextRangeStart();
					let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
					
					let renderTo = Math.min(currentRangeEnd, nextRangeStart, currentNodeEnd, nextNodeStart, partEnd);
					let length = renderTo - this.offset;
					
					this.canvasCodeRenderer.drawText(this.variableWidthPart.string.substring(this.offset - this.variableWidthPart.offset, renderTo - this.variableWidthPart.offset));
					
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
					break;
				}
				
				this.startRow();
			}
			
			if (this.node && Cursor.equals(this.cursor, this.nodeEndCursor)) {
				this.nodeStack.pop();
			} else if (this.nextNodeStartCursor && Cursor.equals(this.cursor, this.nextNodeStartCursor)) {
				this.nextNode();
			}
			
			if (this.range && Cursor.equals(this.cursor, this.range.selection.end)) {
				this.nextRange();
			}
		}
	}
}

module.exports = CodeRenderer;
