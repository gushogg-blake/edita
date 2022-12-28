let Cursor = require("modules/Cursor");
let findFirstNodeOnOrAfterCursor = require("./findFirstNodeOnOrAfterCursor");

let {c} = Cursor;

module.exports = function*(searchNode, lineIndex, startOffset) {
	let node = findFirstNodeOnOrAfterCursor(searchNode, c(lineIndex, startOffset));
	
	while (node?.start.lineIndex === lineIndex) {
		yield node;
		
		node = node.next();
	}
}
