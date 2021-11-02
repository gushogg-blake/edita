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
	
	*processStringCommand(command) {
		let {wrappedLine} = this;
		let {string, node, lang} = command;
		
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
			
			yield* this.processStringCommand(this.overflow);
		} else {
			this.renderCommands.push(command);
			
			this.offsetInRow += string.length;
			
			this.overflow = null;
		}
	}
	
	*generateRows() {
		let {decoratedLine, wrappedLine} = this;
		
		if (decoratedLine.renderCommands.length === 0) {
			yield this.row();
			
			return;
		}
		
		for (let command of decoratedLine.renderCommands) {
			let {string, node, lang} = command;
			
			if (string) {
				yield* this.processStringCommand(command);
			} else {
				this.renderCommands.push(command);
			}
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
	
	let {
		lineIndex: firstLineIndex,
		rowIndexInLine: firstLineRowIndex,
	} = firstVisibleLine;
	
	//let {height} = this.sizes;
	//let {rowHeight} = this.measurements;
	//let rowsToRender = Math.ceil(height / rowHeight);
	//
	//let rowGenerator = this.generateRowsFolded(firstLineIndex);
	//let hintGenerator = this.document.generateRenderHints(c(firstLineIndex, 0));
	//
	//while (true) {
	//	
	//}
	
	let lastVisibleLineIndex = this.findLastVisibleLineIndex(firstVisibleLine);
	
	let decoratedLines = this.document.getDecoratedLines(firstLineIndex, lastVisibleLineIndex);
	let lineIndex = firstLineIndex;
	
	for (let decoratedLine of decoratedLines) {
		let wrappedLine = this.wrappedLines[lineIndex];
		let line = this.lines[lineIndex];
		let renderLine = new RenderLine(lineIndex, line, decoratedLine, wrappedLine);
		
		for (let row of renderLine.generateRows()) {
			if (lineIndex === firstLineIndex && row.rowIndex < firstLineRowIndex) {
				continue;
			}
			
			yield row;
		}
		
		lineIndex++;
	}
	
	if (platform.getPref("dev.timing.generateRowsToRender")) {
		console.timeEnd("generateRowsToRender");
	}
}

module.exports = generateRowsToRender;
