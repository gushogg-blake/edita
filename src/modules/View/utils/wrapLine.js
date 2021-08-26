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

module.exports = function(line, indentation, measurements, availableWidth) {
	let {colWidth} = measurements;
	let screenCols = Math.floor(availableWidth / colWidth);
	
	let {
		variableWidthParts,
		renderCommands,
	} = line;
	
	let unwrapped = {
		line,
		height: 1,
		rows: [
			{
				startOffset: 0,
				string: line.string,
				width: line.width,
				variableWidthParts,
				renderCommands,
			},
		],
	};
	
	return unwrapped; //
	
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
	
	/*
	TODO give each row variableWidthParts and renderCommands
	*/
	
	let availableCols = screenCols;
	let currentlyAvailableCols = availableCols;
	
	let startOffset = 0;
	let stringStartOffset = 0;
	
	let rows = [{
		startOffset,
		string: "",
		width: 0,
		variableWidthParts: [],
		renderCommands: [],
	}];
	
	for (let i = 0; i < renderCommands.length; i++) {
		let command = renderCommands[i];
		
		let row = rows[rows.length - 1];
		
		if (command.type === "tab") {
			let {width} = command;
			
			stringStartOffset = 0;
			
			if (width <= currentlyAvailableCols) {
				row.variableWidthParts.push(["tab", width]);
				row.string += "\t";
				row.width += width;
				
				startOffset++;
				
				currentlyAvailableCols -= width;
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
		} else if (command.type === "node") {
			let {node} = command;
			let str = node.text;
			
			stringStartOffset = 0;
			
			/*
			language nodes can go off the end, as we don't want to deal with
			breaking in the middle of them for ease of rendering
			*/
			
			if (str.length <= currentlyAvailableCols || str.length > availableCols) {
				row.variableWidthParts.push(["string", str]);
				row.string += str;
				row.width += str.length;
				
				startOffset += str.length;
				
				currentlyAvailableCols -= str.length;
				currentlyAvailableCols = Math.max(0, currentlyAvailableCols);
			}
			
			if (currentlyAvailableCols === 0 && i < renderCommands.length - 1) {
				rows.push({
					startOffset,
					string: "",
					width: 0,
					variableWidthParts: [],
				});
				
				availableCols = textCols;
				currentlyAvailableCols = availableCols;
			}
		} else if (command.type === "string") {
			let {string} = command;
			
			let breakPoint = findNextBreakPoint(string, stringStartOffset, currentlyAvailableCols, availableCols);
			
			let part = string.substring(stringStartOffset, breakPoint);
			
			row.variableWidthParts.push(["string", part]);
			row.string += part;
			row.width += part.length;
			
			startOffset += part.length;
			stringStartOffset += part.length;
			
			currentlyAvailableCols -= part.length;
			
			if (breakPoint !== string.length) {
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
	}
	
	return {
		line,
		height: rows.length,
		rows,
	};
}
