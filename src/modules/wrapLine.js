let minNonWhitespaceCols = 16;

let wordRe = /^[\w_]+/;
let nonWordRe = /[^\w_]/;

let wordAndSpaceRe = /^( |[^\w_] ?|[\w_]+ ?)/;

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
	
	// find word (string of word chars or single non-word char)
	// if word is non-whitespace, find immediately following whitespace
	
	while (true) {
		let command = line.commands[commandIndex];
		
		if (!command) {
			return 0;
		}
		
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "T") {
			return Number(value);
		}
		
		if (type === "S" || type === "B") {
			if (value[0] === " ") {
				return 1;
			}
			
			let word;
			
			if (value[0].match(nonWordRe)) {
				word = value[0];
			} else {
				word = value.match(wordRe)[0];
			}
			
			if (value.substr(word.length)[0] === " ") {
				return word.length + 1;
			} else if (value.length > word.length) {
				return word.length;
			}
			
			commandIndex++;
			
			while (true) {
				let command = line.commands[commandIndex];
				
				if (!command) {
					return word.length;
				}
				
				let [type, value] = [command[0], command.substr(1)];
				
				if (type === "T") {
					return word.length + Number(value);
				}
				
				if (type === "S" || type === "B") {
					if (value[0] === " ") {
						return word.length + 1;
					} else {
						return word.length;
					}
				}
				
				commandIndex++;
			}
		}
		
		commandIndex++;
	}
}

function getCurrentWordWidth(line, col) {
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
	
	// find word (string of word chars or single non-word char)
	
	while (true) {
		let command = line.commands[commandIndex];
		
		if (!command) {
			return 0;
		}
		
		let [type, value] = [command[0], command.substr(1)];
		
		if (type === "T") {
			return Number(value);
		}
		
		if (type === "S" || type === "B") {
			if (value[0] === " ") {
				return 1;
			}
			
			let word;
			
			if (value[0].match(nonWordRe)) {
				word = value[0];
			} else {
				word = value.match(wordRe)[0];
			}
			
			return word.length;
		}
		
		commandIndex++;
	}
}

module.exports = function(line, measurements, screenWidth) {
	console.time("wrap line");
	
	let {colWidth} = measurements;
	let screenCols = Math.floor(screenWidth / colWidth);
	
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
	let availableCols = screenCols;
	
	if (isIndented) {
		line.wrapIndentCols = indentCols;
	}
	
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
				
				let wordAndSpace = value.match(wordAndSpaceRe)[0];
				
				if (wordAndSpace.length < value.length) {
					let rest = value.substr(wordAndSpace.length);
					
					commands.unshift(type + rest);
				}
				
				wrappedLine.commands.push(type + wordAndSpace);
				wrappedLine.width += wordAndSpace.length;
				col += wordAndSpace.length;
				
				// there may be a space to add as well, but it's simpler to just
				// let the next loop pick it up
				
				break;
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
					wrappedLine.width += fill.length;
					
					if (wrappedLine.width === availableCols) {
						break;
					}
				}
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					width: 0,
					commands: [],
				};
				
				if (isIndented) {
					availableCols = screenCols - indentCols;
				}
				
				currentlyAvailableCols = availableCols;
			} else {
				// word and next space doesn't fit on current line but will fit
				// on next line - start a new line
				
				line.wrappedLines.push(wrappedLine);
				
				wrappedLine = {
					width: 0,
					commands: [],
				};
				
				if (isIndented) {
					availableCols = screenCols - indentCols;
				}
				
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
	
	console.timeEnd("wrap line");
}
