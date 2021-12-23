let middle = require("utils/middle");
let next = require("./next");
let nodeGetters = require("./nodeGetters");

function isOn(node, cursor) {
	let {row, column} = nodeGetters.startPosition(node);
	
	return row === cursor.lineIndex && column === cursor.offset;
}

function isAfter(node, cursor) {
	let {row, column} = nodeGetters.startPosition(node);
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column > cursor.offset
	);
}

function endsAfter(node, cursor) {
	let {row, column} = nodeGetters.endPosition(node);
	
	return (
		row > cursor.lineIndex
		|| row === cursor.lineIndex && column > cursor.offset
	);
}

module.exports = function(node, cursor) {
	if (isOnOrAfter(node, cursor)) {
		return node;
	}
	
	let children = nodeGetters.children(node);
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
			
			if (endIndex === 0) {
				break;
			}
			
			continue;
		}
		
		if (endsAfter(child, cursor) && nodeGetters.children(child).length > 0) {
			node = child;
			children = nodeGetters.children(node);
			startIndex = 0;
			endIndex = children.length;
			foundContainingNode = true;
			first = null;
			
			continue;
		}
		
		startIndex = index + 1;
			
		if (startIndex === children.length) {
			break;
		}
	}
	
	/*
	the cursor might be within a node that doesn't have children, in which case
	the first node after the cursor will be the next node
	*/
	
	if (foundContainingNode && !first) {
		return next(node);
	}
	
	return first;
}
