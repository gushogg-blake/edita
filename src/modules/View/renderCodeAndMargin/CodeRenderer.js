let Selection = require("modules/utils/Selection");
let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
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
		//this.foldedLineRows = renderer.foldedLineRows;
		
		this.foldedLineRowGenerator = renderer.generateFoldedLineRows();
		
		this.rangeIndex = 0;
		this.injectionRangeIndex = 0;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
		this.cursorNodeStackIndex = null;
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
	
	get _node() {
		return this.nodeStack[this.nodeStack.length - 1] || null;
	}
	
	get node() {
		return this._node?.node || null;
	}
	
	get nodeSiblings() {
		return this._node?.siblings || null;
	}
	
	get nodeIndex() {
		return this._node?.index || null;
	}
	
	get nodeColor() {
		return this.nodeStack[this.cursorNodeStackIndex]?.color || null;
	}
	
	get nodeStartCursor() {
		return this.node && treeSitterPointToCursor(nodeUtils.startPosition(this.node));
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
		
		this.nodeStack = [];
		
		for (let node of lineage) {
			let color = this.getColor(node) || currentColor;
			//let siblings = currentParent ? nodeUtils.children(currentParent) : null;
			//let index = siblings ? siblings.findIndex(n => n.id === node.id) : null;
			let nextChild = nodeUtils.children(node).find(n => nodeUtils.isAfter(node, this.cursor)) || null;
			
			this.nodeStack.push({
				node,
				//siblings,
				//index,
				nextChild,
				color,
			});
			
			currentColor = color;
			currentParent = node;
		}
		
		this.setColor();
	}
	
	nextNode() {
		if (!this._node) {
			return;
		}
		
		if () {
			
		}
		
		let {siblings, index, nextChild} = this._node;
		
		if (index === siblings.length - 1) {
			this.popNode();
			this.nextNode();
			
			return;
		}
		
		let node = siblings[index];
		let color = this.getColor(node) || this.nodeStack[;
		let nextChild = nodeUtils.firstChild(node);
		
		this.nodeStack.push({
			node,
			nextChild,
			color,
		});
		
		this.setColor();
	}
	
	popNode() {
		this.nodeStack.pop();
		
		this.cursorNodeStackIndex--;
		
		this.setColor();
	}
	
	atNodeStart() {
		return this.node && Cursor.equals(this.cursor, this.nodeStartCursor);
	}
	
	atNodeEnd() {}
}
	
	atNodeBoundary() {
		return (
			this.atNodeStart()
			|| 
			|| this.nextChildStartCursor && Cursor.equals(this.cursor, this.nextChildStartCursor)
		);
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
	
	getCurrentNodeStart() {
		return this.nodeStartCursor?.lineIndex === this.lineIndex ? this.nodeStartCursor.offset : Infinity;
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
				let currentNodeStart = this.getCurrentNodeStart();
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
					currentNodeStart,
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
