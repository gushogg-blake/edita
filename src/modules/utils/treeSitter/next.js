//module.exports = function(node) {
//	if (node.firstChild) {
//		return node.firstChild;
//	}
//	
//	if (node.nextSibling) {
//		return node.nextSibling;
//	}
//	
//	while (node = node.parent) {
//		if (node.nextSibling) {
//			return node.nextSibling;
//		}
//	}
//	
//	return null;
//}

// NOTE tree-sitter has a bug where zero-length nodes don't have
// the right parent, so we skip them

let cachedNodeFunction = require("./cachedNodeFunction");
let nodeGetters = require("./nodeGetters");

module.exports = cachedNodeFunction(function(node) {
	let firstChild = nodeGetters.firstChild(node);
	
	if (firstChild) {
		return firstChild;
	}
	
	let nextSibling = nodeGetters.nextSibling(node);
	
	if (nextSibling) {
		return nextSibling;
	}
	
	while (node = node.parent) {
		let nextSibling = nodeGetters.nextSibling(node);
		
		if (nextSibling) {
			return nextSibling;
		}
	}
	
	return null;
});
