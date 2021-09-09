let middle = require("utils/middle");

function isOnOrAfter(node, cursor) {
	let {row, column} = node.startPosition;
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column >= cursor.offset
	);
}

function findFirstNodeOnOrAfterCursor(node, cursor) {
	let {lineIndex, offset} = cursor;
	let children = node.children;
	let startIndex = 0;
	let endIndex = children.length;
	let first = null;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (isOnOrAfter(child, cursor)) {
			first = child;
			endIndex = index;
			
			if (endIndex === 0) {
				return node;
			}
		} else if (contains(child, cursor)) {
			node = child;
			children = node.children;
			startIndex = 0;
			endIndex = children.length;
		} else {
			startIndex = index + 1;
			
			if (startIndex === children.length) {
				return node;
			}
		}
	}
}

module.exports = function(tree, cursor) {
	return findFirstNodeOnOrAfterCursor(tree.rootNode, cursor);
}
