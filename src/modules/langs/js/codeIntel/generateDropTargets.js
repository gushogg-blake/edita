let dropTargets = require("./dropTargets");

function isIfFooter(lines, lineIndex) {
	return lines[lineIndex].closers.length === 1; //
}

module.exports = function(lines, lineIndex) {
	let targets = [];
	
	let line = lines[lineIndex];
	
	if (isIfFooter(lines, lineIndex)) {
		targets.push(
			dropTargets.addSelectionToNewElse,
			dropTargets.addSelectionToNewElseIf,
		);
	}
	
	return targets;
}
