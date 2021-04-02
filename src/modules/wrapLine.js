let minNonWhitespaceCols = 16;

let wordRe = /[\w_]/;
let nonWordRe = /[^\w_]/;

function getCurrentWordAndSpaceWidth(line, col) {
	// find the index of the next command (the one that starts at col)
	
	let c = 0;
	let commandIndex = 0;
	
	while (c < col) {
		let command = line.commands[commandIndex];
		
		if (!command) {
			break;
		}
		
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "T") {
			c += Number(value);
		} else if (type === "S" || type === "B") {
			c += value.length;
		}
		
		commandIndex++;
	}
	
	// consume commands until we have a word and a space if present
	
	let width = 0;
	let foundSpace = false;
	
	while (true) {
		let command = line.commands[commandIndex];
		
		if (!command) {
			break;
		}
		
		let [type, value] = [command[0], command.substr(1)];
		
		// TODO each symbol is its own word - match single non-word char, or word{0,}
		
		if (type === "C") {
			continue;
		}
		
		if (type === "T") {
			c += Number(value);
			
			foundSpace = true;
		} else if (type === "S" || type === "B") {
			c += value.length;
		}
		
		commandIndex++;
	}
	
	return width;
}

function getCurrentWordWidth(line, col) {
	
}

module.exports = function(line, measurements, screenWidth) {
	let {colWidth} = measurements;
	let screenCols = screenWidth / colWidth; // might have decimal places, doesn't matter for calculation
	
	line.height = 1;
	
	delete line.wrappedLines;
	delete line.wrapIndentCols;
	
	if (line.width <= screenCols) {
		return;
	}
	
	/*
	calculate indent width to 1) check whether initial whitespace should
	be treated as an indent or just a long string of spaces (depending on
	how much space there would be left for non-whitespace characters), and
	2) indent wrapped lines to the same level as the main line
	*/
	
	let indentCols = 0;
	
	console.log(line);
	
	cmds: for (let command of line.commands) {
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "S") {
			for (let ch of value) {
				if (ch === " ") {
					indentCols++;
				} else {
					break cmds;
				}
			}
		} else if (type === "T") {
			indentCols += Number(value);
		}
	}
	
	let isIndented = screenCols - indentCols >= minNonWhitespaceCols;
	let availableCols = isIndented ? screenCols - indentCols : screenCols;
	
	if (isIndented) {
		line.wrapIndentCols = indentCols;
	}
	
	/*
	
	*/
	
	line.wrappedLines = [];
	
	let currentlyAvailableCols = availableCols;
	
	let wrappedLine = {
		width: 0,
		commands: [],
	};
	
	/*
	3 scenarios:
	
	- current word + space fits on line -- add to current line
	- current word + space doesn't fit on line, and current word is bigger than an entire line -- fill current line with substring of current word and start a new line
	- current word + space doesn't fit on line, and current word fits on a line -- start a new line
	*/
	
	let commands = [...line.commands];
	let col = 0;
	
	while (true) {
		if (getCurrentWordAndSpaceWidth(line, col) <= currentlyAvailableCols) {
			// word and space fits on current line - add to current line
			
			while (true) {
				let command = commands.shift();
				
				if (!command) {
					break;
				}
				
				let [type, value] = [command[0], command.substr(1)];
				
				if (type === "C") {
					wrappedLine.commands.push(command);
					
					continue;
				}
				
				if (type === "T") {
					let width = Number(value);
					
					wrappedLine.commands.push(command);
					wrappedLine.width += width;
					col += width;
					
					break;
				}
				
				let splitIndex = value.indexOf(" ");
				
				if (splitIndex !== -1) {
					let [wordAndSpace, rest] = [value.substr(0, splitIndex + 1), value.substr(splitIndex + 1)];
					
					wrappedLine.commands.push(type + wordAndSpace);
					wrappedLine.width += wordAndSpace.length;
					col += wordAndSpace.length;
					
					// add the unused chars back to the list
					
					if (rest.length > 0) {
						commands.unshift(type + rest);
					}
					
					break;
				} else {
					wrappedLine.commands.push(type + value);
					wrappedLine.width += value.length;
					col += value.length;
				}
			}
			
			currentlyAvailableCols = availableCols - wrappedLine.width;
		} else {
			if (getCurrentWordWidth(line, col) > availableCols) {
				// word doesn't fit on a line - split it to fill the current
				// line and then start a new line
				
				while (true) {
					let command = commands.shift();
					
					let [type, value] = [command[0], command.substr(1)];
					
					if (type === "C") {
						wrappedLine.commands.push(command);
						
						continue;
					}
					
					let [fill, rest] = [value.substr(0, currentlyAvailableCols), value.substr(currentlyAvailableCols)];
						
					wrappedLine.commands.push(type + fill);
					
					if (rest.length > 0) {
						commands.unshift(type + rest);
					}
					
					col += fill.length;
					
					if (col === availableCols) {
						break;
					}
				}
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					width: 0,
					commands: [],
				};
				
				currentlyAvailableCols = availableCols;
			} else {
				// word and next space doesn't fit on current line but will fit
				// on next line - start a new line
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					width: 0,
					commands: [],
				};
				
				currentlyAvailableCols = availableCols;
			}
		}
		
		if (col === line.width) {
			break;
		}
	}
}
