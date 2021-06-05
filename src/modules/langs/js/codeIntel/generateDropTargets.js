let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");

function isIfFooter(lines, lineIndex) {
	return getOpenersAndClosersOnLine(lines[lineIndex]).closers.length === 1;
}

module.exports = function(lines, lineIndex, selection, option) {
	let targets = [];
	
	let line = lines[lineIndex];
	
	let {openers, closers} = getOpenersAndClosersOnLine(line);
	
	if (isIfFooter(lines, lineIndex)) {
		targets.push(
			"addSelectionToNewElse",
			"addSelectionToNewElseIf",
		);
	}
	
	return targets;
}
