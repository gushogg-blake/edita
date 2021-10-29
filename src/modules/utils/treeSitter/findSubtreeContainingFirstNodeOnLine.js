let middle = require("utils/middle");
let nodeGetters = require("./nodeGetters");
let prev = require("./prev");

/*
finds either the largest node that starts on the line, or if no nodes start
on the line, the smallest node that contains the line (starts before and
ends on or after)
*/

module.exports = function(node, lineIndex) {
	let children = nodeGetters.children(node);
	let startIndex = 0;
	let endIndex = children.length;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			return node;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (nodeGetters.startPosition(child).row === lineIndex) {
			let prevChild;
			
			while ((prevChild = prev(child)) && nodeGetters.startPosition(prevChild).row === lineIndex) {
				child = prevChild;
			}
			
			return child;
		} else if (nodeGetters.startPosition(child).row < lineIndex && nodeGetters.endPosition(child).row >= lineIndex) {
			node = child;
			children = nodeGetters.children(node);
			startIndex = 0;
			endIndex = children.length;
		} else if (nodeGetters.startPosition(child).row < lineIndex) {
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
