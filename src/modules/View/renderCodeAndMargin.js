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
	
	*generateVariableWidthParts(row) {
		let offsetInRow = 0;
		
		for (let part of row.variableWidthParts) {
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
		
		let rowGenerator = this.generateRowsFolded(firstLineIndex);
		let row = rowGenerator.next().value;
		
		while (row && row.rowIndexInLine < firstLineRowIndex) {
			row = rowGenerator.next().value;
		}
		
		let offsetInLine = row.row.startOffset;
		let offsetInRow = 0;
		
		let variableWidthPartGenerator = this.generateVariableWidthParts(row.row);
		let variableWidthPart = variableWidthPartGenerator.next().value;
		
		let hintGenerator = document.generateRenderHintsFromCursor(c(firstLineIndex, offsetInLine));
		let hint = hintGenerator.next().value;
		//let hintOffset = hint && getOffset(hint);
		
		//console.log(firstLineIndex, offsetInLine);
		//console.log(row.rowIndexInLine);
		//console.log(hint);
		//console.log(variableWidthPart);
		//console.log(row);
		
		if (row.rowIndexInLine === 0) {
			renderMargin.drawLineNumber(row.lineIndex);
		}
		
		renderCode.startRow(row.rowIndexInLine === 0 ? 0 : row.line.indentCols);
		
		let i = 0;
		
		while (true) {
			//break;
			//if (!variableWidthPart) {
			//	break;
			//}
			
			if (!variableWidthPart) {
				renderCode.endRow();
				renderMargin.endRow();
				
				rowsRendered++;
				
				if (rowsRendered === rowsToRender) {
					break;
				}
				
				row = rowGenerator.next().value;
				
				if (!row) {
					break;
				}
				
				variableWidthPartGenerator = this.generateVariableWidthParts(row.row);
				variableWidthPart = variableWidthPartGenerator.next().value;
				offsetInRow = 0;
				
				if (row.rowIndexInLine === 0) {
					offsetInLine = 0;
				}
				
				renderCode.startRow(row.rowIndexInLine === 0 ? 0 : row.line.indentCols);
				
				if (row.rowIndexInLine === 0) {
					renderMargin.drawLineNumber(row.lineIndex);
				}
				
				continue;
			}
			
			if (hint && nodeGetters.startPosition(hint.node).row < row.lineIndex) {
				hintGenerator = document.generateRenderHintsFromCursor(c(row.lineIndex, offsetInLine));
				hint = hintGenerator.next().value;
			}
			
			while (hint && nodeGetters.startPosition(hint.node).row === row.lineIndex && getOffset(hint) === offsetInLine) {
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
					hint && nodeGetters.startPosition(hint.node).row === row.lineIndex
					? getOffset(hint) - row.row.startOffset
					: row.row.string.length
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
			
			i++;
			
			if (i > 10000) {
				console.log("??");
				break;
			}
		}
	},
};
