let middle = require("utils/middle");
let prev = require("./prev");

function findLeftMostSiblingOnSameLine(children, nodeIndex, lineIndex) {
	let startIndex = 0;
	let endIndex = nodeIndex;
	let node = children[nodeIndex];
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.startPosition.row === lineIndex && (index === 0 || children[index - 1].startPosition.row !== lineIndex)) {
			node = child;
			
			break;
		} else if (child.startPosition.row < lineIndex && child.endPosition.row === lineIndex) {
			children = child.children;
			startIndex = 0;
			endIndex = children.length;
		} else {
			if (child.startPosition.row === lineIndex) {
				endIndex = index;
				
				if (endIndex === 0) {
					break;
				}
			} else {
				startIndex = index + 1;
				
				if (startIndex === children.length) {
					break;
				}
			}
		}
	}
	
	return node;
}

function findSmallestSubtreeContainingFirstNodeOnLine(node, lineIndex) {
	let children = node.children;
	let startIndex = 0;
	let endIndex = children.length;
	
	//debugger
	
	while (true) {
		if (endIndex - startIndex === 0) {
			return node;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.startPosition.row === lineIndex) {
			let prevChild;
			
			while ((prevChild = prev(child))?.startPosition.row === lineIndex) {
				child = prevChild;
			}
			
			return child;
		} else if (child.startPosition.row < lineIndex && child.endPosition.row >= lineIndex) {
			node = child;
			children = node.children;
			startIndex = 0;
			endIndex = children.length;
		} else if (child.startPosition.row < lineIndex) {
			startIndex = index + 1;
			
			if (startIndex === children.length) {
				return node;
			}
		} else {
			endIndex = index;
			
			if (endIndex === 0) {
				return node;
			}
		}
	}
}

module.exports = function(tree, lineIndex) {
	return findSmallestSubtreeContainingFirstNodeOnLine(tree.rootNode, lineIndex);
}
