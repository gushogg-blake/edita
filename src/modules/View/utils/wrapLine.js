/*
- if the whole string fits on the line, next break point is the end of
  the string (no wrap)

- otherwise, find the last word, and if it fits on a line, break before it
  - else break at the end col
*/

function findNextBreakPoint(string, stringStartOffset, currentlyAvailableCols, availableCols) {
	let str = string.substr(stringStartOffset);
	
	if (str.length <= currentlyAvailableCols) {
		return string.length;
	}
	
	let beforeEnd = str.substr(0, currentlyAvailableCols);
	
	let {index: lastWordIndex} = beforeEnd.match(/([^\w_]|[\w_]+)$/);
	
	let [lastWord] = str.substr(lastWordIndex).match(/^([^\w_]|[\w_]+)/);
	
	if (lastWord.length > availableCols) {
		return stringStartOffset + currentlyAvailableCols;
	} else {
		if (lastWordIndex + lastWord.length > currentlyAvailableCols) {
			return stringStartOffset + lastWordIndex;
		} else {
			return stringStartOffset + lastWordIndex + lastWord.length;
		}
	}
}

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
			renderCommands,
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
					renderCommands,
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
			renderCommands: [],
		}];
		
		this.startOffset = 0;
		this.availableCols = this.screenCols;
		this.currentlyAvailableCols = this.availableCols;
		
		this.commandIndex = -1;
		this.consumingString = "";
	}
	
	wordFitsOnCurrentRow(word) {
		if (word.type === "tab") {
			return word.width <= this.currentlyAvailableCols;
		} else if (word.type === "node") {
			return word.node.text.length <= this.currentlyAvailableCols;
		} else if (word.type === "string") {
			return word.string.length <= this.currentlyAvailableCols;
		} else {
			return true;
		}
	}
	
	nextRow() {
		let {startOffset} = this;
		
		this.rows.push({
			startOffset,
			string: "",
			width: 0,
			variableWidthParts: [],
			renderCommands: [],
		});
		
		this.availableCols = this.textCols;
		this.currentlyAvailableCols = this.availableCols;
	}
	
	getNextWord() {
		if (this.consumingString) {
			let [nextWord] = this.consumingString.match(/^([^\w_]|[\w_]+)/);
			
			this.consumingString = this.consumingString.substr(nextWord.length);
			
			return {
				type: "string",
				string: nextWord,
			};
		} else {
			this.commandIndex++;
			
			let command = this.line.renderCommands[this.commandIndex];
			
			if (!command) {
				return null;
			}
			
			if (command.type === "string") {
				this.consumingString = command.string;
				
				return this.getNextWord();
			} else {
				return command;
			}
		}
	}
	
	addWordToCurrentRow(word) {
		let row = this.rows[this.rows.length - 1];
		
		if (word.type === "tab") {
			row.string += "\t";
			row.width += word.width;
			row.variableWidthParts.push(word);
			row.renderCommands.push(word);
			
			this.currentlyAvailableCols -= word.width;
			
			this.startOffset++;
		} else if (word.type === "node") {
			let string = word.node.text;
			
			row.string += string;
			row.width += string.length;
			
			row.variableWidthParts.push({
				type: "string",
				string,
			});
			
			row.renderCommands.push(word);
			
			this.currentlyAvailableCols -= string.length;
			
			this.startOffset += string.length;
		} else if (word.type === "string") {
			let {string} = word;
			
			row.string += string;
			row.width += string.length;
			
			row.variableWidthParts.push({
				type: "string",
				string,
			});
			
			row.renderCommands.push(word);
			
			this.currentlyAvailableCols -= string.length;
			
			this.startOffset += string.length;
		} else {
			row.renderCommands.push(word);
		}
	}
	
	wrap() {
		if (!this.requiresWrapping()) {
			return this.unwrapped();
		}
		
		this.init();
		
		while (true) {
			let word = this.getNextWord();
			
			if (!word) {
				break;
			}
			
			if (!this.wordFitsOnCurrentRow(word)) {
				this.nextRow();
			}
			
			this.addWordToCurrentRow(word);
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
