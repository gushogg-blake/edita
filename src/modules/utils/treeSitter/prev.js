//module.exports = function(node) {
//	if (node.previousSibling) {
//		node = node.previousSibling;
//		
//		while (node.lastChild) {
//			node = node.lastChild;
//		}
//		
//		return node;
//	}
//	
//	if (node.parent) {
//		return node.parent;
//	}
//	
//	return null;
//}

// NOTE tree-sitter has a bug where zero-length nodes don't have
// the right parent, so we skip them

let cachedNodeFunction = require("./cachedNodeFunction");
let nodeGetters = require("./nodeGetters");

module.exports = cachedNodeFunction(function(node) {
	let previousSibling = nodeGetters.previousSibling(node);
	
	if (previousSibling) {
		node = previousSibling;
		
		let lastChild;
		
		while (lastChild = nodeGetters.lastChild(node)) {
			node = lastChild;
		}
		
		return node;
	}
	
	let parent = nodeGetters.parent(node);
	
	if (parent) {
		return parent;
	}
	
	return null;
});
