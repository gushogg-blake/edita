let wordRe = /\w/;
let startWordRe = /^\w+/;
let endWordRe = /\w+$/;

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
			rows: [
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
		this.rows = [{
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
		
		this.rows.push({
			startOffset,
			string: "",
			width: 0,
			variableWidthParts: [],
		});
		
		this.availableCols = this.textCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	get currentRow() {
		return this.rows[this.rows.length - 1];
	}
	
	addTabToCurrentRow(part) {
		let row = this.currentRow;
		
		row.string += "\t";
		row.width += part.width;
		row.variableWidthParts.push(part);
		
		this.currentlyAvailableCols -= part.width;
		this.startOffset++;
	}
	
	addStringToCurrentRow(string) {
		let row = this.currentRow;
		
		row.string += string;
		row.width += string.length;
		
		row.variableWidthParts.push({
			type: "string",
			string,
		});
		
		this.currentlyAvailableCols -= string.length;
		this.startOffset += string.length;
	}
	
	wrap() {
		if (!platform.prefs.wrap || !this.requiresWrapping()) {
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
					
					if (toEnd[toEnd.length - 1].match(wordRe) && overflow && overflow[0].match(wordRe)) {
						let [endWord] = toEnd.match(endWordRe);
						
						toEnd = toEnd.substr(0, toEnd.length - endWord.length);
						
						if (toEnd) {
							overflow = endWord + overflow;
						} else {
							toEnd = endWord;
							overflow = string.substr(toEnd.length);
						}
					}
					
					if (toEnd) {
						this.addStringToCurrentRow(toEnd);
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
		let {line, rows} = this;
		
		return {
			line,
			height: rows.length,
			rows,
		};
	}
}

module.exports = function(line, indentation, measurements, availableWidth) {
	let wrapper = new LineWrapper(line, indentation, measurements, availableWidth);
	
	return wrapper.wrap();
}
