let middle = require("utils/middle");
let nodeGetters = require("./nodeGetters");

module.exports = function(node, lineIndex) {
	let children = nodeGetters.children(node)
	let startIndex = 0;
	let endIndex = children.length;
	let lastChildBeforeLine = null;
	
	while (true) {
		if (endIndex - startIndex === 0) {
			break;
		}
		
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (nodeGetters.startPosition(child).row > lineIndex) {
			endIndex = index;
			
			if (endIndex === 0) {
				break;
			}
		} else {
			lastChildBeforeLine = child;
			
			startIndex = index + 1;
			
			if (startIndex === children.length) {
				break;
			}
		}
	}
	
	while (lastChildBeforeLine && nodeGetters.lastChild(lastChildBeforeLine)) {
		lastChildBeforeLine = nodeGetters.lastChild(lastChildBeforeLine);
	}
	
	return lastChildBeforeLine;
}
