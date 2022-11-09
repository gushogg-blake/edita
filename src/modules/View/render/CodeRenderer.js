let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let findFirstChildAfterCursor = require("modules/utils/treeSitter/findFirstChildAfterCursor");
let nodeUtils = require("modules/utils/treeSitter/nodeUtils");
let LineRowRenderer = require("./LineRowRenderer");

module.exports = class extends LineRowRenderer {
	constructor(renderer, scope, ranges, injectionRanges) {
		super(renderer);
		
		this.scope = scope;
		this.ranges = ranges;
		this.injectionRanges = injectionRanges;
		
		this.canvasRenderer = this.renderer.canvasRenderers.code();
		
		this.rangeIndex = 0;
		this.injectionRangeIndex = 0;
		this.nodeStack = null;
	}
	
	init(row) {
		super.init(row);
		
		this.initNodeStack();
	}
	
	get range() {
		return this.ranges[this.rangeIndex];
	}
	
	get injectionRange() {
		return this.injectionRanges[this.injectionRangeIndex] || null;
	}
	
	get nextRangeToEnter() {
		return (
			this.inRange()
			? this.ranges[this.rangeIndex + 1] || null
			: this.ranges[this.rangeIndex]
		);
	}
	
	get nextInjectionRangeToEnter() {
		return (
			this.inInjectionRange()
			? this.injectionRanges[this.injectionRangeIndex + 1] || null
			: this.injectionRanges[this.injectionRangeIndex] || null
		);
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
	
	initNodeStack() {
		let node = this.scope.findSmallestNodeAtCharCursor(this.cursor);
		let lineage = node ? nodeUtils.lineage(node) : [];
		
		let currentColor = null;
		let currentParent = null;
		
		this.nodeStack = [{
			node: null,
			color: null,
			nextChild: node ? null : this.scope.tree?.rootNode || null,
		}];
		
		for (let node of lineage) {
			let color = this.getColor(node) || currentColor;
			let nextChild = findFirstChildAfterCursor(node, this.cursor) || null;
			
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
	
	atCursor(cursor) {
		return cursor && Cursor.equals(this.cursor, cursor);
	}
	
	atNodeEnd() {
		return this.atCursor(this.nodeEndCursor);
	}
	
	atNextChildStart() {
		return this.atCursor(this.nextChildStartCursor);
	}
	
	atNodeBoundary() {
		return this.atNodeEnd() || this.atNextChildStart();
	}
	
	atRangeEnd() {
		return this.atCursor(this.range?.selection.end);
	}
	
	atInjectionRangeEnd() {
		return this.atCursor(this.injectionRange?.selection.end);
	}
	
	nextRange() {
		this.rangeIndex++;
	}
	
	nextInjectionRange() {
		this.injectionRangeIndex++;
	}
	
	setColor() {
		this.canvasRenderer.setColor(this.nodeColor);
	}
	
	getColor(node) {
		let {lang} = this.scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node, nodeUtils);
		
		return hiliteClass ? colors[hiliteClass] : null;
	}
	
	startRow(row) {
		super.startRow(row);
		
		this.canvasRenderer.startRow(this.rowIndexInLine === 0 ? 0 : this.line.indentCols);
	}
	
	endRow() {
		super.endRow();
		
		this.canvasRenderer.endRow();
	}
	
	_offsetOrInfinity(cursor) {
		return cursor?.lineIndex === this.lineIndex ? cursor.offset : Infinity;
	}
	
	getCurrentRangeEnd() {
		return this._offsetOrInfinity(this.range?.selection.end);
	}
	
	getNextRangeStart() {
		return this._offsetOrInfinity(this.nextRangeToEnter?.selection.start);
	}
	
	getCurrentNodeEnd() {
		return this._offsetOrInfinity(this.nodeEndCursor);
	}
	
	getNextChildStart() {
		return this._offsetOrInfinity(this.nextChildStartCursor);
	}
	
	getNextInjectionRangeStart() {
		return this._offsetOrInfinity(this.nextInjectionRangeToEnter?.selection.start);
	}
	
	getCurrentInjectionRangeEnd() {
		return this._offsetOrInfinity(this.injectionRange?.selection.end);
	}
	
	step() {
		let done = false;
		
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
				let substring = string.substring(this.offset - offset, renderTo - offset);
				
				if (!this.inRange() || this.inInjectionRange()) {
					this.canvasRenderer.skipText(substring);
				} else {
					this.canvasRenderer.drawText(substring);
				}
				
				this.offset += length;
				
				if (renderTo === partEnd) {
					this.nextVariableWidthPart();
				}
			} else {
				this.canvasRenderer.drawTab(this.variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
			}
		} else {
			done = true;
		}
		
		if (this.atNodeBoundary()) {
			this.nextNode();
		}
		
		if (this.atRangeEnd()) {
			this.nextRange();
		}
		
		if (this.atInjectionRangeEnd()) {
			this.nextInjectionRange();
		}
		
		return done;
	}
	
	renderRow() {
		let i = 0;
		
		while (!this.step()) {
			//if (++i === 1000) {
			//	console.log("infinite");
			//}
			//
			//if (i === 1010) {
			//	break;
			//}
		}
	}
}
