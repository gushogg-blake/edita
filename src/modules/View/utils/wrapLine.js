let regexMatch = require("utils/regexMatch");

let re = {
	multiCharWord: /^[\w_]+/,
	word: /[\w_]/,
};

function getCurrentWordWidth(type, value, stringStartOffset) {
	let str = value.substr(stringStartOffset);
	
	if (str[0].match(re.word)) {
		return str.match(re.multiCharWord)[0].length;
	} else {
		return 1;
	}
}

	/*
	3 scenarios:
	
	- current word fits on line -- add to current line
	- current word doesn't fit on line, and current word is bigger than an entire line -- fill current line with substring of current word and start a new line
	- current word doesn't fit on line, and current word fits on a line -- start a new line
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
		return stringStartOffset + lastWordIndex;
	}
}

module.exports = function(line, indentation, measurements, availableWidth) {
	let {colWidth} = measurements;
	let screenCols = Math.floor(availableWidth / colWidth);
	
	let unwrapped = {
		line,
		height: 1,
		rows: [
			{
				startOffset: 0,
				string: line.string,
				width: line.width,
				variableWidthParts: line.variableWidthParts,
			},
		],
	};
	
	if (availableWidth < colWidth) {
		return unwrapped;
	}
	
	if (line.width <= screenCols) {
		return unwrapped;
	}
	
	/*
	calculate indent width to 1) check whether initial whitespace should
	be treated as an indent or just a long string of spaces (depending on
	how much space there would be left for non-whitespace characters), and
	2) indent wrapped lines to the same level as the main line
	*/
	
	let textCols = screenCols - line.indentCols;
	
	if (textCols < indentation.colsPerIndent) {
		return unwrapped;
	}
	
	let availableCols = screenCols;
	let currentlyAvailableCols = availableCols;
	
	let startOffset = 0;
	let stringStartOffset = 0;
	
	let rows = [{
		startOffset,
		string: "",
		width: 0,
		variableWidthParts: [],
	}];
	
	for (let i = 0; i < line.variableWidthParts.length; i++) {
		let [type, value] = line.variableWidthParts[i];
		
		let row = rows[rows.length - 1];
		
		if (type === "tab") {
			stringStartOffset = 0;
			
			if (value <= currentlyAvailableCols) {
				row.variableWidthParts.push([type, value]);
				row.string += "\t";
				row.width += value;
				
				startOffset++;
				
				currentlyAvailableCols -= value;
			} else {
				// tab doesn't fit on current line (but will fit on next line because textCols
				// >= indent width) - start a new line
				
				rows.push({
					startOffset,
					string: "",
					width: 0,
					variableWidthParts: [],
				});
				
				availableCols = textCols;
				currentlyAvailableCols = availableCols;
				
				i--;
			}
			
			continue;
		}
		
		//debugger;
		
		let breakPoint = findNextBreakPoint(value, stringStartOffset, currentlyAvailableCols, availableCols);
		
		let part = value.substring(stringStartOffset, breakPoint);
		
		row.variableWidthParts.push([type, part]);
		row.string += part;
		row.width += part.length;
		
		startOffset += part.length;
		stringStartOffset += part.length;
		
		currentlyAvailableCols -= part.length;
		
		if (breakPoint !== value.length) {
			rows.push({
				startOffset,
				string: "",
				width: 0,
				variableWidthParts: [],
			});
			
			availableCols = textCols;
			currentlyAvailableCols = availableCols;
			
			i--;
		}
	}
	
	if (rows.length > 1) {
		console.log(rows);
	}
	
	return {
		line,
		height: rows.length,
		rows,
	};
}
