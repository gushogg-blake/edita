import Cursor, {c} from "modules/Cursor";
import LineRowRenderer from "./LineRowRenderer";

/*
LIFECYCLE: per-frame.
*/

export default class extends LineRowRenderer {
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
		return this._node?.nextChild?.start;
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
			nextChild: node ? null : this.scope.tree?.root || null,
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
		return this.atCursor(this.range?.end);
	}
	
	atInjectionRangeEnd() {
		return this.atCursor(this.injectionRange?.end);
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
		return this._offsetOrInfinity(this.range?.end);
	}
	
	getNextRangeStart() {
		return this._offsetOrInfinity(this.nextRangeToEnter?.start);
	}
	
	getCurrentNodeEnd() {
		return this._offsetOrInfinity(this.nodeEndCursor);
	}
	
	getNextChildStart() {
		return this._offsetOrInfinity(this.nextChildStartCursor);
	}
	
	getNextInjectionRangeStart() {
		return this._offsetOrInfinity(this.nextInjectionRangeToEnter?.start);
	}
	
	getCurrentInjectionRangeEnd() {
		return this._offsetOrInfinity(this.injectionRange?.end);
	}
	
	step() {
		let {variableWidthPart} = this;
		let currentNodeEnd = this.getCurrentNodeEnd();
		let nextChildStart = this.getNextChildStart();
		let currentRangeEnd = this.getCurrentRangeEnd();
		let nextRangeStart = this.getNextRangeStart();
		let currentInjectionRangeEnd = this.getCurrentInjectionRangeEnd();
		let nextInjectionRangeStart = this.getNextInjectionRangeStart();
		let partEnd = variableWidthPart.offset + variableWidthPart.string.length;
		
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
		
		if (variableWidthPart.type === "string") {
			let {string, offset} = variableWidthPart;
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
			if (length === 1) {
				this.canvasRenderer.drawTab(variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
			}
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
		
		//console.log(this.lineIndex);
		
		while (this.variableWidthPart) {
			this.step();
			
			if (base.getPref("dev.debug.breakOnLargeRenderLoop")) {
				if (++i === 1000) {
					console.log("infinite");
				}
				
				if (i === 1010) {
					if (base.getPref("dev.debug.debugOnLargeRenderLoop")) {
						debugger;
					}
					
					break;
				}
			}
		}
	}
	
	resetAfterFold() {
		this.initNodeStack();
	}
}
