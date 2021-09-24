let findSubtreeContainingFirstNodeOnLine = require("./findSubtreeContainingFirstNodeOnLine");

module.exports = function(node, lineIndex) {
	let subtree = findSubtreeContainingFirstNodeOnLine(node, lineIndex);
	
	if (subtree.startPosition.row < lineIndex) {
		return null;
	}
	
	return subtree;
}
