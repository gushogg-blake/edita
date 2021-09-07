let findSmallestSubtreeContainingFirstNodeOnLine = require("./findSmallestSubtreeContainingFirstNodeOnLine");
let next = require("./next");

module.exports = function*(tree, lineIndex) {
	let subtree = findSmallestSubtreeContainingFirstNodeOnLine(tree, lineIndex);
	
	if (subtree.startPosition.row < lineIndex) {
		return;
	}
	
	let node = subtree;
	
	while (true) {
		yield node;
		
		node = next(node);
		
		if (!node || node.startPosition.row !== lineIndex) {
			break;
		}
	}
}
