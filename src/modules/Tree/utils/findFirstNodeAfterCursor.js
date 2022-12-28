let middle = require("utils/middle");
let nodeUtils = require("./nodeUtils");

/*
given a node and a cursor, find the first node within or after the
given node (or the node itself) that starts after the cursor, ie.
there is a gap of at least one char between the cursor and the
start of the node.
*/

module.exports = function(node, cursor) {
	if (nodeUtils.isAfter(node, cursor)) {
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
		
		if (nodeUtils.isAfter(child, cursor)) {
			first = child;
			endIndex = index;
			
			continue;
		}
		
		if (nodeUtils.endsAfter(child, cursor) && nodeUtils.children(child).length > 0) {
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
	we might have landed on a node that doesn't have any children after
	the cursor, in which case we go next until the node is after the
	cursor
	*/
	
	if (foundContainingNode && !first) {
		let n = nodeUtils.next(nodeUtils.lastChild(node) || node);
		
		while (n) {
			if (nodeUtils.isAfter(n, cursor)) {
				first = n;
				
				break;
			}
			
			n = nodeUtils.next(n);
		}
	}
	
	return first;
}
