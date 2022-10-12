let Cursor = require("modules/utils/Cursor");
let treeSitterPointToCursor = require("modules/utils/treeSitter/treeSitterPointToCursor");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");

let {c} = Cursor;

class Renderer {
	constructor(view, renderCode, renderMargin, renderFoldHilites) {
		this.view = view;
		this.renderCode = renderCode;
		this.renderMargin = renderMargin;
		this.renderFoldHilites = renderFoldHilites;
		
		this.foldedLineRow = null;
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
		this.nextNodeToEnter = null;
	}
	
	*generateVariableWidthParts() {
		let offset = this.lineRow.startOffset;
		
		for (let part of this.lineRow.variableWidthParts) {
			yield {
				...part,
				offset,
			};
			
			offset += part.type === "tab" ? 1 : part.string.length;
		}
	}
	
	get document() {
		return this.view.document;
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
	
	get nodeStartCursor() {
		return treeSitterPointToCursor(nodeGetters.startPosition(this.nodeWithRange.node));
	}
	
	get nodeEndCursor() {
		return treeSitterPointToCursor(nodeGetters.endPosition(this.nodeWithRange.node));
	}
	
	//get nodeLineIndex() {
	//	return this.nodeWithRange && nodeGetters.startPosition(this.nodeWithRange.node).row;
	//}
	
	//get nodeOffset() {
	//	return this.nodeWithRange && nodeGetters.startPosition(this.nodeWithRange.node).column;
	//}
	
	nextFoldedLineRow() {
		this.foldedLineRow = this.foldedLineRowGenerator.next().value;
		
		if (!this.foldedLineRow) {
			return;
		}
		
		this.variableWidthPartGenerator = this.generateVariableWidthParts();
		this.nextVariableWidthPart();
		
		this.offset = this.lineRow.startOffset;
	}
	
	nextVariableWidthPart() {
		this.variableWidthPart = this.variableWidthPartGenerator.next().value;
	}
	
	get nodeWithRange() {
		return this.nodeStack[this.nodeStack.length - 1] || null;
	}
	
	/*
	initialising and maintaining the current and next node
	
	- on initialisation we get the smallest node at the cursor, so it won't have
	any children that start at the same cursor. then we get the next node, which
	will be after the cursor but could have children at the same cursor
	
	- to go to the next node we take the current next node and go to its smallest
	descendant that starts at the same cursor, set the node stack - which is where
	the current node comes from - to its stack, then set the next node to the
	current node's next.
	
	this way the current node
	*/
	
	initNodeStack() {
		this.nodeStack = this.document.findSmallestNodeAtCharCursor(this.cursor)?.stack() || [];
	}
	
	setNextNodeToEnter() {
		this.nextNodeToEnter = this.nodeWithRange?.nextAfterCharCursor(this.cursor);
	}
	
	get nextNodeStartCursor() {
		let next = this.nextNodeToEnter;
		
		return next && treeSitterPointToCursor(nodeGetters.startPosition(next.node));
	}
	
	setColor() {
		if (!this.nodeWithRange) {
			return;
		}
		
		let {scope, node} = this.nodeWithRange;
		let {lang} = scope;
		let colors = base.theme.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node);
		
		if (!hiliteClass) {
			return;
		}
		
		this.renderCode.setColor(colors[hiliteClass]);
	}
	
	startRow() {
		this.renderCode.startRow(this.rowIndexInLine === 0 ? 0 : this.line.indentCols);
		
		if (this.foldedLineRow.isFoldHeader) {
			this.renderFoldHilites.drawHilite(this.line.indentCols, this.line.width - this.line.indentCols);
		}
		
		if (this.rowIndexInLine === 0) {
			this.renderMargin.drawLineNumber(this.lineIndex);
		}
	}
	
	render() {
		let {
			view,
			renderCode,
			renderMargin,
			renderFoldHilites,
		} = this;
		
		let {
			document,
			measurements,
			sizes,
		} = view;
		
		let {
			lineIndex: firstLineIndex,
			rowIndexInLine: firstLineRowIndex,
		} = view.findFirstVisibleLine();
		
		let {height} = sizes;
		let {rowHeight} = measurements;
		
		let rowsToRender = Math.ceil(height / rowHeight) + 1;
		let rowsRendered = 0;
		
		this.foldedLineRowGenerator = view.generateLineRowsFolded(firstLineIndex);
		this.nextFoldedLineRow();
		
		while (this.foldedLineRow?.rowIndexInLine < firstLineRowIndex) {
			this.nextFoldedLineRow();
		}
		
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
				this.nodeStack = next.stack();
				
				this.setColor();
				this.setNextNodeToEnter();
			}
		}
	}
}

module.exports = function(...args) {
	let renderer = new Renderer(...args);
	
	renderer.render();
}
