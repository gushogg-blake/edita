let Cursor = require("modules/Cursor");
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
		return this.nodeStack.at(-1) || null;
	}
	
	get node() {
		return this._node?.node || null;
	}
	
	get nodeStyle() {
		return this._node?.style || base.theme.editor.defaultStyle;
	}
	
	get nodeEndCursor() {
		return this.node?.end;
	}
	
	get nextChildStartCursor() {
		this._node?.nextChild?.start;
	}
	
	inRange() {
		return this.range?.containsCharCursor(this.cursor);
	}
	
	inInjectionRange() {
		return this.injectionRange?.containsCharCursor(this.cursor);
	}
	
	initNodeStack() {
		let node = this.scope.findSmallestNodeAtCharCursor(this.cursor);
		let lineage = node?.lineage() || [];
		
		let currentStyle = null;
		let currentParent = null;
		
		this.nodeStack = [{
			node: null,
			style: null,
			nextChild: node ? null : this.scope.tree?.rootNode || null,
		}];
		
		for (let node of lineage) {
			let style = this.getStyle(node) || currentStyle;
			let nextChild = node.firstChildAfter(this.cursor) || null;
			
			this.nodeStack.push({
				node,
				nextChild,
				style,
			});
			
			currentStyle = style;
			currentParent = node;
		}
		
		this.setStyle();
	}
	
	nextNode() {
		if (this.atNodeEnd()) {
			let next = this.node.nextSibling;
			
			this.nodeStack.pop();
			
			this._node.nextChild = next;
		} else if (this.atNextChildStart()) {
			let currentStyle = this.nodeStyle;
			let node = this._node.nextChild;
			let nextChild = node.firstChild;
			let style = this.getStyle(node) || currentStyle;
			
			this.nodeStack.push({
				node,
				nextChild,
				style,
			});
		}
		
		this.setStyle();
		
		if (this.atNodeBoundary()) {
			this.nextNode();
		}
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
	
	setStyle() {
		this.canvasRenderer.setStyle(this.nodeStyle);
	}
	
	getStyle(node) {
		let {lang} = this.scope;
		let hiliteClass = lang.getHiliteClass(node);
		let styles = base.theme.langs[lang.code];
		
		return styles && hiliteClass ? styles[hiliteClass] : null;
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
		if (this.variableWidthPart.type === "string") {
			let currentNodeEnd = this.getCurrentNodeEnd();
			let nextChildStart = this.getNextChildStart();
			let currentRangeEnd = this.getCurrentRangeEnd();
			let nextRangeStart = this.getNextRangeStart();
			let currentInjectionRangeEnd = this.getCurrentInjectionRangeEnd();
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
		
		if (this.atNodeBoundary()) {
			this.nextNode();
		}
		
		if (this.atRangeEnd()) {
			this.nextRange();
		}
		
		if (this.atInjectionRangeEnd()) {
			this.nextInjectionRange();
		}
	}
	
	renderRow() {
		let i = 0;
		
		while (this.variableWidthPart) {
			this.step();
			
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
