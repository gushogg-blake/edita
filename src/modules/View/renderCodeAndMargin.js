let Cursor = require("modules/utils/Cursor");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");

let {c} = Cursor;

class Renderer {
	constructor(view, renderCode, renderMargin, renderFoldHilites) {
		this.view = view;
		this.renderCode = renderCode;
		this.renderMargin = renderMargin;
		this.renderFoldHilites = renderFoldHilites;
		
		this.nodeWithLang = null;
		this.lineIndex = null;
		this.offset = null;
		this.offsetInRow = 0;
	}
	
	*generateVariableWidthParts() {
		this.partOffsetInRow = 0;
		
		for (let part of this.foldedLineRow.lineRow.variableWidthParts) {
			yield part;
			
			this.partOffsetInRow += part.type === "tab" ? 1 : part.string.length;
		}
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
	
	/*
	look for nodes starting from the indent to find the node quicker.  in HTML
	the start of the line will sometimes be within a text node that spans
	multiple lines, so findFirstNodeOnOrAfterCursor will descend to that node
	and then have to return the next node
	*/
	
	get trimmedCursor() {
		return c(this.lineIndex, this.view.document.lines[this.lineIndex].indentOffset);
	}
	
	get nodeLineIndex() {
		return this.nodeWithLang && nodeGetters.startPosition(this.nodeWithLang.node).row;
	}
	
	get nodeOffset() {
		return this.nodeWithLang && nodeGetters.startPosition(this.nodeWithLang.node).column;
	}
	
	nextFoldedLineRow() {
		this.foldedLineRow = this.foldedLineRowGenerator.next().value;
		this.lineIndex = this.foldedLineRow?.lineIndex;
		this.offset = this.lineRow?.startOffset;
	}
	
	nextVariableWidthPart() {
		this.variableWidthPart = this.variableWidthPartGenerator.next().value;
	}
	
	nextNode() {
		this.nodeWithLang = this.nodeWithLangGenerator.next().value;
	}
	
	nodeIsAtCursor() {
		return this.nodeLineIndex === this.lineIndex && this.nodeOffset === this.offset;
	}
	
	setStartingColour(lineIndex) {
		let {scope, node} = this.view.document.findFirstNodeToRender(lineIndex);
		
		if (node) {
			this.setColour(scope.lang, node);
		}
	}
	
	setColour(lang=null, node=null) {
		if (!lang) {
			({lang, node} = this.nodeWithLang);
		}
		
		let {colors} = base.prefs.langs[lang.code];
		let hiliteClass = lang.getHiliteClass(node);
		
		if (!hiliteClass) {
			return;
		}
		
		this.renderCode.setColour(colors[hiliteClass]);
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
		
		this.setStartingColour(firstLineIndex);
		
		let {height} = sizes;
		let {rowHeight} = measurements;
		let rowsToRender = Math.ceil(height / rowHeight) + 1;
		let rowsRendered = 0;
		
		this.foldedLineRowGenerator = view.generateLineRowsFolded(firstLineIndex);
		this.nextFoldedLineRow();
		
		while (this.foldedLineRow?.rowIndexInLine < firstLineRowIndex) {
			this.nextFoldedLineRow();
		}
		
		this.variableWidthPartGenerator = this.generateVariableWidthParts();
		this.nextVariableWidthPart();
		
		this.nodeWithLangGenerator = document.generateNodesFromCursorWithLang(this.trimmedCursor);
		this.nextNode();
		
		this.startRow();
		
		while (true) {
			if (this.nodeLineIndex < this.lineIndex) {
				this.nodeWithLangGenerator = document.generateNodesFromCursorWithLang(this.trimmedCursor);
				this.nextNode();
			}
			
			while (this.nodeIsAtCursor()) {
				this.setColour();
				this.nextNode();
			}
			
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
				
				this.variableWidthPartGenerator = this.generateVariableWidthParts();
				this.nextVariableWidthPart();
				
				this.offsetInRow = 0;
				
				if (this.rowIndexInLine === 0) {
					this.offset = 0;
				}
				
				this.startRow();
				
				continue;
			}
			
			if (this.variableWidthPart.type === "tab") {
				renderCode.drawTab(this.variableWidthPart.width);
				
				this.offset++;
				this.offsetInRow++;
				
				this.nextVariableWidthPart();
			} else if (this.variableWidthPart.type === "string") {
				let {string} = this.variableWidthPart;
				
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
				this.offsetInRow += length;
				
				if (renderTo === string.length) {
					this.nextVariableWidthPart();
				}
			}
		}
	}
}

module.exports = function(...args) {
	let renderer = new Renderer(...args);
	
	renderer.render();
}
