let getOpenersAndClosersOnLine = require("./getOpenersAndClosersOnLine");
let dropTargets = require("./dropTargets");

function isIfFooter(lines, lineIndex) {
	return getOpenersAndClosersOnLine(lines[lineIndex]).closers.length === 1;
}

module.exports = function(lines, lineIndex, selection, option) {
	let targets = [];
	
	let line = lines[lineIndex];
	
	let {openers, closers} = getOpenersAndClosersOnLine(line);
	
	if (isIfFooter(lines, lineIndex)) {
		targets.push(
			dropTargets.addSelectionToNewElse,
			dropTargets.addSelectionToNewElseIf,
		);
	}
	
	return targets;
}
