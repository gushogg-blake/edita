let Cursor = require("modules/utils/Cursor");
let nodeGetters = require("modules/utils/treeSitter/nodeGetters");

let {c} = Cursor;

function getOffset(hint) {
	return ("offset" in hint) ? hint.offset : nodeGetters.startPosition(hint.node).column;
}

module.exports = {
	*generateInitialColourHints(lineIndex) {
		let {scope, node} = this.document.findFirstNodeToRender(lineIndex);
		
		if (!node) {
			return;
		}
		
		yield* scope.lang.generateRenderHints(node);
	},
	
	*generateVariableWidthParts(lineRow) {
		let offsetInRow = 0;
		
		for (let part of lineRow.variableWidthParts) {
			yield {
				...part,
				offsetInRow,
			};
			
			offsetInRow += part.type === "tab" ? 1 : part.string.length;
		}
	},
	
	renderCodeAndMargin(renderCode, renderMargin) {
		let {
			document,
			measurements,
			sizes,
		} = this;
		
		let {
			lineIndex: firstLineIndex,
			rowIndexInLine: firstLineRowIndex,
		} = this.findFirstVisibleLine();
		
		for (let hint of this.generateInitialColourHints(firstLineIndex)) {
			renderCode.setColour(hint);
		}
		
		let {height} = sizes;
		let {rowHeight} = measurements;
		let rowsToRender = Math.ceil(height / rowHeight);
		let rowsRendered = 0;
		
		let foldedLineRowGenerator = this.generateLineRowsFolded(firstLineIndex);
		let foldedLineRow = foldedLineRowGenerator.next().value;
		
		while (foldedLineRow && foldedLineRow.rowIndexInLine < firstLineRowIndex) {
			foldedLineRow = foldedLineRowGenerator.next().value;
		}
		
		let offsetInLine = foldedLineRow.lineRow.startOffset;
		let offsetInRow = 0;
		
		let variableWidthPartGenerator = this.generateVariableWidthParts(foldedLineRow.lineRow);
		let variableWidthPart = variableWidthPartGenerator.next().value;
		
		let hintGenerator = document.generateRenderHintsFromCursor(c(firstLineIndex, offsetInLine));
		let hint = hintGenerator.next().value;
		
		if (foldedLineRow.rowIndexInLine === 0) {
			renderMargin.drawLineNumber(foldedLineRow.lineIndex);
		}
		
		renderCode.startRow(foldedLineRow.rowIndexInLine === 0 ? 0 : foldedLineRow.line.indentCols);
		
		while (true) {
			if (!variableWidthPart) {
				renderCode.endRow();
				renderMargin.endRow();
				
				rowsRendered++;
				
				if (rowsRendered === rowsToRender) {
					break;
				}
				
				foldedLineRow = foldedLineRowGenerator.next().value;
				
				if (!foldedLineRow) {
					break;
				}
				
				variableWidthPartGenerator = this.generateVariableWidthParts(foldedLineRow.lineRow);
				variableWidthPart = variableWidthPartGenerator.next().value;
				offsetInRow = 0;
				
				if (foldedLineRow.rowIndexInLine === 0) {
					offsetInLine = 0;
				}
				
				renderCode.startRow(foldedLineRow.rowIndexInLine === 0 ? 0 : foldedLineRow.line.indentCols);
				
				if (foldedLineRow.rowIndexInLine === 0) {
					renderMargin.drawLineNumber(foldedLineRow.lineIndex);
				}
				
				continue;
			}
			
			if (hint && nodeGetters.startPosition(hint.node).row < foldedLineRow.lineIndex) {
				hintGenerator = document.generateRenderHintsFromCursor(c(foldedLineRow.lineIndex, offsetInLine));
				hint = hintGenerator.next().value;
			}
			
			while (hint && nodeGetters.startPosition(hint.node).row === foldedLineRow.lineIndex && getOffset(hint) === offsetInLine) {
				renderCode.setColour(hint);
				
				hint = hintGenerator.next().value;
			}
			
			if (variableWidthPart.type === "tab") {
				renderCode.drawTab(variableWidthPart.width);
				
				offsetInLine++;
				offsetInRow++;
				variableWidthPart = variableWidthPartGenerator.next().value;
			} else if (variableWidthPart.type === "string") {
				let {string, offsetInRow: stringOffsetInRow} = variableWidthPart;
				
				let nextHintOffsetInRowOrEnd = (
					hint && nodeGetters.startPosition(hint.node).row === foldedLineRow.lineIndex
					? getOffset(hint) - foldedLineRow.lineRow.startOffset
					: foldedLineRow.lineRow.string.length
				);
				
				let renderFrom = offsetInRow - stringOffsetInRow;
				let renderTo = Math.min(string.length, nextHintOffsetInRowOrEnd - stringOffsetInRow);
				let length = renderTo - renderFrom;
				
				renderCode.drawText(string.substring(renderFrom, renderTo));
				
				offsetInLine += length;
				offsetInRow += length;
				
				if (renderTo === string.length) {
					variableWidthPart = variableWidthPartGenerator.next().value;
				}
			}
		}
	},
};
