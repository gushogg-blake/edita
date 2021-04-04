let {wordRe, nonWordRe} = require("./config");

module.exports = function(line, col) {
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
