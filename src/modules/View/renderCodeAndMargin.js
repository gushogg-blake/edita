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
		let offsetInRow = 0;
		
		for (let part of this.lineRow.variableWidthParts) {
			yield {
				...part,
				offsetInRow,
			};
			
			offsetInRow += part.type === "tab" ? 1 : part.string.length;
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
		
		this.rowsToRender = Math.ceil(height / rowHeight) + 1;
		this.rowsRendered = 0;
		
		this.foldedLineRowGenerator = view.generateLineRowsFolded(firstLineIndex);
		this.nextFoldedLineRow();
		
		while (this.foldedLineRow?.rowIndexInLine < firstLineRowIndex) {
			this.nextFoldedLineRow();
		}
		
		this.nodeWithRange = document.findSmallestNodeAtCharCursor(this.cursor);
		this.nextNodeWithRange = document.findFirstNodeAfterCursor(this.cursor);
		
		let nodesBeforeCursor = [];
		let nodeWithRange = this.nodeWithScopeGenerator.next().value;
		
		while (nodeWithRange) {
			let {scope, node} = nodeWithRange;
			
			if (Cursor.isBefore(treeSitterPointToCursor(node.startPosition), this.cursor)) {
				nodesBeforeCursor.unshift(nodeWithRange);
			}
			
			nodeWithRange = scope.getNodeParent(node);
		}
		
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
			
			let {string} = this.variableWidthPart;
			
			//let 
			
			let nextNodeOffsetInRowOrEnd = (
				this.nodeLineIndex === this.lineIndex
				? this.nodeOffset - this.lineRow.startOffset
				: this.lineRow.string.length
			);
			
			let renderFrom = this.offsetInRow - this.partOffsetInRow;
			let renderTo = Math.min(string.length, nextNodeOffsetInRowOrEnd - this.partOffsetInRow);
			let length = renderTo - renderFrom;
			
			renderCode.drawText(string.substring(renderFrom, renderTo));
			
			this.offset += length;
			
			if (renderTo === string.length) {
				this.nextVariableWidthPart();
			}
		}
	}
}

module.exports = function(...args) {
	let renderer = new Renderer(...args);
	
	renderer.render();
}
