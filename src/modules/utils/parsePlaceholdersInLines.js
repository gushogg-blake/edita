let Cursor = require("modules/utils/Cursor");
let Selection = require("modules/utils/Selection");
let parsePlaceholders = require("modules/utils/parsePlaceholders");

let {c} = Cursor;
let {s} = Selection;

/*
input:

	- lines (array of strings) with [[%type:value]] placeholders
	- baseLineIndex - line index of the first line
	- baseOffset - start offset on first line

output:

	- lines with placeholders replaced with default (for e.g. tabstops) or empty
	string
	- array of placeholder details - type, value, initialText (e.g. default value)
	and selection
*/

module.exports = function(lines, baseLineIndex=0, baseOffset=0) {
	let replacedLines = [];
	let placeholders = [];
	
	for (let i = 0; i < lines.length; i++) {
		let startOffset = i === 0 ? baseOffset : 0;
		let line = lines[i];
		
		let {
			string,
			placeholders: linePlaceholders,
		} = parsePlaceholders(line);
		
		placeholders.push(...linePlaceholders.map(function(placeholder) {
			let {offset, initialText} = placeholder;
			let lineIndex = baseLineIndex + i;
			let selection = s(c(lineIndex, startOffset + offset), c(lineIndex, startOffset + offset + initialText.length));
			
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
