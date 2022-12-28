let middle = require("utils/middle");
let Cursor = require("modules/Cursor");

let conversions = require("./conversions");
let nodeUtils = require("./nodeUtils");
let nodeGetters = require("./nodeGetters");

let findFirstChildAfterCursor = require("./findFirstChildAfterCursor");

let {c} = Cursor;

module.exports = {
	...conversions,
	
	nodeUtils,
	nodeGetters,
	
	findFirstChildAfterCursor,
	
	//findFirstChildAfterCursor(node, cursor) {
	//	let children = nodeUtils.children(node);
	//	let startIndex = 0;
	//	let endIndex = children.length;
	//	let first = null;
	//	
	//	while (endIndex - startIndex > 0) {
	//		let index = middle(startIndex, endIndex);
	//		let child = children[index];
	//		
	//		if (nodeUtils.isAfter(child, cursor)) {
	//			first = child;
	//			endIndex = index;
	//		} else {
	//			startIndex = index + 1;
	//		}
	//	}
	//	
	//	return first;
	//},
};
