let parsePlaceholders = require("modules/utils/parsePlaceholders");

/*
input:

	- lines (array of strings) with placeholders
	- baseLineIndex - line index of the first line
	
	baseLineIndex adjusts the selections returned with the placeholders so
	that they reflect the proper position with the document if the passed
	lines are not the whole document

output:

	- lines with placeholders replaced with empty string
	- array of placeholders
*/

module.exports = function(lines, baseLineIndex=0) {
	let replacedLines = [];
	let placeholders = [];
	
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		
		let {
			replacedString,
			placeholders: linePlaceholders,
		} = parsePlaceholders(line, baseLineIndex + i);
		
		placeholders = [...placeholders, ...linePlaceholders];
		
		replacedLines.push(replacedString);
	}
	
	return {
		replacedLines,
		placeholders,
	};
}
