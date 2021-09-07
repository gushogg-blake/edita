function *generateRowsToRender() {
	
	//console.time("generateRowsToRender");
	
	let {height} = this.sizes;
	
	let {rowHeight, colWidth} = this.measurements;
	
	let rowsToRender = height / rowHeight;
	let rowsRendered = 0;
	
	let firstVisibleLine = this.findFirstVisibleLine();
	
	/*
	when switching away from a tab the view will unwrap all lines, so if the last
	line is wrapped and we're scrolled right to the bottom, there will be no
	visible line at first when switching back to the tab.  the next resize will
	re-wrap the lines and rerender.
	*/
	
	if (!firstVisibleLine) {
		return;
	}
	
	let {
		lineIndex: firstLineIndex,
		rowIndex: firstLineRowIndex,
	} = firstVisibleLine;
	
	let lastVisibleLineIndex = this.findLastVisibleLineIndex(firstVisibleLine);
	
	let decoratedLines = this.document.getDecoratedLines(firstLineIndex, lastVisibleLineIndex);
	let lineIndex = firstLineIndex;
	
	for (let decoratedLine of decoratedLines) {
		let wrappedLine = this.wrappedLines[lineIndex];
		let line = this.lines[lineIndex];
		let rowIndex = 0;
		let offsetInRow = 0;
		let overflow = null;
		let renderCommands = [];
		
		if (decoratedLine.renderCommands.length === 0) {
			yield {
				lineIndex,
				rowIndex,
				wrapIndent: 0,
				renderCommands: [],
			};
		} else {
			for (let command of decoratedLine.renderCommands) {
				if (overflow) {
					renderCommands.push(overflow);
					
					offsetInRow += overflow.string.length;
					
					overflow = null;
				}
				
				let {string, node, lang} = command;
				
				if (string) {
					let overflowLength = offsetInRow + string.length - wrappedLine.rows[rowIndex].string.length;
					
					if (overflowLength > 0) {
						if (lineIndex > firstLineIndex || rowIndex > firstLineRowIndex) {
							renderCommands.push({
								string: string.substr(0, string.length - overflowLength),
								node,
								lang,
							});
							
							yield {
								lineIndex,
								rowIndex,
								wrapIndent: rowIndex > 0 ? line.indentCols : 0,
								renderCommands,
							};
						}
						
						renderCommands = [];
						rowIndex++;
						offsetInRow = 0;
						
						overflow = {
							string: string.substr(string.length - overflowLength),
							node,
							lang,
						};
					} else {
						renderCommands.push(command);
						
						offsetInRow += string.length;
						
						if (overflowLength === 0) {
							yield {
								lineIndex,
								rowIndex,
								wrapIndent: rowIndex > 0 ? line.indentCols : 0,
								renderCommands,
							};
							
							renderCommands = [];
							rowIndex++;
							offsetInRow = 0;
						}
					}
				} else {
					renderCommands.push(command);
				}
			}
			
			if (overflow) {
				renderCommands.push(overflow);
			}
			
			if (renderCommands.length > 0) {
				yield {
					lineIndex,
					rowIndex,
					wrapIndent: rowIndex > 0 ? line.indentCols : 0,
					renderCommands,
				};
			}
		}
		
		lineIndex++;
	}
	
	//console.timeEnd("generateRowsToRender");
	
}

module.exports = generateRowsToRender;
