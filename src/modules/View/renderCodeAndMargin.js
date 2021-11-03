module.exports = {
	*generateInitialColourHints(lineIndex) {
		let {scope, node} = this.document.findFirstNodeToRender(lineIndex);
		
		if (!node) {
			return;
		}
		
		yield* scope.lang.generateRenderHints(node);
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
			renderCode.initialColourHint(hint);
		}
		
		let {height} = sizes;
		let {rowHeight} = measurements;
		let rowsToRender = Math.ceil(height / rowHeight);
		
		let rowGenerator = this.generateRowsFolded(firstLineIndex);
		let row = rowGenerator.next().value;
		
		while (row && row.rowIndexInLine < firstLineRowIndex) {
			row = rowGenerator.next().value;
		}
		
		let offsetInLine = row.startOffset;
		let offsetInRow = 0;
		
		let hintGenerator = document.generateRenderHintsFromCursor(c(firstLineIndex, offsetInLine));
		let hint = hintGenerator.next().value;
		
		while (true) {
			
		}
	},
};
