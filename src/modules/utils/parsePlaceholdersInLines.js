let parsePlaceholders = require("./parsePlaceholders");

/*
input:

	- lines (array of strings) with [[%type:value]] placeholders
	- baseLineIndex - line index of the first line

output:

	- lines with placeholders replaced with default (for e.g. tabstops) or empty
	string
	- array of placeholder details - type, value, initialText (e.g. default value)
	and cursor (actual line index calculated from baseLineIndex, and offset)
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
			return {
				...placeholder,
				lineIndex: baseLineIndex + i,
			};
		}));
		
		replacedLines.push(string);
	}
	
	return {
		lines: replacedLines,
		placeholders,
	};
}
