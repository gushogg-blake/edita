let Cursor = require("./Cursor");
let Selection = require("./Selection");
let parsePlaceholders = require("./parsePlaceholders");

let {c} = Cursor;
let {s} = Selection;

/*
input:

	- lines (array of strings) with [[%type:value]] placeholders
	- baseLineIndex - line index of the first line

output:

	- lines with placeholders replaced with default (for e.g. tabstops) or empty
	string
	- array of placeholder details - type, value, initialText (e.g. default value)
	and selection
*/

module.exports = function(lines, baseLineIndex=0) {
	let replacedLines = [];
	let placeholders = [];
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		let {
			string,
			placeholders: linePlaceholders,
		} = parsePlaceholders(line);
		
		placeholders.push(...linePlaceholders.map(function(placeholder) {
			let {offset, initialText} = placeholder;
			let lineIndex = baseLineIndex + i;
			let selection = s(c(lineIndex, offset), c(lineIndex, offset + initialText.length));
			
			return {
				...placeholder,
				selection,
			};
		}));
		
		replacedLines.push(string);
	}
	
	return {
		lines: replacedLines,
		placeholders,
	};
}
