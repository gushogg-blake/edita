let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");
let getLineage = require("modules/utils/treeSitter/getLineage");

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
		this.canvasCodeRenderer = renderer.canvas.getCodeRenderer();
		//this.foldedLineRows = renderer.foldedLineRows;
		
		this.foldedLineRowGenerator = renderer.generateFoldedLineRows();
		
		this.rangeIndex = null;
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
		this.nextNodeToEnter = null;
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
		return treeSitterPointToCursor(nodeGetters.startPosition(this.nodeWithRange.node));
	}
	
	get nodeEndCursor() {
		return treeSitterPointToCursor(nodeGetters.endPosition(this.nodeWithRange.node));
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
	}
	
	setColor() {
		if (!this.node) {
			return;
		}
		
		let {lang} = this.scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node);
		
		if (!hiliteClass) {
			return;
		}
		
		this.renderCode.setColor(colors[hiliteClass]);
	}
	
	startRow() {
		this.canvasCodeRenderer.startRow(this.rowIndexInLine === 0 ? 0 : this.line.indentCols);
	}
	
	render(source) {
		
	}
	
	render1() {
		this.nextFoldedLineRow();
		
		this.initNodeStack();
		
		this.setColor();
		
		this.startRow();
		
		this.setNextNodeToEnter();
		
		while (true) {
			let leftNode = false;
			let enteredNode = false;
			
			let currentNodeEnd = Infinity;
			
			if (this.nodeWithRange && this.nodeEndCursor.lineIndex === this.lineIndex) {
				currentNodeEnd = this.nodeEndCursor.offset;
			}
			
			let nextNodeStart = Infinity;
			
			if (this.nextNodeStartCursor && this.nextNodeStartCursor.lineIndex === this.lineIndex) {
				nextNodeStart = this.nextNodeStartCursor.offset;
			}
			
			if (this.variableWidthPart) {
				if (this.variableWidthPart.type === "string") {
					let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
					
					let renderTo = Math.min(currentNodeEnd, nextNodeStart, partEnd);
					let length = renderTo - this.offset;
					
					renderCode.drawText(this.variableWidthPart.string.substring(this.offset - this.variableWidthPart.offset, renderTo - this.variableWidthPart.offset));
					
					this.offset += length;
					
					if (renderTo === partEnd) {
						this.nextVariableWidthPart();
					}
				} else {
					renderCode.drawTab(this.variableWidthPart.width);
					
					this.offset++;
					
					this.nextVariableWidthPart();
				}
			} else {
				renderCode.endRow();
				renderMargin.endRow();
				renderFoldHilites.endRow();
				
				rowsRendered++;
				
				if (rowsRendered === rowsToRender) {
					break;
				}
				
				this.nextFoldedLineRow();
				
				if (!this.foldedLineRow) {
					break;
				}
				
				this.startRow();
			}
			
			while (this.nodeWithRange && Cursor.equals(this.cursor, this.nodeEndCursor)) {
				this.nodeStack.pop();
				
				leftNode = true;
			}
			
			if (leftNode) {
				this.setColor();
			}
			
			let next = this.nextNodeToEnter;
			
			if (next && Cursor.equals(this.cursor, this.nextNodeStartCursor)) {
				enteredNode = true;
			}
			
			if (enteredNode) {
				let n = next.next();
				
				while (n && Cursor.equals(this.cursor, treeSitterPointToCursor(nodeGetters.startPosition(n.node)))) {
					next = n;
					
					n = n.next();
				}
			}
			
			if (enteredNode) {
				this.nodeStack = next.lineage();
				
				this.setColor();
				this.setNextNodeToEnter();
			}
		}
	}
}

module.exports = CodeRenderer;
