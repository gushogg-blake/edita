let getNewline = require("modules/utils/getNewline");
let guessIndent = require("modules/utils/guessIndent");
let getIndentLevel = require("modules/utils/getIndentLevel");
let getIndentationDetails = require("modules/utils/getIndentationDetails");

module.exports = function(str) {
	let lines = str.split(getNewline(str));
	let indentationDetails = getIndentationDetails(guessIndent(str));
	
	return lines.map(function(line) {
		return [
			getIndentLevel(line, indentationDetails).level,
			line.trimLeft(),
		];
	});
}
