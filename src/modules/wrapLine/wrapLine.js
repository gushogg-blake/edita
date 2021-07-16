let {minNonWhitespaceCols, wordRe} = require("./config");
let getCurrentWordWidth = require("./getCurrentWordWidth");
let unwrapLine = require("./unwrapLine");

module.exports = function(line, indentation, measurements, availableWidth) {
	let {colWidth} = measurements;
	let screenCols = Math.floor(availableWidth / colWidth);
	
	unwrapLine(line);
	
	if (availableWidth < colWidth) {
		return;
	}
	
	if (line.width <= screenCols) {
		return;
	}
	
	/*
	calculate indent width to 1) check whether initial whitespace should
	be treated as an indent or just a long string of spaces (depending on
	how much space there would be left for non-whitespace characters), and
	2) indent wrapped lines to the same level as the main line
	*/
	
	let textCols = screenCols - line.indentOffset;
	
	if (textCols < indentation.colsPerIndent) {
		return;
	}
	
	line.wrappedLines = [];
	
	let availableCols = screenCols;
	let currentlyAvailableCols = availableCols;
	
	let wrappedLine = {
		string: "",
		width: 0,
		tokens: [],
	};
	
	/*
	3 scenarios:
	
	- current word + space fits on line -- add to current line
	- current word + space doesn't fit on line, and current word is bigger than an entire line -- fill current line with substring of current word and start a new line
	- current word + space doesn't fit on line, and current word fits on a line -- start a new line
	*/
	
	let tokens = [...line.tokens];
	let col = 0;
	
	while (true) {
		let currentWordWidth = getCurrentWordWidth(line, col);
		
		if (currentWordWidth <= currentlyAvailableCols) {
			// word fits on current line - add to current line
			
			while (true) {
				let token = tokens.shift();
				
				if (!token) {
					break;
				}
				
				let [type, value] = token;
				
				if (type !== "string" && type !== "tab") {
					wrappedLine.tokens.push(token);
					
					continue;
				}
				
				if (type === "tab") {
					let width = value;
					
					wrappedLine.tokens.push(token);
					wrappedLine.width += width;
					wrappedLine.string += "\t";
					
					col += width;
					
					break;
				}
				
				let word = value.match(wordRe)[0];
				
				if (word.length < value.length) {
					let rest = value.substr(word.length);
					
					tokens.unshift([type, rest]);
				}
				
				wrappedLine.tokens.push([type, word]);
				wrappedLine.width += word.length;
				wrappedLine.string += word;
				
				col += word.length;
				
				break;
			}
			
			currentlyAvailableCols = availableCols - wrappedLine.width;
		} else {
			if (currentWordWidth > availableCols) {
				// word doesn't fit on a line - split it to fill the current
				// line and then start a new line
				
				while (true) {
					let token = tokens.shift();
					
					let [type, value] = token;
					
					if (type !== "string") {
						wrappedLine.tokens.push(token);
						
						continue;
					}
					
					let [fill, rest] = [value.substr(0, currentlyAvailableCols), value.substr(currentlyAvailableCols)];
					
					if (rest.length > 0) {
						tokens.unshift([type, rest]);
					}
					
					wrappedLine.tokens.push([type, fill]);
					wrappedLine.width += fill.length;
					wrappedLine.string += fill;
					
					col += fill.length;
					
					if (wrappedLine.width === availableCols) {
						break;
					}
				}
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					string: "",
					width: 0,
					tokens: [],
				};
				
				availableCols = textCols;
				currentlyAvailableCols = availableCols;
			} else {
				// word doesn't fit on current line but will fit on next line
				// - start a new line
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					string: "",
					width: 0,
					tokens: [],
				};
				
				availableCols = textCols;
				currentlyAvailableCols = availableCols;
			}
		}
		
		if (col === line.width) {
			break;
		}
	}
	
	if (wrappedLine.width > 0) {
		line.wrappedLines.push(wrappedLine);
	}
	
	line.height = line.wrappedLines.length;
}
