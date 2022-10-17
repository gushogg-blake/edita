let Cursor = require("modules/utils/Cursor");
let findFirstNodeOnOrAfterCursor = require("./findFirstNodeOnOrAfterCursor");
let nodeUtils = require("./nodeUtils");

let {c} = Cursor;

module.exports = function*(searchNode, lineIndex, startOffset) {
	let node = findFirstNodeOnOrAfterCursor(searchNode, c(lineIndex, startOffset));
	
	while (node && nodeUtils.startPosition(node).row === lineIndex) {
		yield node;
		
		node = nodeUtils.next(node);
	}
}
