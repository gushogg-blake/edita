let dropTargets = require("./dropTargets");

function isIfFooter(document, lineIndex) {
	let nodes = document.getNodesOnLine(lineIndex);
	
	return nodes.some(function(node) {
		return node.type === "}" && node.parent?.parent?.type === "if_statement";
	});
}

module.exports = function(document, lineIndex) {
	let targets = [];
	
	if (isIfFooter(document, lineIndex)) {
		targets.push(
			dropTargets.addSelectionToNewElse,
			dropTargets.addSelectionToNewElseIf,
		);
	}
	
	return targets;
}
