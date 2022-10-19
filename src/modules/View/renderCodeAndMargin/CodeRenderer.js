let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let findFirstNodeAfterCursor = require("modules/utils/treeSitter/findFirstNodeAfterCursor");
let nodeUtils = require("modules/utils/treeSitter/nodeUtils");

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
		
		this.foldedLineRowGenerator = renderer.generateFoldedLineRows();
		
		this.rangeIndex = 0;
		this.injectionRangeIndex = 0;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = null;
		
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
	
	get _node() {
		return this.nodeStack[this.nodeStack.length - 1] || null;
	}
	
	get node() {
		return this._node?.node || null;
	}
	
	get nodeColor() {
		return this._node?.color || null;
	}
	
	get nodeEndCursor() {
		return this.node && treeSitterPointToCursor(nodeUtils.endPosition(this.node));
	}
	
	get nextChildStartCursor() {
		let nextChild = this._node?.nextChild || null;
		
		return nextChild && treeSitterPointToCursor(nodeUtils.startPosition(nextChild));
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
		let lineage = node ? nodeUtils.lineage(node) : [];
		
		let currentColor = null;
		let currentParent = null;
		
		this.nodeStack = [{
			node: null,
			color: null,
			nextChild: node ? null : this.scope.tree.rootNode,
		}];
		
		for (let node of lineage) {
			let color = this.getColor(node) || currentColor;
			let nextChild = findFirstNodeAfterCursor(node, this.cursor) || null;
			
			this.nodeStack.push({
				node,
				nextChild,
				color,
			});
			
			currentColor = color;
			currentParent = node;
		}
		
		this.setColor();
	}
	
	nextNode() {
		if (this.atNodeEnd()) {
			let next = nodeUtils.nextSibling(this.node);
			
			this.nodeStack.pop();
			
			this._node.nextChild = next;
		} else if (this.atNextChildStart()) {
			let currentColor = this.nodeColor;
			let node = this._node.nextChild;
			let nextChild = nodeUtils.firstChild(node);
			let color = this.getColor(node) || currentColor;
			
			this.nodeStack.push({
				node,
				nextChild,
				color,
			});
		}
		
		this.setColor();
		
		if (this.atNodeBoundary()) {
			this.nextNode();
		}
	}
	
	atNodeEnd() {
		return this.node && Cursor.equals(this.cursor, this.nodeEndCursor);
	}
	
	atNextChildStart() {
		return this.nextChildStartCursor && Cursor.equals(this.cursor, this.nextChildStartCursor);
	}
	
	atNodeBoundary() {
		return this.atNodeEnd() || this.atNextChildStart();
	}
	
	nextRange() {
		this.rangeIndex++;
	}
	
	nextInjectionRange() {
		this.injectionRangeIndex++;
	}
	
	setColor() {
		this.canvasCodeRenderer.setColor(this.nodeColor);
	}
	
	getColor(node) {
		let {lang} = this.scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node, nodeUtils);
		
		return hiliteClass ? colors[hiliteClass] : null;
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
	
	getNextChildStart() {
		return this.nextChildStartCursor?.lineIndex === this.lineIndex ? this.nextChildStartCursor.offset : Infinity;
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
				let nextChildStart = this.getNextChildStart();
				let currentRangeEnd = this.getCurrentRangeEnd();
				let nextRangeStart = this.getNextRangeStart();
				let currentInjectionRangeEnd = this.getCurrentRangeEnd();
				let nextInjectionRangeStart = this.getNextInjectionRangeStart();
				let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
				
				let renderTo = Math.min(
					currentRangeEnd,
					nextRangeStart,
					currentNodeEnd,
					nextChildStart,
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
		
		if (this.atNodeBoundary()) {
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
		let i = 0;
		
		while (!this.step() && i < 2000) {
			i++;
		};
		
		if (i === 2000) {
			console.log("infinite");
		}
	}
}

module.exports = CodeRenderer;
