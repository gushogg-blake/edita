let regexMatch = require("utils/regexMatch");

let endWordRe = /\S*\w+[\S\w]*\s*$/;
let wordRe = /\S*\w+[\S\w]*\s*/g;

class LineWrapper {
	constructor(line, indentation, measurements, availableWidth) {
		this.line = line;
		this.indentation = indentation;
		this.measurements = measurements;
		this.availableWidth = availableWidth;
		
		this.screenCols = Math.floor(availableWidth / measurements.colWidth);
		this.textCols = this.screenCols - line.indentCols;
	}
	
	requiresWrapping() {
		if (this.availableWidth < this.measurements.colWidth) {
			return false;
		}
		
		if (this.line.width <= this.screenCols) {
			return false;
		}
		
		if (this.textCols < this.indentation.colsPerIndent) {
			return false;
		}
		
		return true;
	}
	
	unwrapped() {
		let {line} = this;
		
		let {
			string,
			width,
			variableWidthParts,
		} = line;
		
		return {
			line,
			height: 1,
			lineRows: [
				{
					startOffset: 0,
					string,
					width,
					variableWidthParts,
				},
			],
		};
	}
	
	init() {
		this.lineRows = [{
			startOffset: 0,
			string: "",
			width: 0,
			variableWidthParts: [],
		}];
		
		this.startOffset = 0;
		this.availableCols = this.screenCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	nextRow() {
		let {startOffset} = this;
		
		this.lineRows.push({
			startOffset,
			string: "",
			width: 0,
			variableWidthParts: [],
		});
		
		this.availableCols = this.textCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	get currentLineRow() {
		return this.lineRows[this.lineRows.length - 1];
	}
	
	addTabToCurrentRow(part) {
		let lineRow = this.currentLineRow;
		
		lineRow.string += "\t";
		lineRow.width += part.width;
		lineRow.variableWidthParts.push(part);
		
		this.currentlyAvailableCols -= part.width;
		this.startOffset++;
	}
	
	addStringToCurrentLineRow(string) {
		let lineRow = this.currentLineRow;
		
		lineRow.string += string;
		lineRow.width += string.length;
		
		lineRow.variableWidthParts.push({
			type: "string",
			string,
		});
		
		this.currentlyAvailableCols -= string.length;
		this.startOffset += string.length;
	}
	
	wrap(wrap, isFoldHeader) {
		if (isFoldHeader || !wrap || !this.requiresWrapping()) {
			return this.unwrapped();
		}
		
		this.init();
		
		for (let part of this.line.variableWidthParts) {
			if (part.type === "tab") {
				if (part.width > this.currentlyAvailableCols) {
					this.nextRow();
				}
				
				this.addTabToCurrentRow(part);
			} else {
				let {string} = part;
				
				while (string) {
					let toEnd = string.substr(0, this.currentlyAvailableCols);
					let overflow = string.substr(toEnd.length);
					let endWord = regexMatch(toEnd, endWordRe);
					
					if (endWord) {
						wordRe.lastIndex = toEnd.length - endWord.length;
						
						let [fullWord] = wordRe.exec(string);
						
						if (fullWord.length > endWord.length) {
							toEnd = toEnd.substr(0, toEnd.length - endWord.length);
							
							if (toEnd) {
								overflow = endWord + overflow;
							} else {
								toEnd = endWord;
								overflow = string.substr(toEnd.length);
							}
						}
					}
					
					if (toEnd) {
						this.addStringToCurrentLineRow(toEnd);
					}
					
					if (overflow) {
						this.nextRow();
					}
					
					string = overflow;
				}
			}
		}
		
		return this.result();
	}
	
	result() {
		let {line, lineRows} = this;
		
		return {
			line,
			height: lineRows.length,
			lineRows,
		};
	}
}

module.exports = function(wrap, line, isFoldHeader, indentation, measurements, availableWidth) {
	let wrapper = new LineWrapper(line, indentation, measurements, availableWidth);
	
	return wrapper.wrap(wrap, isFoldHeader);
}
