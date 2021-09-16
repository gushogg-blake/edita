let middle = require("utils/middle");

function isOnOrAfter(node, cursor) {
	let {row, column} = node.startPosition;
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column >= cursor.offset
	);
}

function endsAfter(node, cursor) {
	let {row, column} = node.endPosition;
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column > cursor.offset
	);
}

function findFirstNodeOnOrAfterCursor(node, cursor) {
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
				break;
			}
		} else if (endsAfter(child, cursor) && child.children.length > 0) {
			node = child;
			children = node.children;
			startIndex = 0;
			endIndex = children.length;
		} else {
			startIndex = index + 1;
			
			if (startIndex === children.length) {
				break;
			}
		}
	}
	
	return first;
}

module.exports = function(tree, cursor) {
	return findFirstNodeOnOrAfterCursor(tree.rootNode, cursor);
}
