let findSubtreeContainingFirstNodeOnLine = require("./findSubtreeContainingFirstNodeOnLine");
let nodeGetters = require("./nodeGetters");

module.exports = function(node, lineIndex) {
	let subtree = findSubtreeContainingFirstNodeOnLine(node, lineIndex);
	
	if (nodeGetters.startPosition(subtree).row < lineIndex) {
		return null;
	}
	
	return subtree;
}
