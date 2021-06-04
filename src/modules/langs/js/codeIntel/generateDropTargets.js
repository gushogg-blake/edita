let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");

function isIfFooter(lines, lineIndex) {
	
}

module.exports = function(lines, lineIndex, pickedElementType) {
	let targets = [];
	
	let line = lines[lineIndex];
	
	let {openers, closers} = getOpenersAndClosersOnLine(line);
	
	if (isIfFooter(lines, lineIndex)) {
		targets.push(
			"addSelectionToNewElse",
			"addSelectionToNewElseIf",
		);
	}
}
