class RenderLine {
	constructor(lineIndex, line, decoratedLine, wrappedLine) {
		this.lineIndex = lineIndex;
		this.line = line;
		this.decoratedLine = decoratedLine;
		this.wrappedLine = wrappedLine;
		
		
		this.rowIndex = 0;
		this.offsetInRow = 0;
		this.overflow = null;
		this.renderCommands = [];
	}
	
	row() {
		let row = {
			lineIndex: this.lineIndex,
			rowIndex: this.rowIndex,
			wrapIndent: this.rowIndex > 0 ? this.line.indentCols : 0,
			renderCommands: this.renderCommands,
		};
		
		this.renderCommands = [];
		this.rowIndex++;
		this.offsetInRow = 0;
		
		return row;
	}
	
	*generateRows() {
		let {
			lineIndex,
			line,
			decoratedLine,
			wrappedLine,
		} = this;
		
		if (decoratedLine.renderCommands.length === 0) {
			yield this.row();
			
			return;
		}
		
		for (let command of decoratedLine.renderCommands) {
			if (this.overflow) {
				this.renderCommands.push(this.overflow);
				this.offsetInRow += this.overflow.string.length;
				this.overflow = null;
			}
			
			let {string, node, lang} = command;
			
			if (string) {
				let overflowLength = this.offsetInRow + string.length - wrappedLine.rows[this.rowIndex].string.length;
				
				if (overflowLength > 0) {
					if (overflowLength < string.length) {
						this.renderCommands.push({
							string: string.substr(0, string.length - overflowLength),
							node,
							lang,
						});
					}
					
					yield this.row();
					
					this.overflow = {
						string: string.substr(string.length - overflowLength),
						node,
						lang,
					};
				} else {
					this.renderCommands.push(command);
					
					this.offsetInRow += string.length;
				}
			} else {
				this.renderCommands.push(command);
			}
		}
		
		if (this.overflow) {
			this.renderCommands.push(this.overflow);
		}
		
		if (this.renderCommands.length > 0) {
			yield this.row();
		}
	}
}

function *generateRowsToRender() {
	if (platform.getPref("dev.timing.generateRowsToRender")) {
		console.time("generateRowsToRender");
	}
	
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
		let renderLine = new RenderLine(lineIndex, line, decoratedLine, wrappedLine);
		
		for (let row of renderLine.generateRows()) {
			if (lineIndex > firstLineIndex || row.rowIndex >= firstLineRowIndex) {
				yield row;
			}
		}
		
		lineIndex++;
	}
	
	if (platform.getPref("dev.timing.generateRowsToRender")) {
		console.timeEnd("generateRowsToRender");
	}
}

module.exports = generateRowsToRender;
