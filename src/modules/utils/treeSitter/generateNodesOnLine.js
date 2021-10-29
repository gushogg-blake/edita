let Cursor = require("modules/utils/Cursor");
let findFirstNodeOnOrAfterCursor = require("./findFirstNodeOnOrAfterCursor");
let next = require("./next");
let nodeGetters = require("./nodeGetters");

let {c} = Cursor;

module.exports = function*(searchNode, lineIndex, startOffset) {
	let node = findFirstNodeOnOrAfterCursor(searchNode, c(lineIndex, startOffset));
	
	while (node && nodeGetters.startPosition(node).row === lineIndex) {
		yield node;
		
		node = next(node);
	}
}
