let Selection = require("../../../../utils/Selection");
let Cursor = require("../../../../utils/Cursor");

let {s} = Selection;
let {c} = Cursor;

module.exports = function(treeSitterRange) {
	let {
		startIndex,
		endIndex,
		startPosition,
		endPosition,
	} = treeSitterRange;
	
	return {
		startIndex,
		endIndex,
		selection: s(c(startPosition.row, startPosition.column), c(endPosition.row, endPosition.column)),
	};
}
