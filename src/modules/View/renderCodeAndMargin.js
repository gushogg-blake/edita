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
		
		this.offset = null;
		this.variableWidthPart = null;
		this.nodeStack = [];
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
	
	get nodeLineIndex() {
		return this.nodeWithRange && nodeGetters.startPosition(this.nodeWithRange.node).row;
	}
	
	get nodeOffset() {
		return this.nodeWithRange && nodeGetters.startPosition(this.nodeWithRange.node).column;
	}
	
	get offsetInRow() {
		return this.offset - this.lineRow.startOffset;
	}
	
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
	
	nodeIsAtCursor() {
		return this.nodeLineIndex === this.lineIndex && this.nodeOffset === this.offset;
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
		
		this.nodeWithRange = document.findSmallestNodeAtCharCursor(this.cursor);
		this.nextNodeWithRange = document.findFirstNodeAfterCursor(this.cursor);
		
		let nodesBeforeCursor = [];
		let nodeWithRange = this.nodeWithRange;
		
		while (nodeWithRange) {
			if (Cursor.isBefore(treeSitterPointToCursor(nodeWithRange.node.startPosition), this.cursor)) {
				nodesBeforeCursor.unshift(nodeWithRange);
			}
			
			nodeWithRange = nodeWithRange.parent();
		}
		
		this.nodeStack = nodesBeforeCursor;
		
		this.setColor();
		
		this.startRow();
		
		while (true) {
			if (!this.variableWidthPart) {
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
				
				continue;
			}
			
			if (this.variableWidthPart.type === "tab") {
				renderCode.drawTab(this.variableWidthPart.width);
				
				this.offset++;
				
				this.nextVariableWidthPart();
				
				continue;
			}
			
			let currentNodeEnd = Infinity;
			
			if (this.nodeWithRange && this.nodeWithRange.node.startPosition.row === this.lineIndex) {
				currentNodeEnd = this.nodeWithRange.node.startPosition.column;
			}
			
			let nextNodeStart = Infinity;
			
			if (this.nextNodeWithRange && this.nextNodeWithRange.node.startPosition.row === this.lineIndex) {
				nextNodeStart = this.nextNodeWithRange.node.startPosition.column;
			}
			
			let partEnd = this.variableWidthPart.offset + this.variableWidthPart.string.length;
			
			let renderTo = Math.min(currentNodeEnd, nextNodeStart, partEnd);
			let length = renderTo - this.offset;
			
			renderCode.drawText(this.variableWidthPart.string.substring(this.offset - this.variableWidthPart.offset, renderTo - this.variableWidthPart.offset));
			
			this.offset += length;
			
			if (renderTo === partEnd) {
				this.nextVariableWidthPart();
			}
		}
	}
}

module.exports = function(...args) {
	let renderer = new Renderer(...args);
	
	renderer.render();
}
