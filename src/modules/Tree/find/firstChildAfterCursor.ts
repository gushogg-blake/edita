let middle = require("utils/middle");

module.exports = function(node, cursor) {
	let {children} = node;
	let startIndex = 0;
	let endIndex = children.length;
	let first = null;
	
	while (endIndex - startIndex > 0) {
		let index = middle(startIndex, endIndex);
		let child = children[index];
		
		if (child.start.isAfter(cursor)) {
			first = child;
			endIndex = index;
		} else {
			startIndex = index + 1;
		}
	}
	
	return first;
}
