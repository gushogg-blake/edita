let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");

function isElseIfHeader(lines, lineIndex) {
	
}

module.exports = function(lines, lineIndex, pickedElementType) {
	let targets = [];
	
	let line = lines[lineIndex];
	
	let {openers, closers} = getOpenersAndClosersOnLine(line);
	
	if (isElseIfFooter(lines, lineIndex)) {
		targets.push(
			"addSelectionToNewElse",
			"addSelectionToNewElseIf",
		);
	}
}
