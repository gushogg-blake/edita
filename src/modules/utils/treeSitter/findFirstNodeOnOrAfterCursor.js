let middle = require("utils/middle");
let nodeUtils = require("./nodeUtils");

function isOn(node, cursor) {
	let {row, column} = nodeUtils.startPosition(node);
	
	return row === cursor.lineIndex && column === cursor.offset;
}

function isAfter(node, cursor) {
	return nodeUtils.compareCharCursor(node, cursor) === "cursorBeforeNode";
}

function endsAfter(node, cursor) {
	let {row, column} = nodeUtils.endPosition(node);
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column > cursor.offset
	);
}

module.exports = function(node, cursor) {
	if (isOn(node, cursor) || isAfter(node, cursor)) {
		return node;
	}
	
	let children = nodeUtils.children(node);
	let startIndex = 0;
	let endIndex = children.length;
	let first = null;
	let foundContainingNode = false;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (isOn(child, cursor)) {
			return child;
		}
		
		if (isAfter(child, cursor)) {
			first = child;
			endIndex = index;
			
			continue;
		}
		
		if (endsAfter(child, cursor) && nodeUtils.children(child).length > 0) {
			node = child;
			children = nodeUtils.children(node);
			startIndex = 0;
			endIndex = children.length;
			foundContainingNode = true;
			first = null;
			
			continue;
		}
		
		startIndex = index + 1;
	}
	
	/*
	we might have landed on a node that doesn't have any children on or
	after the cursor, in which case we go next until the node is on or
	after the cursor
	*/
	
	if (foundContainingNode && !first) {
		let n = nodeUtils.next(nodeUtils.lastChild(node) || node);
		
		while (n) {
			if (isOn(n, cursor) || isAfter(n, cursor)) {
				first = n;
				
				break;
			}
			
			n = nodeUtils.next(n);
		}
	}
	
	return first;
}
